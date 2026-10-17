import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { argon2Sync } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { validateBusinessConfiguration } from '../dist/ba01-check/modules/business/public.js';
import { validateInitialAdministrator, validateInitialPassword } from '../dist/ba01-check/modules/authentication/public.js';
import { hashInitialPassword } from '../dist/ba01-check/modules/authentication/infrastructure/password-hash.js';
import { inTransaction, transactionDatabase } from '../dist/ba01-check/infrastructure/database/transaction.js';
import { ProvisionInstallation } from '../dist/ba01-check/application/provision-installation.js';
import { readHiddenPassword } from '../dist/ba01-check/operator/hidden-password.js';

const configuration = () => ({
  business: { name: ' Restaurant A ', currencyCode: 'PKR', timezone: 'Asia/Karachi' },
  branch: { name: ' Branch A ', address: ' Main street ' },
  administrator: { username: 'ADMIN.A', displayName: 'Initial administrator' },
});
const password = 'a long local password 🧑';

test('configuration normalizes identity, accepts independent businesses and rejects invalid/unknown fields', () => {
  const { business, branch } = configuration();
  assert.equal(validateBusinessConfiguration({ business, branch }).business.name, 'Restaurant A');
  assert.equal(validateBusinessConfiguration({ business: { ...business, name: 'Restaurant B', currencyCode: 'USD', timezone: 'America/New_York' }, branch }).business.currencyCode, 'USD');
  for (const patch of [{ name: ' ' }, { name: 'x'.repeat(121) }, { currencyCode: 'ZZZ' }, { currencyCode: 'pkr' }, { timezone: 'not/a/zone' }, { timezone: '+05:00' }, { tenantId: 'foreign' }]) {
    assert.throws(() => validateBusinessConfiguration({ business: { ...business, ...patch }, branch }));
  }
  assert.throws(() => validateBusinessConfiguration({ business, branch: { ...branch, address: ' ' } }));
  assert.throws(() => validateBusinessConfiguration({ business, branch, database: 'foreign' }));
});

test('administrator validation rejects privilege injection and preserves password characters', () => {
  assert.equal(validateInitialAdministrator({ username: 'ADMIN.A' }).username, 'admin.a');
  for (const input of [{ username: 'ab' }, { username: 'adm in' }, { username: 'admin', role: 'administrator' }, { username: 'admin', businessId: 'foreign' }]) assert.throws(() => validateInitialAdministrator(input));
  assert.throws(() => validateInitialPassword('too short'));
  assert.throws(() => validateInitialPassword('x'.repeat(129)));
  validateInitialPassword(' '.repeat(15));
  validateInitialPassword('🧑'.repeat(128));
});

