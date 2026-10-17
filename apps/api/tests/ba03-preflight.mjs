// Manual opt-in only. This entry gate is deliberately read-only; no automatic test imports it.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

if (process.env.BA03_ACCEPT_STAGING !== 'YES') throw new Error('Explicit BA-03 staging opt-in required');
const migrated = process.argv[2] === '--preflight-migrated';
if (!migrated && process.argv[2] !== '--preflight') throw new Error('Only the read-only preflight entry gate is implemented');
// Load settings/driver only after explicit opt-in and mode validation.
const { Pool } = await import('pg');
const { readConfiguration } = await import('../dist/ba02-check/infrastructure/configuration.js');
const config = readConfiguration(process.env);
const root = resolve(import.meta.dirname, '../../..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const hash = (value) => createHash('sha256').update(value).digest('hex');
const candidatePaths = [...new Set(git('ls-files', '--cached', '--others', '--exclude-standard', 'apps/api/src', 'apps/api/migrations', 'apps/api/tests', 'apps/api/tsconfig.json', 'apps/api/package.json', 'pnpm-lock.yaml').split('\n'))].filter((p) => p && !p.includes('/evidence/')).sort();
const candidate = { revision: git('rev-parse', 'HEAD'), files: await Promise.all(candidatePaths.map(async (path) => ({ path, sha256: hash(await readFile(resolve(root, path))) }))) };
candidate.sha256 = hash(JSON.stringify(candidate.files));
const report = {
  startedAt: new Date().toISOString(), authorizationDate: '2026-10-17', mode: migrated ? 'read-only migrated-state preflight' : 'read-only preflight', candidate,
  runtime: { node: process.version, pnpm: execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim(), pinnedNode: '24.21.0', pinnedPnpm: '12.11.2' },
  tls: { verification: config.database.ssl.rejectUnauthorized, note: config.database.ssl.rejectUnauthorized ? 'Configured verification preserved' : 'Existing staging verification exception preserved; not trusted TLS acceptance' },
  connectionAccounting: { maximum: 2, poolMax: 1, otherSessionsTerminated: false },
  preflight: { result: 'not run', observations: {} },
  results: Array.from({ length: 9 }, (_, index) => ({ id: `BA-03-V0${index + 1}`, result: 'not run', reason: 'Read-only entry gate; write scenarios not started' })),
  cleanup: { result: 'not required', reason: 'No writes or fixtures are permitted by this entry point' },
  remaining: 'Single-database subset only; BB-AC03 and two-installation AA-AC05 remain pending.',
};
const pools = [];
let phase = 'configuration';
const baseline = ['branches', 'businesses', 'installation_binding', 'staff_accounts', 'staff_branch_grants', 'staff_credentials', ...(migrated ? ['access_limits', 'access_prelogins', 'access_security_events', 'access_sessions'] : [])].sort();
const check = (condition, category) => { if (!condition) { const error = new Error(category); error.safeCategory = category; throw error; } };
try {
  // Exact validated URLs guarantee both pools address the same configured target; never emit them.
  check(config.database.connectionString === config.migrationDatabase.connectionString, 'runtime-migration-target-config-mismatch');
  for (const options of [config.database, config.migrationDatabase]) pools.push(new Pool({ ...options, max: 1, application_name: 'ba03-readonly-preflight', connectionTimeoutMillis: 15000, query_timeout: 20000, options: '-c default_transaction_read_only=on -c statement_timeout=20000' }));
  for (const pool of pools) pool.on('error', () => { report.preflight.idleConnectionError = true; });
  phase = 'read-only-connection';
  const clients = [];
  try {
    for (const pool of pools) clients.push(await pool.connect());
    for (const client of clients) await client.query('begin isolation level repeatable read read only');
    const identities = await Promise.all(clients.map((client) => client.query("select current_database() as database, current_user as role, inet_server_addr()::text as address, inet_server_port() as port, current_setting('server_version') as version, current_setting('transaction_read_only') as readonly, pg_backend_pid() as pid")));
    const [runtime, migration] = identities.map((result) => result.rows[0]);
    check(['database', 'role', 'address', 'port'].every((key) => runtime[key] === migration[key]), 'runtime-migration-resolved-target-mismatch');
    check(runtime.readonly === 'on' && migration.readonly === 'on', 'read-only-transaction-not-established');
    report.serverVersion = runtime.version;
    report.preflight.observations.sameResolvedTarget = true;
    phase = 'baseline';
    const client = clients[0];
    const tables = (await client.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map((row) => row.tablename);
    report.preflight.observations.applicationTableCount = tables.length;
    report.preflight.observations.exactExpectedTables = JSON.stringify(tables) === JSON.stringify(baseline);
    check(report.preflight.observations.exactExpectedTables, 'application-table-baseline-mismatch');
    const counts = {};
    for (const name of baseline) counts[name] = Number((await client.query(`select count(*) as count from public.${name}`)).rows[0].count);
    report.preflight.observations.counts = counts;
    check(Object.values(counts).every((count) => count === 0), 'nonempty-application-baseline');
    const history = (await client.query('select hash, created_at from drizzle.__drizzle_migrations order by created_at')).rows;
    report.preflight.observations.migrationCount = history.length;
    const journal = JSON.parse(await readFile(resolve(root, 'apps/api/migrations/meta/_journal.json'), 'utf8'));
    const expectedHistory = migrated ? journal.entries : journal.entries.slice(0, 1);
    check(history.length === expectedHistory.length, 'migration-history-count-mismatch');
    for (const [index, entry] of expectedHistory.entries()) {
      check(history[index].hash === hash(await readFile(resolve(root, `apps/api/migrations/${entry.tag}.sql`))), 'migration-history-hash-mismatch');
      check(String(history[index].created_at) === String(entry.when), 'migration-history-timestamp-mismatch');
    }
    if (migrated) {
      const columns = (await client.query("select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='access_limits' order by ordinal_position")).rows;
      report.preflight.observations.accessLimitColumns = columns;
      check(columns.some((column) => column.column_name === 'pending_ids' && column.data_type === 'ARRAY' && column.is_nullable === 'NO'), 'pending-reservation-column-mismatch');
      const constraints = (await client.query("select conname, pg_get_constraintdef(c.oid) as definition from pg_constraint c join pg_class r on r.oid=c.conrelid join pg_namespace n on n.oid=r.relnamespace where n.nspname='public' and r.relname='access_limits' order by conname")).rows;
      report.preflight.observations.accessLimitConstraints = constraints;
      check(['limit_pending_bound', 'limit_source_no_pending', 'limit_kind_values', 'limit_positive_attempts'].every((name) => constraints.some((constraint) => constraint.conname === name)), 'access-limit-constraint-mismatch');
    }
    report.preflight.observations.originalMigrationMatches = true;
    const artifacts = (await client.query("select (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal)::int as triggers, (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind in ('f','p') and not exists (select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e'))::int as functions")).rows[0];
    report.preflight.observations.nonExtensionArtifacts = artifacts;
    check(artifacts.triggers === 0 && artifacts.functions === 0, 'unexpected-public-trigger-or-function');
    const sessions = (await client.query(`select application_name, state, usename=current_user as same_role,
      case when usename in ('supabase_admin', 'authenticator', 'pgbouncer') then usename else 'unclassified' end as service_role,
      xact_start is not null as open_transaction, backend_xid is not null as assigned_transaction,
      backend_xmin is not null as held_snapshot,
      exists(select 1 from pg_locks l join pg_class r on r.oid=l.relation join pg_namespace n on n.oid=r.relnamespace where l.pid=pg_stat_activity.pid and n.nspname='public' and r.relname=any($2::text[])) as application_relation_lock,
      extract(epoch from (clock_timestamp()-state_change))::bigint as state_age_seconds
      from pg_stat_activity where datname=current_database() and backend_type='client backend'
      and pid <> all($1::int[]) order by backend_start`, [identities.map((result) => result.rows[0].pid), baseline])).rows;
    report.preflight.observations.otherDatabaseClientSessions = sessions.map((row) => ({...row, application_name: row.application_name?.replace(/[\p{Cc}\p{Cs}]/gu, '').slice(0,128)}));
    check(sessions.every((row) => row.state === 'idle' && !row.open_transaction && !row.assigned_transaction && !row.held_snapshot && !row.application_relation_lock && (['supabase_admin', 'authenticator', 'pgbouncer'].includes(row.service_role) || (row.same_role && row.application_name === 'Supavisor'))), 'unexplained-or-active-database-client');
    report.preflight.result = 'passed';
  } finally {
    for (const client of clients) { await client.query('rollback').catch(() => {}); client.release(); }
  }
} catch (error) {
  report.preflight.result = 'failed';
  report.preflight.phase = phase;
  report.preflight.category = error.safeCategory ?? (/^[A-Z0-9_]{2,40}$/.test(String(error.code)) ? error.code : error.name === 'AssertionError' ? 'assertion-failure' : 'connection-or-query-failure');
  process.exitCode = 1;
} finally {
  await Promise.all(pools.map((pool) => pool.end()));
  report.connectionAccounting.allHarnessPoolsClosed = pools.every((pool) => pool.ended && pool.totalCount === 0);
  report.finishedAt = new Date().toISOString();
  await writeFile(resolve(root, 'apps/api/tests/evidence/ba03-preflight.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ preflight: report.preflight, poolsClosed: report.connectionAccounting.allHarnessPoolsClosed }));
}
