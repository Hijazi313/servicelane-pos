// Manual integration acceptance only. Never imported by automatic test suites.
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { authorize, failure, baseline, shape, counts, history, sha256, runChild } from './or01-controls.mjs';
// Refuse before configuration, compiled application imports or database access.
authorize(process.env, process.version);
const root = resolve(import.meta.dirname, '../../..');
const tag = `or01.${randomUUID()}`;
const reportPath = `${root}/apps/api/tests/evidence/${tag}.json`;
const ledgerPath = `${root}/apps/api/tests/evidence/${tag}.ledger.json`;
const report = { tag, startedAt: new Date().toISOString(), source: [], gate: 'unrun', migration: 'unrun', results: [], cleanup: 'not-required', runtime: process.version };
const ledger = { tag, accountId: randomUUID(), setupAttempted: false, setupCommitted: false };
const saveLedger = () => writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + '\n', { mode: 0o600, flag: 'w' });
let one, two, runtime, http, stage = 'preflight', idleError = false;
const closed = new Set();
const closePool = async pool => { if (pool && !closed.has(pool)) { closed.add(pool); await pool.end(); } };
try {
  const paths = ['tests/or01-acceptance.mjs', 'tests/or01-controls.mjs', 'tests/or01-cases.mjs', 'tests/or01-runtime.mjs', 'tests/or01-restart.mjs', 'tests/mn01-restart-operation.mjs', 'migrations/meta/_journal.json'];
  for (const path of paths) report.source.push({ path: `apps/api/${path}`, sha256: sha256(await readFile(`${root}/apps/api/${path}`)) });
  const journal = JSON.parse(await readFile(`${root}/apps/api/migrations/meta/_journal.json`, 'utf8'));
  for (const entry of journal.entries) { const path = `apps/api/migrations/${entry.tag}.sql`; report.source.push({ path, sha256: sha256(await readFile(`${root}/${path}`)) }); }
  // Bind the runtime evidence to source and compiled modules, not just the runner.
  for (const path of ['infrastructure/configuration', 'infrastructure/database/transaction', 'modules/orders/application/orders.service', 'modules/orders/infrastructure/postgres-order-store.service', 'modules/orders/domain/capture', 'modules/orders/http/orders.controller', 'modules/orders/http/orders-exception.filter', 'modules/menu/application/menu.service', 'modules/menu/application/menu-order-resolver.service', 'modules/menu/infrastructure/menu-store', 'modules/menu/domain/catalogue', 'modules/authentication/application/access.service', 'modules/authentication/infrastructure/access-store', 'modules/business/infrastructure/business.service']) {
    for (const [prefix, suffix] of [['src', 'ts'], ['dist/orders-check', 'js']]) { const file = `apps/api/${prefix}/${path}.${suffix}`; report.source.push({ path: file, sha256: sha256(await readFile(`${root}/${file}`)) }); }
  }
  const { Pool } = await import('pg');
  const { readConfiguration } = await import('../dist/orders-check/infrastructure/configuration.js');
  const { createRuntime, createHttp } = await import('./or01-runtime.mjs');
  const { runCases } = await import('./or01-cases.mjs');
  const { sql } = await import('drizzle-orm');
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const { inTransaction, transactionDatabase } = await import('../dist/orders-check/infrastructure/database/transaction.js');
  const { token, digest } = await import('../dist/orders-check/modules/authentication/application/access-policy.js');
  const { hashInitialPassword } = await import('../dist/orders-check/modules/authentication/infrastructure/password-hash.js');
  const { PostgresAccessStore } = await import('../dist/orders-check/modules/authentication/infrastructure/access-store.js');
  const { AccessService } = await import('../dist/orders-check/modules/authentication/public.js');
  const config = readConfiguration(process.env);
  assert.equal(config.database.connectionString, config.migrationDatabase.connectionString);
  report.tlsVerified = config.database.ssl.rejectUnauthorized;
  const options = { ...config.database, max: 1, connectionTimeoutMillis: 15000, query_timeout: 35000, application_name: tag, options: '-c statement_timeout=30000 -c lock_timeout=20000' };
  one = new Pool(options); two = new Pool(options);
  for (const pool of [one, two]) pool.on('error', () => { idleError = true; });
  stage = 'baseline'; await baseline(one, two, root, report);
  runtime = await createRuntime(one);
  stage = 'migration';
  await migrate(runtime.database.db, { migrationsFolder: `${root}/apps/api/migrations` });
  report.historyAfter = await history(one, root, 5);
  const allTables = await shape(one, root, '0004');
  assert.ok(Object.values(await counts(one, allTables)).every(n => n === 0));
  report.migration = 'passed';
  const proof = { session: token(), csrf: token() }, otherProof = { session: token(), csrf: token() };
  ledger.sessionDigests = [proof, otherProof].map(p => digest(p.session));
  stage = 'fixtures'; await saveLedger();
  const credentialHash = await hashInitialPassword(randomBytes(24).toString('base64url'));
  ledger.setupAttempted = true; await saveLedger();
  const fixtureStore = new PostgresAccessStore(runtime.database);
  await fixtureStore.run(async unit => {
    const tx = transactionDatabase(unit.context);
    await tx.execute(sql`select pg_advisory_xact_lock(20261012,1)`);
    for (const table of allTables) assert.equal(Number((await tx.execute(sql.raw(`select count(*) as n from public.${table}`))).rows[0].n), 0);
    const context = await runtime.business.createInitialBusiness({ business: { name: tag, currencyCode: 'PKR', timezone: 'Asia/Karachi' }, branch: { name: tag } }, unit.context);
    ledger.businessId = context.businessId; ledger.branchId = context.branchId; await saveLedger();
    await unit.saveAccount({ id: ledger.accountId, businessId: ledger.businessId, username: tag, displayName: tag, status: 'active', role: 'administrator', passwordChangeRequired: false, passwordHash: credentialHash, branchIds: [ledger.branchId] });
    const now = new Date(Date.now() - 5000);
    for (const p of [proof, otherProof]) await unit.saveSession({ digest: digest(p.session), businessId: ledger.businessId, accountId: ledger.accountId, csrfToken: p.csrf, createdAt: now, lastActivityAt: now, revokedAt: null });
  });
  ledger.setupCommitted = true; await saveLedger();
  const other = await createRuntime(two);
  const contenderDb = { transaction: work => other.database.db.transaction(async tx => { await tx.execute(sql`select set_config('application_name',${tag + '.contender'},true)`); return work(tx); }) };
  const otherAccess = new AccessService(new PostgresAccessStore({ db: contenderDb }), other.business, {});
  other.orders.access = otherAccess;
  http = await createHttp(runtime);
  const record = (id, details = {}) => report.results.push({ id, ...details });
  async function waitForContention(context) {
    const tx = transactionDatabase(context);
    const pid = (await tx.execute(sql`select pg_backend_pid() as pid`)).rows[0].pid;
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      await tx.execute(sql`select pg_stat_clear_snapshot()`);
      const observed = await tx.execute(sql`select exists(select 1 from pg_stat_activity a join pg_locks l on a.pid=l.pid where a.application_name=${tag + '.contender'} and l.locktype='advisory' and not l.granted and ${pid}::int=any(pg_blocking_pids(a.pid))) as blocked`);
      if (observed.rows[0].blocked) return { observedAdvisoryWait: true };
      await new Promise(resolve => setImmediate(resolve));
    }
    throw new Error('Contender lock not observed');
  }
  stage = 'integration-cases';
  const restart = await runCases({ ...runtime, one, two, otherDatabase: other.database, otherAccess, otherStore: other.store, otherOrders: other.orders, otherMenu: other.menu, resolver: runtime.orders.menu, ledger, tag, proof, otherProof, run: work => runtime.access.runAuthorized(proof, 'administrator', work), record, saveLedger, sql, inTransaction, transactionDatabase, waitForContention, request: (method, path, payload) => http.request(proof, method, path, payload) });
  stage = 'fresh-process';
  await http.app.close(); http = undefined;
  await closePool(two); await closePool(one);
  for (let i = 0; i < 2; i++) await runChild(spawn, process.execPath, `${root}/apps/api/tests/or01-restart.mjs`, process.env, { proof, ...restart });
  report.restartProcesses = 2;
  one = new Pool(options); one.on('error', () => { idleError = true; }); runtime = await createRuntime(one);
  assert.deepEqual(await runtime.orders.get(proof, restart.snapshot.id), restart.snapshot);
  assert.equal(Number((await one.query('select count(*) as n from captured_orders where business_id=$1 and branch_id=$2 and retry_key=$3', [ledger.businessId, ledger.branchId, restart.body.retryKey])).rows[0].n), 1);
  record('D01', { status: 'passed', freshApiProcesses: 2, parentReconnected: true });
} catch (error) {
  report.failure = failure(error, stage); process.exitCode = 1;
} finally {
  // No cleanup on a rejected baseline or ambiguous migration. Never remove schema/history.
  if (ledger.setupAttempted && report.migration === 'passed') {
    try {
      if (!one || closed.has(one)) {
        const { Pool } = await import('pg');
        const { readConfiguration } = await import('../dist/orders-check/infrastructure/configuration.js');
        const { createRuntime } = await import('./or01-runtime.mjs');
        const config = readConfiguration(process.env);
        one = new Pool({ ...config.database, max: 1, connectionTimeoutMillis: 15000, query_timeout: 35000, options: '-c statement_timeout=30000 -c lock_timeout=20000' });
        one.on('error', () => { idleError = true; }); runtime = await createRuntime(one);
      }
      const { sql } = await import('drizzle-orm');
      const { inTransaction, transactionDatabase } = await import('../dist/orders-check/infrastructure/database/transaction.js');
      await inTransaction(runtime.database.db, async context => {
        const tx = transactionDatabase(context);
        await tx.execute(sql`select pg_advisory_xact_lock(20261012,2)`);
        const primary = ledger.businessId ? (await tx.execute(sql`select name from businesses where id=${ledger.businessId}::uuid`)).rows : [];
        if (!primary.length) { assert.equal(ledger.setupCommitted, false); return; }
        assert.equal(primary[0].name, tag);
        const accounts = (await tx.execute(sql`select id,display_name from staff_accounts where business_id=${ledger.businessId}::uuid`)).rows;
        assert.deepEqual(accounts, [{ id: ledger.accountId, display_name: tag }]);
        const branches = (await tx.execute(sql`select id,name from branches where business_id=${ledger.businessId}::uuid order by id`)).rows;
        const expectedBranches = [{ id: ledger.branchId, name: tag }, ...(ledger.extraBranchId ? [{ id: ledger.extraBranchId, name: tag + '.extra-branch' }] : [])].filter(row => branches.some(b => b.id === row.id)).sort((a, b) => a.id.localeCompare(b.id));
        assert.deepEqual(branches, expectedBranches); assert.ok(branches.some(b => b.id === ledger.branchId));
        const foreign = ledger.foreignBusinessId ? (await tx.execute(sql`select name from businesses where id=${ledger.foreignBusinessId}::uuid`)).rows : [];
        if (foreign.length) {
          assert.equal(foreign[0].name, tag + '.foreign');
          const foreignBranches = (await tx.execute(sql`select id,name from branches where business_id=${ledger.foreignBusinessId}::uuid`)).rows;
          assert.deepEqual(foreignBranches, [{ id: ledger.foreignBranchId, name: tag + '.foreign-branch' }]);
          assert.equal(Number((await tx.execute(sql`select count(*) as n from staff_accounts where business_id=${ledger.foreignBusinessId}::uuid`)).rows[0].n), 0);
        }
        const ownedBusinessIds = [ledger.businessId, ...(foreign.length ? [ledger.foreignBusinessId] : [])];
        for (const id of ownedBusinessIds) {
          const names = (await tx.execute(sql`select definition->>'name' as name from menu_offerings where business_id=${id}::uuid`)).rows;
          assert.ok(names.every(r => r.name.startsWith(tag + '.')));
          for (const table of ['captured_orders', 'order_capture_policies', 'menu_references', 'menu_variants', 'menu_offerings']) {
            assert.match(id, /^[0-9a-f-]{36}$/); await tx.execute(sql.raw(`delete from public.${table} where business_id='${id}'::uuid`));
          }
        }
        // No login/rate-limit/recovery flow is exercised: these global Access tables must remain empty.
        for (const table of ['access_limits', 'access_prelogins', 'access_security_events']) assert.equal(Number((await tx.execute(sql.raw(`select count(*) as n from public.${table}`))).rows[0].n), 0);
        const sessions = (await tx.execute(sql`select digest from access_sessions where business_id=${ledger.businessId}::uuid`)).rows.map(r => r.digest).sort();
        assert.deepEqual(sessions, ledger.sessionDigests.toSorted());
        await tx.execute(sql`delete from access_sessions where business_id=${ledger.businessId}::uuid and account_id=${ledger.accountId}::uuid`);
        await tx.execute(sql`delete from staff_branch_grants where business_id=${ledger.businessId}::uuid and account_id=${ledger.accountId}::uuid`);
        await tx.execute(sql`delete from staff_credentials where account_id=${ledger.accountId}::uuid`);
        await tx.execute(sql`delete from staff_accounts where id=${ledger.accountId}::uuid and business_id=${ledger.businessId}::uuid`);
        await tx.execute(sql`delete from installation_binding where singleton=1 and business_id=${ledger.businessId}::uuid and branch_id=${ledger.branchId}::uuid`);
        for (const id of ownedBusinessIds) {
          await tx.execute(sql`delete from branches where business_id=${id}::uuid`);
          await tx.execute(sql`delete from businesses where id=${id}::uuid`);
        }
      });
      const tables = await shape(one, root, '0004');
      report.afterCleanup = await counts(one, tables);
      assert.ok(Object.values(report.afterCleanup).every(n => n === 0));
      report.finalHistory = await history(one, root, 5); report.cleanup = 'passed';
    } catch (error) { report.cleanup = 'failed; retain ledger for review'; report.cleanupFailure = failure(error, 'cleanup'); process.exitCode = 1; }
  }
  if (http) { try { await http.app.close(); } catch { report.httpCloseFailed = true; process.exitCode = 1; } }
  for (const pool of [one, two]) { try { await closePool(pool); } catch { report.poolCloseFailed = true; process.exitCode = 1; } }
  if (idleError) { report.idleConnectionError = true; process.exitCode = 1; }
  report.result = process.exitCode ? 'failed' : 'passed'; report.finishedAt = new Date().toISOString();
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ report: reportPath, result: report.result, cleanup: report.cleanup, cases: report.results.map(r => ({ id: r.id, status: r.status })) }));
}
