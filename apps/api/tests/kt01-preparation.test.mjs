// Only offline setup/refusal/orchestration checks; never imports the manual parent with approvals.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';
import { authorize, baseline, runChild, failure } from './kt01-controls.mjs';
import { overlap } from './kt01-cases.mjs';
const allowed = { KT01_MODE: 'execute', KT01_TEST_TARGET: 'YES', KT01_EXCLUSIVE: 'YES', KT01_EXPECTED_TARGET: 'a'.repeat(64) };
test('parent and child refuse before config loading unless every explicit acknowledgement is present', () => {
  for (const key of Object.keys(allowed)) {
    const env = { ...allowed, [key]: '' }; assert.throws(() => authorize(env, 'v24.21.0'));
    for (const name of ['kt01-acceptance', 'kt01-restart']) {
      const result = spawnSync(process.execPath, [resolve(import.meta.dirname, name + '.mjs')], { env: { ...process.env, DATABASE_URL: 'invalid-private-sentinel', ...env }, encoding: 'utf8' });
      assert.notEqual(result.status, 0); assert.doesNotMatch(result.stderr, /private-sentinel|ECONN|DATABASE_URL/);
    }
  }
  assert.doesNotThrow(() => authorize({ ...allowed, KT01_MODE: 'baseline', KT01_EXPECTED_TARGET: '' }, 'v24.21.0'));
  for (const version of ['v24.20.0', 'v25.0.0']) assert.throws(() => authorize(allowed, version));
  assert.doesNotMatch(JSON.stringify(failure(new Error('SyntheticPrivateSQL'), 'case')), /SyntheticPrivate/);
});
test('baseline identity mismatch releases both read-only clients without any writes', async () => {
  const statements = [], releases = [];
  const pool = pid => ({ connect: async () => ({ query: async text => { statements.push(text); return { rows: text.startsWith('select current_database') ? [{ database: 'synthetic', role: 'test', address: '127.0.0.1', port: 5432, pid, readonly: 'on', version: '17' }] : [] }; }, release: () => releases.push(pid) }) });
  await assert.rejects(baseline(pool(1), pool(2), resolve(import.meta.dirname, '../../..'), 'b'.repeat(64)));
  assert.deepEqual(releases, [1, 2]); assert.equal(statements.filter(text => text === 'rollback').length, 2);
  assert.ok(statements.every(text => /^(select |begin isolation level repeatable read read only|rollback)/.test(text)));
});
function child({ marker = 'KT01 restart passed\n', code = 0, hang = false } = {}) {
  const process = new EventEmitter(); process.stdout = new EventEmitter(); process.stderr = { resume() {} }; process.stdin = new EventEmitter();
  process.stdin.end = () => { if (!hang) queueMicrotask(() => { process.stdout.emit('data', Buffer.from(marker)); process.emit('close', code); }); };
  process.kill = signal => { process.signal = signal; queueMicrotask(() => process.emit('close', null)); }; return process;
}
test('restart proof needs exact marker and zero exit; failure/timeout/overflow cannot pass', async () => {
  const invoke = process => runChild(() => process, 'node', 'probe', {}, {}, 10);
  await invoke(child()); await assert.rejects(invoke(child({ code: 1 }))); await assert.rejects(invoke(child({ marker: 'wrong' })));
  const timed = child({ hang: true }); await assert.rejects(invoke(timed)); assert.equal(timed.signal, 'SIGKILL');
  await assert.rejects(invoke(child({ marker: 'x'.repeat(300) })));
});
test('overlap releases and settles both operations even when contention observation fails', async () => {
  const store = { write: async () => 'stored' }, original = store.write; let settled = 0;
  await assert.rejects(overlap({ store, method: 'write', first: async () => { await store.write('tx'); settled++; }, second: async () => { settled++; }, observe: async () => { throw new Error('not observed'); } }), /not observed/);
  assert.equal(store.write, original); assert.equal(settled, 2);
});
test('real Kitchen API composition initializes without opening a connection', async () => {
  const { createRuntime, createHttp } = await import('./kt01-runtime.mjs'); let calls = 0;
  const runtime = await createRuntime({ query() { calls++; throw new Error(); }, connect() { calls++; throw new Error(); } }, 'kt01.synthetic.contender');
  const http = await createHttp(runtime); await http.app.close(); assert.equal(calls, 0);
});
test('real fixture and K01/K02 orchestration execute with existing rollback-capable offline doubles', async () => {
  const { fixture } = await import('./kitchen-fixture.mjs');
  const { MenuService } = await import('../dist/orders-check/modules/menu/application/menu.service.js');
  const { MenuOrderResolver } = await import('../dist/orders-check/modules/menu/public.js');
  const { runCases } = await import('./kt01-cases.mjs');
  const h = fixture(), tag = 'kt01.offline', passed = [], stop = new Error('stop after K02'); let saves = 0;
  const insert = h.kitchenStore.insert;
  h.kitchenStore.insert = async (scope, ticket, tx) => {
    const existing = h.records().find(row => row.scope.businessId === scope.businessId && row.scope.branchId === scope.branchId && row.ticket.orderId === ticket.orderId);
    return existing ? structuredClone(existing.ticket) : insert(scope, ticket, tx);
  };
  const menu = new MenuService({ read: async () => structuredClone(h.state().catalogue), save: async (_business, offering) => { h.state().catalogue.push(structuredClone(offering)); } });
  h.service.menu = new MenuOrderResolver(menu);
  const ledger = { ...h.installation, accountIds: [h.state().account.id, randomUUID()], offeringIds: [], orderIds: [] };
  const query = async (text, args) => ({ rows: text.includes('access_sessions') ? [{ digest: h.state().session.digest, last_activity_at: h.state().session.lastActivityAt }] : h.records().filter(row => row.ticket.orderId === args[2]).map(row => ({ preparation: row.ticket.preparation, dispatched_by: row.ticket.dispatchedBy })) });
  await assert.rejects(runCases({ runtime: { access: h.access, menu, orders: h.service, kitchen: h.kitchen, kitchenStore: h.kitchenStore }, other: { kitchen: h.kitchen }, one: { query }, proof: h.proof, otherProof: h.proof,
    ledger, tag, saveLedger: async () => { saves++; }, observe: async () => ({ observedAdvisoryWait: 'synthetic-only' }),
    record: (id, result) => { if (result.status === 'passed') { passed.push(id); if (id === 'K02') throw stop; } } }), error => error === stop);
  assert.deepEqual(passed, ['K01', 'K02']); assert.equal(ledger.offeringIds.length, 3); assert.equal(ledger.orderIds.length, 2); assert.ok(saves >= 5);
});
test('cleanup refuses mismatched ownership before deleting anything', async () => {
  const { drizzle } = await import('drizzle-orm/node-postgres'); const { cleanup } = await import('./kt01-cleanup.mjs'); const statements = [];
  const db = drizzle({ client: { query: async config => { const text = typeof config === 'string' ? config : config.text; statements.push(text); return { rows: text.startsWith('select name') ? [{ name: 'unrelated' }] : [] }; } } });
  await assert.rejects(cleanup(db, { businessId: randomUUID(), setupCommitted: true }, 'kt01.synthetic'));
  assert.ok(statements.includes('rollback')); assert.ok(statements.every(text => !text.startsWith('delete')));
});

