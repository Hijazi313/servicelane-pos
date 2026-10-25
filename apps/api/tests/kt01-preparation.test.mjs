// Only offline setup/refusal/orchestration checks; never imports the manual parent with approvals.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';
import { authorize, baseline, runChild, failure, sha256 } from './kt01-controls.mjs';
import { overlap } from './kt01-cases.mjs';
const allowed = { KT01_SCHEMA: 'post-0005', KT01_MODE: 'execute', KT01_TEST_TARGET: 'YES', KT01_EXCLUSIVE: 'YES', KT01_EXPECTED_TARGET: 'a'.repeat(64) };
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
function child({ marker = 'KT01 restart passed\n', code = 0, hang = false, diagnostics = '' } = {}) {
  const process = new EventEmitter(); process.stdout = new EventEmitter(); process.stderr = new EventEmitter(); process.stdin = new EventEmitter();
  process.stdin.end = () => { if (!hang) queueMicrotask(() => { process.stderr.emit('data', Buffer.from(diagnostics)); process.stdout.emit('data', Buffer.from(marker)); process.emit('close', code); }); };
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

test('post-0005 baseline requires exact history, schema, empty tables and releases read-only clients on refusal', async () => {
  const { readFile } = await import('node:fs/promises');
  const root = resolve(import.meta.dirname, '../../..');
  const snapshot = JSON.parse(await readFile(`${root}/apps/api/migrations/meta/0005_snapshot.json`, 'utf8'));
  const journal = JSON.parse(await readFile(`${root}/apps/api/migrations/meta/_journal.json`, 'utf8'));
  const history = await Promise.all(journal.entries.map(async entry => ({ hash: sha256(await readFile(`${root}/apps/api/migrations/${entry.tag}.sql`)), created_at: String(entry.when) })));
  const tables = Object.values(snapshot.tables);
  async function attempt(defect) {
    const statements = [], released = [];
    const pool = pid => ({ connect: async () => ({ query: async (text, args) => {
      statements.push(text);
      if (text.startsWith('begin ') || text === 'rollback') return { rows: [] };
      if (text.startsWith('select current_database')) return { rows: [{ database: 'synthetic', role: 'test', address: '127.0.0.1', port: 5432, pid, readonly: 'on', version: '17' }] };
      if (text.includes('from drizzle.__drizzle_migrations')) {
        const rows = structuredClone(history);
        if (defect === 'missing-migration') rows.pop();
        if (defect === 'extra-migration') rows.push(rows[0]);
        if (defect === 'hash') rows[5].hash = '0'.repeat(64);
        if (defect === 'timestamp') rows[5].created_at = '0';
        return { rows };
      }
      if (text.includes('from pg_tables')) return { rows: [...tables.map(table => table.name), ...(defect === 'extra-table' ? ['unexpected'] : [])].sort().map(tablename => ({ tablename })) };
      if (text.includes('from pg_attribute')) {
        const table = tables.find(table => table.name === args[0]);
        const rows = Object.values(table.columns).map(column => ({ name: column.name, type: column.type.replace(/^varchar/, 'character varying').replace(/^bigserial$/, 'bigint'), not_null: column.notNull })).sort((a,b) => a.name.localeCompare(b.name));
        if (defect === 'column' && table.name === 'kitchen_tickets') rows[0].type = 'text';
        return { rows };
      }
      if (text.includes('from pg_constraint')) {
        const table = tables.find(table => 'public.' + table.name === args[0]);
        const names = [...Object.keys(table.foreignKeys), ...Object.keys(table.compositePrimaryKeys), ...Object.keys(table.uniqueConstraints), ...Object.keys(table.checkConstraints)];
        if (Object.values(table.columns).some(column => column.primaryKey)) names.push(table.name + '_pkey');
        if (defect === 'constraint' && table.name === 'kitchen_tickets') names.pop();
        return { rows: names.sort().map(conname => ({ conname })) };
      }
      if (text.includes('from pg_trigger')) return { rows: [{ triggers: defect === 'trigger' ? 1 : 0, functions: 0 }] };
      if (text.includes('from pg_class c join pg_namespace')) return { rows: defect === 'sequence' ? [] : [{ relname: 'kitchen_tickets_position_seq', relkind: 'S' }] };
      if (text.includes('from pg_attrdef')) return { rows: [{ value: defect === 'default' ? '0' : "nextval('kitchen_tickets_position_seq'::regclass)" }] };
      if (text.startsWith('select count(*)')) return { rows: [{ n: defect === 'nonempty' && text.includes('kitchen_tickets') ? '1' : '0' }] };
      throw new Error('Unmodeled SQL');
    }, release: () => released.push(pid) }) });
    let result;
    try {
      const work = baseline(pool(1), pool(2), root);
      if (defect) await assert.rejects(work); else result = await work;
    } finally {
      assert.deepEqual(released, [1,2]);
      assert.equal(statements.filter(text => text === 'rollback').length, 2);
      assert.ok(statements.every(text => /^(select |begin isolation level repeatable read read only|rollback)/.test(text)));
    }
    return result;
  }
  const passed = await attempt();
  assert.equal(passed.tables.length, 16); assert.equal(passed.history.length, 6);
  assert.equal(passed.history[5].tag, '0005_kitchen_handoff');
  assert.ok(Object.values(passed.before).every(count => count === 0));
  for (const defect of ['missing-migration', 'extra-migration', 'hash', 'timestamp', 'extra-table', 'column', 'constraint', 'trigger', 'sequence', 'default', 'nonempty']) await attempt(defect);
});

test('prepared parent cannot import or invoke a migrator and old acknowledgements refuse', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(resolve(import.meta.dirname, 'kt01-acceptance.mjs'), 'utf8');
  assert.doesNotMatch(source, /node-postgres\/migrator|\bmigrate\s*\(/);
  for (const schema of [undefined, 'post-0004', '0005']) assert.throws(() => authorize({ ...allowed, KT01_SCHEMA: schema }, 'v24.21.0'));
});

test('D01 child HTTP checks run against actual Kitchen controllers with stored offline fixtures', async () => {
  const { fixture } = await import('./kitchen-fixture.mjs');
  const { createHttp } = await import('./kt01-runtime.mjs');
  const { verifyRestartHttp } = await import('./kt01-restart-checks.mjs');
  const h = fixture(), expected = [];
  for (let i = 0; i < 5; i++) {
    const order = await h.capture(); const ticket = await h.kitchen.dispatch(h.proof, { orderId: order.id });
    if (i === 0) { await h.kitchen.advance(h.proof, ticket.id, { state: 'preparing', expectedRevision: 0 }); await h.kitchen.advance(h.proof, ticket.id, { state: 'ready', expectedRevision: 1 }); }
    expected.push(await h.kitchen.get(h.proof, ticket.id));
  }
  const foreignTicketId = randomUUID();
  h.records().push({ scope: { businessId: h.installation.businessId, branchId: randomUUID() }, ticket: { ...structuredClone(expected[0]), id: foreignTicketId }, position: '6' });
  const http = await createHttp(h), steps = [];
  try { await verifyRestartHttp(http, { proof: h.proof, expected, orderId: expected[0].orderId, foreignTicketId }, step => steps.push(step)); }
  finally { await http.app.close(); }
  assert.deepEqual(steps, ['ticket-read-1','ticket-read-2','ticket-read-3','ticket-read-4','ticket-read-5','ready-redispatch','queue-readback','foreign-denial']);
});


test('child failure diagnostics distinguish timeout/exit and retain only fixed safe stages', async () => {
  const invoke = process => runChild(() => process, 'node', 'probe', {}, {}, 10);
  const timed = child({ hang: true });
  const timeout = invoke(timed);
  timed.stderr.emit('data', Buffer.from('private SQL\nKT01_STEP:ticket-read-3\n'));
  await assert.rejects(timeout, error => {
    assert.deepEqual(failure(error, 'fresh-process'), { stage: 'fresh-process', category: 'operation-failed', code: 'KT_CHILD_TIMEOUT', childStep: 'ticket-read-3' });
    return true;
  });
  await assert.rejects(invoke(child({ code: 1, diagnostics: 'KT01_STEP:ready-redispatch\nKT01_STEP:private-session\n' })), error => {
    const report = failure(error, 'fresh-process');
    assert.equal(report.code, 'KT_CHILD_EXIT'); assert.equal(report.childStep, 'ready-redispatch'); assert.equal(report.childExit, 1);
    assert.doesNotMatch(JSON.stringify(report), /private/); return true;
  });
  await assert.rejects(invoke(child({ diagnostics: 'x'.repeat(4097) })), error => error.code === 'KT_CHILD_OUTPUT_LIMIT');
});

test('D01-only preparation seeds five tickets and foreign control without rerunning K01–K04', async () => {
  const { fixture } = await import('./kitchen-fixture.mjs');
  const { MenuService } = await import('../dist/orders-check/modules/menu/application/menu.service.js');
  const { MenuOrderResolver } = await import('../dist/orders-check/modules/menu/public.js');
  const { runCases } = await import('./kt01-cases.mjs');
  const { sql } = await import('drizzle-orm'); const { PgDialect } = await import('drizzle-orm/pg-core');
  const h = fixture(), dialect = new PgDialect(), statements = [];
  const menu = new MenuService({ read: async () => structuredClone(h.state().catalogue), save: async (_business, offering) => { h.state().catalogue.push(structuredClone(offering)); } });
  h.service.menu = new MenuOrderResolver(menu);
  const ledger = { ...h.installation, accountIds: [h.state().account.id, randomUUID()], extraBranchId: randomUUID(), offeringIds: [], orderIds: [] };
  const tx = { execute: async query => {
    const compiled = dialect.sqlToQuery(query); statements.push(compiled.sql);
    if (compiled.sql.startsWith('select request,snapshot')) return { rows: [{ request: {}, snapshot: h.state().orders[0].order.snapshot }] };
    assert.match(compiled.sql, /^insert into captured_orders/); return { rows: [] };
  } };
  const result = await runCases({ onlyFreshProcess: true, runtime: { access: h.access, menu, orders: h.service, kitchen: h.kitchen, kitchenStore: h.kitchenStore },
    other: { kitchen: h.kitchen }, proof: h.proof, otherProof: h.proof, ledger, tag: 'kt01.offline.d01', sql, transactionDatabase: () => tx, saveLedger: async () => {},
    one: { query: async text => { assert.match(text, /^select id from kitchen_tickets/); return { rows: h.records().filter(row => row.scope.branchId === h.installation.branchId).map(row => ({ id: row.ticket.id })) }; } },
    record: () => { throw new Error('K01–K04 must not execute'); }, observe: () => { throw new Error('No contention case in D01-only preparation'); } });
  assert.equal(result.expected.length, 5); assert.equal(result.expected[0].state, 'ready'); assert.equal(result.expected[0].revision, 2);
  assert.ok(result.expected.slice(1).every(ticket => ticket.state === 'queued'));
  assert.equal(ledger.orderIds.length, 5); assert.equal(ledger.offeringIds.length, 3);
  assert.equal(h.records().length, 6); assert.equal(h.records().at(-1).scope.branchId, ledger.extraBranchId);
  assert.equal(h.records().at(-1).ticket.state, 'queued'); assert.equal(h.records().at(-1).ticket.revision, 0);
  assert.equal(h.records().at(-1).ticket.id, ledger.foreignTicketId); assert.equal(result.foreignTicketId, ledger.foreignTicketId);
  assert.equal(statements.length, 2);
  assert.throws(() => authorize({ ...allowed, KT01_SCOPE: 'unknown' }, 'v24.21.0'));
});
