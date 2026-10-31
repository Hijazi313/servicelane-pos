import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticFixtures, snapshot, setup } from './cs02-fixtures.mjs';
import { registerExpectedRow, registerExpectedAccessRow, ownedState, checkpoint, cleanup } from './cs02-ledger.mjs';
import { expectedBaseline } from './cs02-plan.mjs';

const tables = (await expectedBaseline('post-0007')).tables;
const makeLedger = () => { const fixture = syntheticFixtures(); return { tag: `cs02.${fixture.runId}`, fixture,
  target: 'a'.repeat(64), baselineHash: 'b'.repeat(64), sessionDigests: [], snapshots: fixture.orders.map(id => snapshot(id, fixture.runId)), setupCommitted: true }; };
const fullClient = (rows, calls = []) => ({ async query(sql, params) {
  calls.push({ sql, params });
  const name = /select to_jsonb\(t\) as row from public\."([a-z_]+)" t/.exec(sql)?.[1];
  if (name) return { rows: (rows[name] ?? []).map(row => ({ row })) };
  if (sql.startsWith('select count')) return { rows: [{ n: 0 }] };
  return { rows: [] };
}, release() { calls.push({ sql: 'release' }); } });

test('synthetic fixture identities are distinct and order projections are valid', async () => {
  const f = syntheticFixtures(), ids = [f.runId, ...f.businesses, ...f.branches, ...f.actors, ...f.orders, ...f.orderRetryKeys, ...f.operationKeys, f.chargeId, f.taxId];
  assert.equal(new Set(ids).size, ids.length); assert.equal(f.actors.length, 3); assert.equal(f.orders.length, 8);
  const { OrderFinancialService } = await import('../dist/cs02-check/modules/orders/public.js');
  const saved = snapshot(f.orders[0], f.runId);
  const projected = await new OrderFinancialService({ get: async () => saved }).get({ installation: {}, transaction: {} }, saved.id);
  assert.equal(projected.merchandiseMinor, '10000');
});

test('setup uses a single transaction, full baseline and synthetic actors without persisting proof secrets', async () => {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { inTransaction } = await import('../dist/cs02-check/infrastructure/database/transaction.js');
  const queries = [], accounts = [], sessions = [];
  const db = drizzle({ client: { query: async (config, params) => { const text = typeof config === 'string' ? config : config.text;
    queries.push({ text, params }); return { rows: text.startsWith('select count') ? [{ n: '0' }] : [] }; } } });
  const runtime = { accessStore: { run: work => inTransaction(db, context => work({ context,
    saveAccount: async account => accounts.push(account), saveSession: async session => sessions.push(session) })) } };
  const ledger = makeLedger(); delete ledger.setupCommitted; const stages = [];
  const proofs = await setup(runtime, ledger, async () => stages.push({ attempted: ledger.setupAttempted, committed: ledger.setupCommitted }), tables);
  assert.equal(queries[0].text, 'begin'); assert.equal(queries.at(-1).text, 'commit');
  assert.equal(queries.filter(q => q.text.startsWith('select count')).length, 26);
  assert.equal(queries.filter(q => q.text.startsWith('insert into captured_orders')).length, 8);
  assert.equal(accounts.length, 3); assert.equal(sessions.length, 3); assert.deepEqual(accounts.map(a => a.role), ['administrator', 'staff', 'staff']);
  assert.equal(stages[0].attempted, true); assert.equal(stages.at(-1).committed, true);
  assert.ok(proofs.every(proof => !JSON.stringify(ledger).includes(proof.session) && !JSON.stringify(ledger).includes(proof.csrf)));
  await assert.rejects(setup(runtime, makeLedger(), async () => {}, ['businesses']), /Full post-migration table manifest/);
});

test('registration requires independently expected complete scoped rows and known parents', async () => {
  const ledger = makeLedger(), f = ledger.fixture, row = { id: f.operationKeys[0], business_id: f.businesses[0], branch_id: f.branches[0], label: 'Synthetic' };
  assert.throws(() => registerExpectedRow(ledger, 'cash_drawers', row, { ...row, label: 'different' }));
  assert.throws(() => registerExpectedRow(ledger, 'cash_drawers', { ...row, branch_id: f.branches[1] }, { ...row, branch_id: f.branches[1] }));
  assert.throws(() => registerExpectedRow(ledger, 'staff_accounts', row, row));
  const session = { id: f.operationKeys[1], business_id: f.businesses[0], branch_id: f.branches[0], drawer_id: row.id,
    custodian_id: f.actors[1], state: { id: f.operationKeys[1], drawerId: row.id } };
  assert.throws(() => registerExpectedRow(ledger, 'cash_drawer_sessions', session, structuredClone(session)));
  registerExpectedRow(ledger, 'cash_drawers', row, structuredClone(row));
  registerExpectedRow(ledger, 'cash_drawer_sessions', session, structuredClone(session));
  const event = { id: f.operationKeys[2], business_id: f.businesses[0], branch_id: f.branches[0], session_id: session.id,
    actor_id: f.actors[1], kind: 'open', payload: { openingMinor: '0' } };
  registerExpectedRow(ledger, 'cash_drawer_events', event, structuredClone(event));
  const retry = { business_id: f.businesses[0], branch_id: f.branches[0], operation: 'move', retry_key: f.operationKeys[4], request: {}, result: {} };
  assert.throws(() => registerExpectedRow(ledger, 'cash_drawer_retries', { ...retry, retry_key: f.orders[0] }, { ...retry, retry_key: f.orders[0] }));
  registerExpectedRow(ledger, 'cash_drawer_retries', retry, structuredClone(retry));
  assert.ok(!JSON.stringify(ledger.registered).includes('Synthetic'));
  const client = fullClient({ cash_drawers: [row], cash_drawer_sessions: [session], cash_drawer_events: [event], cash_drawer_retries: [retry] });
  const state = await ownedState(client, ledger, tables); assert.equal(state.cash_drawer_events.length, 1);
  await assert.rejects(ownedState(fullClient({ cash_drawers: [{ ...row, label: 'changed' }] }), ledger, tables));
  await assert.rejects(ownedState(fullClient({ cash_drawers: [{ ...row, id: f.operationKeys[3] }] }), ledger, tables));
  await assert.rejects(ownedState(client, ledger, ['cash_drawers']), /Full table manifest/);
});

