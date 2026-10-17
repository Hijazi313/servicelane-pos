// Manual, WRITE-based acceptance. Never included in test:bootstrap.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes, argon2Sync } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { readConfiguration } from '../dist/infrastructure/configuration.js';
import { BusinessService } from '../dist/modules/business/public.js';
import { AdministratorProvisioner } from '../dist/modules/authentication/public.js';
import { ProvisionInstallation } from '../dist/application/provision-installation.js';

if (process.env.BA01_ACCEPT_STAGING !== 'YES') throw new Error('Explicit staging-write opt-in required');
const exec = promisify(execFile);
const config = readConfiguration(process.env);
assert.equal(config.database.connectionString, config.migrationDatabase.connectionString, 'This acceptance harness requires the identical staging connection for runtime and migrations');
const pool = new Pool({ ...config.database, max: 3, connectionTimeoutMillis: 15000, query_timeout: 20000 });
const migrationPool = new Pool({ ...config.migrationDatabase, max: 1, connectionTimeoutMillis: 15000, query_timeout: 20000 });
const results = [];
let stage = 'preflight';
let resume = false;
let temp;
const owned = ['businesses', 'branches', 'installation_binding', 'staff_accounts', 'staff_credentials', 'staff_branch_grants'];
const report = (check) => { results.push({ check, result: 'passed' }); console.log(JSON.stringify(results.at(-1))); };
const counts = async () => Object.fromEntries(await Promise.all(owned.map(async (name) => [name, Number((await pool.query(`select count(*) as count from public.${name}`)).rows[0].count)])));
const empty = async () => assert.deepEqual(Object.values(await counts()), [0, 0, 0, 0, 0, 0]);
const clear = async () => pool.query('truncate public.staff_branch_grants, public.staff_credentials, public.staff_accounts, public.installation_binding, public.branches, public.businesses');
const password = randomBytes(24).toString('base64url');
const input = (name = 'Acceptance Grill') => ({ business: { name, currencyCode: 'PKR', timezone: 'Asia/Karachi' }, branch: { name: 'Main Branch', address: 'Synthetic staging acceptance address' }, administrator: { username: 'acceptance.owner', displayName: 'Acceptance administrator' } });
const db = drizzle({ client: pool });
const business = new BusinessService({ db });
const auth = new AdministratorProvisioner(business);
const operation = new ProvisionInstallation({ db }, business, auth);

