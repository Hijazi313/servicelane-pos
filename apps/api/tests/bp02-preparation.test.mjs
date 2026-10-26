import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { authorize, baseline, contend, injected, safeFailure } from './bp02-controls.mjs';
import { syntheticFixtures } from './bp02-plan.mjs';
import { setup, ownedState, cleanup } from './bp02-fixtures.mjs';
import { createRuntime, createHttp } from './bp02-runtime.mjs';
import { checkHttp } from './bp02-restart.mjs';
import { runChild } from './bp02-child.mjs';
const env = { BP02_TEST_TARGET: 'YES', BP02_EXCLUSIVE: 'YES', BP02_SCHEMA: 'pre-0006', BP02_MODE: 'execute', BP02_APPLY_0006: 'YES', BP02_EXPECTED_TARGET: 'a'.repeat(64) };
test('BP02 parent/child refuse without acknowledgements before configuration or connection', () => {
  authorize(env, 'v24.21.0');
  for (const field of Object.keys(env)) assert.throws(() => authorize({ ...env, [field]: undefined }, 'v24.21.0'));
  assert.throws(() => authorize(env, 'v22.21.0'));
  for (const file of ['bp02-acceptance.mjs', 'bp02-restart.mjs']) {
    const child = spawnSync(process.execPath, [new URL(file, import.meta.url).pathname], { env: { PATH: process.env.PATH }, encoding: 'utf8' });
    assert.equal(child.status, 1); assert.doesNotMatch(child.stderr, /DATABASE_URL|ECONN|Cannot find/);
  }
});
test('BP02 failed read-only baseline rolls back/releases both connections without writes', async () => {
  const calls = [], clients = [1, 2].map(pid => ({ query: async sql => {
    calls.push(sql);
    if (sql.startsWith('select current_database')) return { rows: [{ database: 'synthetic', role: 'test', address: '127.0.0.1', port: 5432, pid, readonly: 'on' }] };
    if (sql.startsWith('select hash')) return { rows: [] };
    return { rows: [] };
  }, release() { calls.push('release'); } }));
  await assert.rejects(baseline({ connect: async () => clients[0] }, { connect: async () => clients[1] }, 'pre-0006'));
  assert.equal(calls.filter(value => value === 'rollback').length, 2); assert.equal(calls.filter(value => value === 'release').length, 2);
  assert.ok(calls.every(value => /^(begin .*read only|select |rollback|release)/.test(value)));
});
test('BP02 actual fixture setup is bounded, atomic and valid for the real financial projection', async () => {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { inTransaction } = await import('../dist/billing-check/infrastructure/database/transaction.js');
  const { OrderFinancialService } = await import('../dist/billing-check/modules/orders/public.js');
  const queries = [], accounts = [], sessions = [];
  const db = drizzle({ client: { query: async (config, params) => {
    const text = typeof config === 'string' ? config : config.text; queries.push({ text, params });
    return { rows: text.startsWith('select count') ? [{ n: '0' }] : [] };
  } } });
  const runtime = { accessStore: { run: work => inTransaction(db, context => work({ context, saveAccount: async row => accounts.push(row), saveSession: async row => sessions.push(row) })) } };
  const ledger = { tag: 'bp02.synthetic', fixture: syntheticFixtures() }, stages = [];
  await setup(runtime, ledger, async () => stages.push(ledger.setupAttempted), ['businesses']);
  assert.equal(queries[0].text, 'begin'); assert.equal(queries.at(-1).text, 'commit');
  assert.equal(queries.filter(row => row.text.startsWith('insert into businesses')).length, 2);
  assert.equal(queries.filter(row => row.text.startsWith('insert into branches')).length, 3);
  assert.equal(queries.filter(row => row.text.startsWith('insert into captured_orders')).length, 12);
  assert.equal(accounts.length, 2); assert.equal(sessions.length, 2); assert.equal(ledger.setupCommitted, true);
  assert.ok(!JSON.stringify(ledger).includes(sessions[0].csrfToken));
  for (const snapshot of ledger.snapshots) {
    const projection = await new OrderFinancialService({ get: async () => snapshot }).get({ installation: {}, transaction: {} }, snapshot.id);
    assert.equal(projection.merchandiseMinor, '10000'); assert.equal(projection.lines.length, 1);
  }
});
test('BP02 contender waits for held write; observer failure releases and joins both attempts', async () => {
  const events = [], store = { async insert() { events.push('write'); } }, original = store.insert;
  const result = await contend(store, 'insert', async () => { await store.insert('context'); events.push('first-done'); return 1; },
    async () => { events.push('second-started'); return 2; }, async context => { assert.equal(context, 'context'); await Promise.resolve(); assert.ok(!events.includes('first-done')); });
  assert.deepEqual(result, [{ value: 1 }, { value: 2 }]); assert.equal(store.insert, original);
  let settled = false;
  await assert.rejects(contend(store, 'insert', () => store.insert('context'), async () => { settled = true; }, async () => { throw new Error('observer failed'); }));
  assert.equal(settled, true); assert.equal(store.insert, original);
  await assert.rejects(contend(store, 'insert', async () => { throw new Error('before-write'); }, async () => {}, async () => {}));
  assert.equal(store.insert, original);
});
test('BP02 injected failure wraps actual write and removes its hook afterward', async () => {
  let writes = 0; const store = { async insert() { writes++; } }, original = store.insert;
  await injected(store, 'insert', () => store.insert()); assert.equal(writes, 1); assert.equal(store.insert, original);
});
test('BP02 cleanup refuses unowned or drifted state before any DELETE and rolls back', async () => {
  const ledger = { fixture: syntheticFixtures(), sessionDigests: [], snapshots: [], state: { businesses: ['wrong'] } }, calls = [];
  const client = { query: async sql => {
    calls.push(sql); return { rows: sql.startsWith('select to_jsonb') ? [{ row: { id: ledger.fixture.businesses[0], name: 'fixture' } }] : [] };
  }, release() { calls.push('release'); } };
  await assert.rejects(cleanup({ connect: async () => client }, ledger, ['businesses']));
  assert.ok(!calls.some(sql => sql.startsWith('delete'))); assert.ok(calls.includes('rollback')); assert.equal(calls.at(-1), 'release');
  await assert.rejects(ownedState({ query: async () => ({ rows: [{ row: { id: 'foreign' } }] }) }, ledger, ['businesses']));
});
test('BP02 test runtime composes without connections; fresh-child HTTP assertions use real controller', async () => {
  const runtime = await createRuntime({ query: async () => { throw new Error('Unexpected database access'); } }, 'bp02.offline');
  assert.ok(runtime.billing); assert.ok(runtime.displayAdmin);
  const { billingFixture } = await import('./billing-fixture.mjs');
  const h = billingFixture(); await h.service.replacePolicy(h.proof, h.policy());
  const assessment = await h.service.assess(h.proof, { orderId: h.order.orderId, optionalChargeIds: [] }), request = h.request(assessment), bill = await h.service.settle(h.proof, request);
  const { BillingError } = await import('../dist/billing-check/modules/billing/domain/billing.js');
  // Retired-ID persistence is a DB case; this offline check exercises child orchestration only.
  const childRuntime = { access: h.access, billing: { get: h.service.get.bind(h.service), settle: h.service.settle.bind(h.service), replacePolicy: async () => { throw new BillingError('INVALID_BILLING_INPUT'); } } };
  const http = await createHttp(childRuntime);
  try { await checkHttp(http, childRuntime, { proof: h.proof, bill, request, foreignIds: [h.request(assessment).retryKey], retired: {} }); }
  finally { await http.app.close(); }
  const startup = await readFile(new URL('../src/app.module.ts', import.meta.url), 'utf8'); assert.doesNotMatch(startup, /BillingModule/);
});
test('BP02 child lifecycle requires exact marker and reaps timeout; diagnostics suppress raw errors', async () => {
  const fake = marker => () => {
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.stdin = new EventEmitter(); child.stdin.end = () => { if (marker) setImmediate(() => { child.stdout.emit('data', marker); child.emit('close', 0); }); };
    child.kill = () => { setImmediate(() => child.emit('close', null)); return true; }; return child;
  };
  assert.deepEqual(await runChild(fake('BP02 restart passed\n'), '', '', {}, {}, 50), { exit: 0, marker: 'BP02 restart passed' });
  await assert.rejects(runChild(fake('wrong'), '', '', {}, {}, 50), /BP02_CHILD_FAILED/);
  await assert.rejects(runChild(fake(null), '', '', {}, {}, 5), /BP02_CHILD_TIMEOUT/);
  const report = safeFailure(Object.assign(new Error('secret URL and proof'), { code: '23505' }), 'cases');
  assert.deepEqual(report, { stage: 'cases', category: 'operation', sqlstate: '23505' });
});
test('BP02 real catalog collector admits the source-modeled pre/post schema and rejects a nonempty target', async () => {
  const { expectedBaseline } = await import('./bp02-plan.mjs');
  for (const stage of ['pre-0006', 'post-0006']) {
    const plan = await expectedBaseline(stage), version = stage === 'pre-0006' ? '0005' : '0006';
    const snapshot = JSON.parse(await readFile(new URL(`../migrations/meta/${version}_snapshot.json`, import.meta.url), 'utf8'));
    let dirty = false, released = 0;
    const client = pid => ({ query: async (sql, params) => {
      let rows = [];
      if (sql.startsWith('select current_database')) rows = [{ database: 'synthetic', role: 'test', address: '127.0.0.1', port: 5432, pid, readonly: 'on' }];
      else if (sql.startsWith('select hash')) rows = plan.history.map(row => ({ hash: row.hash, created_at: String(row.createdAt) }));
      else if (sql.startsWith('select tablename')) rows = plan.tables.map(tablename => ({ tablename }));
      else if (sql.startsWith('select a.attname')) rows = Object.values(snapshot.tables['public.' + params[0]].columns).map(column => ({ name: column.name, type: column.type.replace(/^varchar/, 'character varying').replace(/^bigserial$/, 'bigint'), not_null: column.notNull })).sort((a, b) => a.name.localeCompare(b.name));
      else if (sql.startsWith('select conname')) {
        const table = snapshot.tables[params[0]], names = [...Object.keys(table.foreignKeys), ...Object.keys(table.compositePrimaryKeys), ...Object.keys(table.uniqueConstraints), ...Object.keys(table.checkConstraints)];
        if (Object.values(table.columns).some(column => column.primaryKey)) names.push(table.name + '_pkey'); rows = names.sort().map(conname => ({ conname }));
      } else if (sql.startsWith('select relname')) rows = [{ relname: 'kitchen_tickets_position_seq', relkind: 'S' }];
      else if (sql.startsWith('select pg_get_expr')) rows = [{ value: "nextval('kitchen_tickets_position_seq'::regclass)" }];
      else if (sql.startsWith('select (select count')) rows = [{ triggers: 0, functions: 0 }];
      else if (sql.startsWith('select column_default')) rows = [{ column_default: '0' }];
      else if (sql.startsWith('select count')) rows = [{ n: dirty ? '1' : '0' }];
      else assert.ok(sql.startsWith('begin ') || sql === 'rollback', 'Unexpected baseline statement');
      return { rows };
    }, release() { released++; } });
    const pools = [{ connect: async () => client(1) }, { connect: async () => client(2) }];
    assert.equal((await baseline(...pools, stage)).tables.length, stage === 'pre-0006' ? 16 : 20); assert.equal(released, 2);
    dirty = true; await assert.rejects(baseline(...pools, stage)); assert.equal(released, 4);
  }
});
test('BP02 exact owned cleanup commits only scoped fixture deletions after digest admission', async () => {
  const fixture = syntheticFixtures(), rows = [{ row: { id: fixture.businesses[0], name: 'synthetic' } }], calls = [];
  const client = { query: async (sql, params) => { calls.push({ sql, params }); return { rows: sql.startsWith('select to_jsonb') ? rows : sql.startsWith('select count') ? [{ n: '0' }] : [] }; }, release() {} };
  const ledger = { fixture, sessionDigests: ['synthetic-digest'] }; ledger.state = await ownedState(client, ledger, ['businesses']);
  await cleanup({ connect: async () => client }, ledger, ['businesses']);
  assert.equal(calls.at(-1).sql, 'commit');
  assert.ok(calls.filter(row => row.sql.startsWith('delete')).every(row => row.sql.includes(' where ') && row.params.length > 0));
});