test('cleanup refuses unknown, changed or wrong-target rows before deletion; exact state allows scoped cleanup', async () => {
  const ledger = makeLedger(), f = ledger.fixture, row = { id: f.businesses[0], name: 'Synthetic' };
  const calls = [], rows = { businesses: [row] }, client = fullClient(rows, calls), pool = { connect: async () => client };
  await assert.rejects(checkpoint(client, ledger, tables, async () => {}), /Incomplete initial fixtures/);
  // A previously certified full state is represented directly for cleanup admission testing.
  ledger.state = await ownedState(client, ledger, tables);
  const before = calls.length;
  await assert.rejects(cleanup(pool, ledger, tables, async () => 'c'.repeat(64)), /Target mismatch/);
  assert.ok(!calls.slice(before).some(call => call.sql.startsWith('delete')));
  rows.businesses = [{ ...row, name: 'Changed' }];
  const drift = calls.length; await assert.rejects(cleanup(pool, ledger, tables, async () => ledger.target));
  assert.ok(!calls.slice(drift).some(call => call.sql.startsWith('delete')));
  rows.businesses = [row]; const start = calls.length;
  await cleanup(pool, ledger, tables, async () => ledger.target);
  const cleanupCalls = calls.slice(start); assert.ok(cleanupCalls.some(call => call.sql === 'commit'));
  assert.ok(cleanupCalls.filter(call => call.sql.startsWith('delete')).every(call => call.sql.includes(' where ') && call.params?.length));
  await assert.rejects(cleanup(pool, { ...ledger, state: undefined }, tables, async () => ledger.target), /Uncertain/);
});

test('checkpoint rejects access drift unless the exact existing row mutation is independently admitted', async () => {
  const ledger = makeLedger(), f = ledger.fixture;
  ledger.sessionDigests = f.actors.map((_, i) => String(i + 1).repeat(64));
  const rows = {
    businesses: f.businesses.map(id => ({ id })),
    branches: f.branches.map((id, i) => ({ id, business_id: f.businesses[i === 2 ? 1 : 0] })),
    installation_binding: [{ singleton: 1, business_id: f.businesses[0], branch_id: f.branches[0] }],
    staff_accounts: f.actors.map(id => ({ id, business_id: f.businesses[0], status: 'active' })),
    staff_credentials: f.actors.map(account_id => ({ account_id, password_hash: 'synthetic' })),
    staff_branch_grants: f.actors.map(account_id => ({ account_id, business_id: f.businesses[0], branch_id: f.branches[0] })),
    access_sessions: f.actors.map((account_id, i) => ({ account_id, business_id: f.businesses[0], digest: ledger.sessionDigests[i], last_activity_at: 'initial', revoked_at: null })),
    captured_orders: f.orders.map((id, i) => ({ id, business_id: f.businesses[i === 7 ? 1 : 0], branch_id: f.branches[i === 6 ? 1 : i === 7 ? 2 : 0], retry_key: f.orderRetryKeys[i], snapshot: ledger.snapshots[i] })),
  };
  const client = fullClient(rows);
  await checkpoint(client, ledger, tables, async () => {});
  rows.staff_accounts[1].status = 'disabled';
  await assert.rejects(checkpoint(client, ledger, tables, async () => {}), /Unapproved access mutation/);
  assert.throws(() => registerExpectedAccessRow(ledger, 'staff_accounts', rows.staff_accounts[1], { ...rows.staff_accounts[1], status: 'active' }));
  registerExpectedAccessRow(ledger, 'staff_accounts', rows.staff_accounts[1], structuredClone(rows.staff_accounts[1]));
  await checkpoint(client, ledger, tables, async () => {});
  rows.access_sessions[0].last_activity_at = 'touched';
  await assert.rejects(checkpoint(client, ledger, tables, async () => {}), /Unapproved access mutation/);
  registerExpectedAccessRow(ledger, 'access_sessions', rows.access_sessions[0], structuredClone(rows.access_sessions[0]));
  rows.access_sessions[1].revoked_at = 'unexpected';
  await assert.rejects(checkpoint(client, ledger, tables, async () => {}), /Unapproved access mutation/);
  rows.access_sessions[1].revoked_at = null;
  await checkpoint(client, ledger, tables, async () => {});
  rows.staff_branch_grants.pop();
  await assert.rejects(checkpoint(client, ledger, tables, async () => {}), /Access identity changed/);
  assert.throws(() => registerExpectedAccessRow(ledger, 'staff_accounts', { id: f.orders[0], business_id: f.businesses[0] }, { id: f.orders[0], business_id: f.businesses[0] }));
});