try {
  // Only touch the already-authorized database, and refuse unexpected public tables.
  const identities = await Promise.all([pool.query('select current_database() as name, current_setting(\'server_version\') as version'), migrationPool.query('select current_database() as name')]);
  assert.equal(identities[0].rows[0].name, identities[1].rows[0].name, 'Migration and runtime databases differ');
  const tables = (await pool.query("select tablename from pg_tables where schemaname = 'public'")).rows.map((row) => row.tablename);
  if (tables.length) {
    assert.equal(process.env.BA01_RESUME_ACCEPTANCE, 'YES', 'Existing schema requires explicit acceptance resume');
    assert.deepEqual([...tables].sort(), [...owned].sort(), 'Only BA-01 test-owned tables may exist');
    const names = (await pool.query('select name from businesses')).rows;
    assert.ok(names.every((row) => ['Acceptance Grill', 'Concurrent A', 'Concurrent B', 'Corrected retry'].includes(row.name)));
    assert.ok((await pool.query('select username from staff_accounts')).rows.every((row) => row.username === 'acceptance.owner'));
    await clear();
    resume = true;
    report('Resume verified prior BA-01 synthetic records only; cleared them without changing migrated schema');
  } else {
    report('Empty staging preflight; runtime and migration database agree');
  }
  console.log(JSON.stringify({ serverVersion: identities[0].rows[0].version, tlsVerification: config.database.ssl.rejectUnauthorized }));

  stage = 'migration-recovery';
  const migrations = readMigrationFiles({ migrationsFolder: resolve('apps/api/migrations') });
  if (!resume) {
  const client = await migrationPool.connect();
  try {
    await client.query('begin');
    for (const migration of migrations) for (const statement of migration.sql) await client.query(statement);
    await assert.rejects(client.query('select 1 / 0'), (error) => error.code === '22012');
    await client.query('rollback');
  } finally { await client.query('rollback'); client.release(); }
  assert.equal((await pool.query("select count(*)::int as count from pg_tables where schemaname='public'")).rows[0].count, 0);
  report('First migration DDL rolls back completely after controlled transaction failure');
  } else {
    results.push({check: 'First migration DDL rollback after controlled failure', result: 'not rerun', source: 'Resume mode preserves an already migrated schema; consult separately recorded initial-run evidence, never infer recovery from resume'});
  }

  stage = 'migration-apply';
  const runner = resolve('apps/api/dist/infrastructure/database/migrate.js');
  const migrate = () => exec(process.execPath, [runner], { env: process.env, timeout: 60000 });
  await migrate();
  const historyBefore = (await pool.query('select count(*)::int as count from drizzle.__drizzle_migrations')).rows[0].count;
  assert.equal(historyBefore, 1);
  await migrate();
  assert.equal((await pool.query('select count(*)::int as count from drizzle.__drizzle_migrations')).rows[0].count, historyBefore);
  await empty();
  report('Actual migration runner applies once and reruns without duplicate history/data');

  stage = 'invalid-input';
  await assert.rejects(operation.execute({ ...input(), business: { ...input().business, currencyCode: 'ZZZ' } }, password));
  await empty();
  await assert.rejects(business.resolveInstallationContext());
  report('Invalid configuration leaves no rows; missing installation binding fails closed');

  stage = 'actual-operator';
  temp = await mkdtemp(join(tmpdir(), 'ba01-acceptance-'));
  const fixture = join(temp, 'installation.json');
  await writeFile(fixture, JSON.stringify(input()), { mode: 0o600 });
  const cli = resolve('apps/api/dist/operator/provision-installation.js');
  const terminal = await exec('python3', [resolve('apps/api/tests/acceptance-terminal.py'), process.execPath, cli, fixture], { env: { ...process.env, BA01_TEST_PASSWORD: password }, timeout: 50000 });
  const line = terminal.stdout.split(/\r?\n/).find((item) => item.startsWith('{'));
  assert.ok(line, 'Operator must return safe IDs');
  const ids = JSON.parse(line);
  assert.deepEqual(Object.keys(ids).sort(), ['accountId', 'branchId', 'businessId']);
  const context = await business.resolveInstallationContext();
  assert.equal(context.businessId, ids.businessId);
  assert.equal(context.branchId, ids.branchId);
  assert.equal(context.business.name, 'Acceptance Grill');
  assert.equal(context.business.currencyCode, 'PKR');
  assert.equal(context.business.timezone, 'Asia/Karachi');
  const account = (await pool.query('select a.*, c.password_hash, g.branch_id from staff_accounts a join staff_credentials c on c.account_id=a.id join staff_branch_grants g on g.account_id=a.id and g.business_id=a.business_id')).rows;
  assert.equal(account.length, 1);
  assert.equal(account[0].id, ids.accountId);
  assert.equal(account[0].business_id, ids.businessId);
  assert.equal(account[0].branch_id, ids.branchId);
  assert.equal(account[0].role, 'administrator');
  assert.equal(account[0].status, 'active');
  assert.equal(account[0].password_change_required, true);
  const [, , , , salt, hash] = account[0].password_hash.split('$');
  assert.deepEqual(argon2Sync('argon2id', { message: password, nonce: Buffer.from(salt, 'base64'), memory: 19456, passes: 2, parallelism: 1, tagLength: 32 }), Buffer.from(hash, 'base64'));
  assert.ok(!terminal.stdout.includes(password));
  report('Actual hidden-terminal CLI provisions correct business, branch, administrator, hash and explicit grant');

  stage = 'duplicate';
  const before = await counts();
  await assert.rejects(operation.execute(input('Accidental replacement'), password), /already initialized/);
  assert.deepEqual(await counts(), before);
  assert.equal((await business.resolveInstallationContext()).business.name, 'Acceptance Grill');
  report('Repeated setup rejects replacement without changing existing configuration or account');

  stage = 'concurrent';
  await clear();
  const concurrent = await Promise.allSettled([operation.execute(input('Concurrent A'), password), operation.execute(input('Concurrent B'), password)]);
  assert.equal(concurrent.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(concurrent.filter((result) => result.status === 'rejected').length, 1);
  assert.deepEqual(Object.values(await counts()), [1, 1, 1, 1, 1, 1]);
  report('Two real concurrent transactions produce exactly one complete installation');

  stage = 'administrator-failure';
  await clear();
  await pool.query("create function public.ba01_acceptance_reject_credentials() returns trigger language plpgsql as $$ begin raise exception 'Synthetic acceptance failure' using errcode = 'P0001'; end $$");
  await pool.query('create trigger ba01_acceptance_failure before insert on public.staff_credentials for each row execute function public.ba01_acceptance_reject_credentials()');
  try {
    await assert.rejects(operation.execute(input(), password), (error) => (error.cause?.code ?? error.code) === 'P0001');
    await empty();
    report('Database-injected credential failure rolls back business, branch, binding and administrator together');
  } finally {
    await pool.query('drop trigger if exists ba01_acceptance_failure on public.staff_credentials');
    await pool.query('drop function if exists public.ba01_acceptance_reject_credentials()');
  }
  await operation.execute(input('Corrected retry'), password);
  assert.deepEqual(Object.values(await counts()), [1, 1, 1, 1, 1, 1]);
  report('Corrected retry succeeds after removing the controlled failure');
  stage = 'cleanup';
  await clear();
  await empty();
  report('Synthetic records and failure artifacts removed; six migrated tables retained empty');
  await writeFile(resolve('apps/api/tests/evidence/ba01-staging.json'), JSON.stringify({ date: '2026-10-12', target: 'user-authorized empty staging; connection details omitted', serverVersion: identities[0].rows[0].version, tlsVerification: config.database.ssl.rejectUnauthorized, results, remaining: 'Migration remains applied; six BA-01 tables are empty. No BA-02/BA-03 or production acceptance.' }, null, 2) + '\n');
} catch (error) {
  console.error(JSON.stringify({ stage, result: 'failed', code: error.cause?.code ?? error.code ?? error.name, message: error.name === 'AssertionError' ? 'Acceptance assertion failed' : 'Inspect sanitized stage; raw database/configuration errors withheld' }));
  process.exitCode = 1;
} finally {
  if (temp) await rm(temp, { recursive: true, force: true });
  await Promise.all([pool.end(), migrationPool.end()]);
}