test('password hash is salted PHC Argon2id and derives the original untrimmed password', async () => {
  const one = await hashInitialPassword(password);
  const two = await hashInitialPassword(password);
  assert.notEqual(one, two);
  assert.ok(!one.includes(password));
  assert.match(one, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  const [, , , , salt, encoded] = one.split('$');
  const digest = argon2Sync('argon2id', { message: password, nonce: Buffer.from(salt, 'base64'), memory: 19456, passes: 2, parallelism: 1, tagLength: 32 });
  assert.deepEqual(digest, Buffer.from(encoded, 'base64'));
  await assert.rejects(hashInitialPassword('short'));
});

function harness(failAdministrator = false) {
  const events = [];
  let context;
  const transaction = { execute: async () => events.push('lock') };
  const database = { db: { transaction: async (work) => {
    events.push('begin');
    try { const result = await work(transaction); events.push('commit'); return result; }
    catch (error) { events.push('rollback'); throw error; }
  } } };
  const business = { createInitialBusiness: async (input, scope) => {
    context = scope;
    assert.equal(transactionDatabase(scope), transaction);
    events.push('business');
    return { businessId: 'business-a', branchId: 'branch-a' };
  } };
  const authentication = { createInitialAdministrator: async (input, secret, businessId, branchId, scope) => {
    assert.equal(scope, context);
    assert.equal(secret, password);
    assert.equal(businessId, 'business-a');
    assert.equal(branchId, 'branch-a');
    events.push('administrator');
    if (failAdministrator) throw new Error('administrator failure');
    return { accountId: 'account-a' };
  } };
  return { operation: new ProvisionInstallation(database, business, authentication), events, context: () => context };
}

test('bootstrap validates before opening a transaction and returns IDs only', async () => {
  const run = harness();
  await assert.rejects(run.operation.execute({ ...configuration(), password }, password));
  await assert.rejects(run.operation.execute(configuration(), 'short'));
  assert.deepEqual(run.events, []);
  assert.deepEqual(await run.operation.execute(configuration(), password), { businessId: 'business-a', branchId: 'branch-a', accountId: 'account-a' });
  assert.deepEqual(run.events, ['begin', 'lock', 'business', 'administrator', 'commit']);
  assert.throws(() => transactionDatabase(run.context()), /Inactive/);
});

test('administrator failure propagates rollback and expires the shared context', async () => {
  const run = harness(true);
  await assert.rejects(run.operation.execute(configuration(), password), /administrator failure/);
  assert.deepEqual(run.events, ['begin', 'lock', 'business', 'administrator', 'rollback']);
  assert.throws(() => transactionDatabase(run.context()), /Inactive/);
  assert.throws(() => transactionDatabase({ id: Symbol() }), /Inactive/);
});

test('opaque transaction scopes cannot be reused after success or failure', async () => {
  let held;
  const db = { transaction: async (work) => work({}) };
  await inTransaction(db, async (context) => { held = context; assert.ok(transactionDatabase(context)); });
  assert.throws(() => transactionDatabase(held), /Inactive/);
  await assert.rejects(inTransaction(db, async (context) => { held = context; throw new Error('abort'); }));
  assert.throws(() => transactionDatabase(held), /Inactive/);
});

test('password terminal entry emits no secret and restores raw mode on success/cancel', async () => {
  class Terminal extends EventEmitter {
    isTTY = true; isRaw = false; paused = true;
    isPaused() { return this.paused; }
    setRawMode(value) { this.isRaw = value; }
    resume() { this.paused = false; return this; }
    pause() { this.paused = true; return this; }
  }
  const input = new Terminal();
  let output = '';
  const terminalOutput = { isTTY: true, write: (text) => { output += text; } };
  const value = readHiddenPassword(input, terminalOutput, 'Password: ');
  input.emit('keypress', 'secret', {});
  input.emit('keypress', undefined, { name: 'backspace' });
  input.emit('keypress', undefined, { name: 'return' });
  assert.equal(await value, 'secre');
  assert.equal(output, 'Password: \n');
  assert.equal(input.isRaw, false);
  assert.equal(input.paused, true);
  const cancelled = readHiddenPassword(input, terminalOutput, 'Password: ');
  input.emit('keypress', undefined, { ctrl: true, name: 'c' });
  await assert.rejects(cancelled, /cancelled/);
  assert.equal(input.isRaw, false);
  await assert.rejects(readHiddenPassword({ isTTY: false }, terminalOutput, 'Password: '), /terminal/);
});

test('Business refuses duplicate provisioning and missing context without guessing', async () => {
  const { BusinessService } = await import('../dist/ba01-check/modules/business/public.js');
  const duplicateDb = { select: () => ({ from: () => ({ limit: async () => [{ id: 'existing' }] }) }) };
  const service = new BusinessService({});
  const { business, branch } = configuration();
  await assert.rejects(inTransaction({ transaction: async (work) => work(duplicateDb) }, (scope) => service.createInitialBusiness({ business, branch }, scope)), /already initialized/);
  const readDb = { select: () => ({ from: () => ({ innerJoin() { return this; }, where: async () => [] }) }) };
  await assert.rejects(new BusinessService({ db: readDb }).resolveInstallationContext(), /missing or inconsistent/);
});

test('administrator cannot write a foreign grant when Business rejects ownership', async () => {
  const { AdministratorProvisioner } = await import('../dist/ba01-check/modules/authentication/public.js');
  const database = { select: () => ({ from: () => ({ limit: async () => [] }) }) };
  const provisioner = new AdministratorProvisioner({ validateBranchOwnership: async () => { throw new Error('foreign branch'); } });
  await assert.rejects(inTransaction({ transaction: async (work) => work(database) }, (scope) => provisioner.createInitialAdministrator(configuration().administrator, password, 'business-a', 'branch-b', scope)), /foreign branch/);
});

test('operator CLI rejects no arguments and non-terminal password input without connecting', async () => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const cli = new URL('../dist/ba01-check/operator/provision-installation.js', import.meta.url);
  const fixture = new URL('../src/operator/provision-installation.example.json', import.meta.url);
  const env = { PATH: process.env.PATH, DATABASE_URL: 'postgresql://fixture:fixture@invalid.example/disposable' };
  await assert.rejects(run(process.execPath, [cli.pathname], { env, timeout: 5000 }), (error) => {
    assert.match(error.stderr, /Usage: provision-installation/);
    assert.equal(error.stdout, '');
    return true;
  });
  await assert.rejects(run(process.execPath, [cli.pathname, fixture.pathname], { env, timeout: 5000 }), (error) => {
    assert.match(error.stderr, /Provisioning failed/);
    assert.ok(!error.stderr.includes('fixture:fixture'));
    assert.equal(error.stdout, '');
    return true;
  });
});

test('operator Nest composition resolves provisioning without opening a connection or HTTP listener', async () => {
  const { Module } = await import('@nestjs/common');
  const { ConfigModule } = await import('@nestjs/config');
  const { NestFactory } = await import('@nestjs/core');
  const { ProvisioningModule } = await import('../dist/ba01-check/operator/provisioning.module.js');
  const { DatabaseService } = await import('../dist/ba01-check/infrastructure/database/database.service.js');
  class TestOperatorModule {}
  Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({ database: { connectionString: 'postgresql://fixture:fixture@invalid.example/disposable', max: 1, ssl: true } })] }), ProvisioningModule] })(TestOperatorModule);
  const app = await NestFactory.createApplicationContext(TestOperatorModule, { logger: false, abortOnError: false });
  try {
    assert.ok(app.get(ProvisionInstallation));
    assert.equal(app.get(DatabaseService).pool.totalCount, 0);
  } finally {
    await app.close();
  }
});

test('fresh real terminal exits after hidden password prompts (stdin initially non-flowing)', async () => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const { randomBytes } = await import('node:crypto');
  const run = promisify(execFile);
  const helper = new URL('./acceptance-terminal.py', import.meta.url).pathname;
  const reader = new URL('../dist/ba01-check/operator/hidden-password.js', import.meta.url).href;
  const script = `import { readHiddenPassword } from ${JSON.stringify(reader)}; const first = await readHiddenPassword(process.stdin, process.stdout, 'Initial administrator password: '); const second = await readHiddenPassword(process.stdin, process.stdout, 'Confirm password: '); console.log(JSON.stringify({ matched: first === second }));`;
  const output = await run('python3', [helper, process.execPath, '--input-type=module', '-e', script], { env: { ...process.env, BA01_TEST_PASSWORD: randomBytes(24).toString('base64url') }, timeout: 10000 });
  assert.match(output.stdout, /"matched":true/);
});