test('transaction-local contender marker precedes the real Access lock and failed marking prevents work', async () => {
  const { namedTransactions } = await import('./kt01-runtime.mjs');
  const { PostgresAccessStore } = await import('../dist/orders-check/modules/authentication/infrastructure/access-store.js');
  const { PgDialect } = await import('drizzle-orm/pg-core');
  const dialect = new PgDialect(), statements = [];
  let rejectMarker = false, transactions = 0;
  const tx = { execute: async query => {
    const compiled = dialect.sqlToQuery(query); statements.push(compiled);
    if (rejectMarker) throw new Error('private-marker-error');
    return { rows: [] };
  } };
  const db = await namedTransactions({ transaction: async work => { transactions++; return work(tx); } }, 'kt01.synthetic.contender');
  const access = new PostgresAccessStore({ db });
  await access.run(async () => { statements.push({ sql: 'work' }); });
  assert.match(statements[0].sql, /set_config\('application_name',\$1,true\)/);
  assert.deepEqual(statements[0].params, ['kt01.synthetic.contender']);
  assert.match(statements[1].sql, /pg_advisory_xact_lock/); assert.equal(statements[2].sql, 'work');
  rejectMarker = true; statements.length = 0;
  await assert.rejects(access.run(async () => { throw new Error('work must not run'); }), /private-marker-error/);
  assert.equal(statements.length, 1); assert.equal(transactions, 2);
});

test('failed contention reports its exact safe step and releases both operations', async () => {
  const steps = [], store = { insert: async () => 'stored' }; let settled = 0;
  const original = store.insert;
  const error = Object.assign(new Error('private SQL and proofs'), { code: 'ECONNRESET' });
  await assert.rejects(overlap({ store, method: 'insert', first: async () => { await store.insert('tx'); settled++; },
    second: async () => { settled++; }, observe: async () => { throw error; }, progress: step => steps.push(step) }), value => value === error);
  assert.deepEqual(steps, ['holder-write', 'contender-start', 'contention-observation']);
  assert.equal(store.insert, original); assert.equal(settled, 2);
  assert.deepEqual(failure(error, 'K01'), { stage: 'K01', category: 'operation-failed', code: 'ECONNRESET' });
  assert.equal(failure({ code: 'KT_CONTENTION_NOT_OBSERVED' }, 'K01').code, 'KT_CONTENTION_NOT_OBSERVED');
  assert.doesNotMatch(JSON.stringify(failure(Object.assign(new Error('private proof'), { code: 'private-proof' }), 'K01')), /private/);
});
