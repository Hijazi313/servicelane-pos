import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticFixtures } from './cs02-fixtures.mjs';
import { captureOwnedWrites, admitOwnedWrites, admitAccessMutations } from './cs02-owned-write.mjs';
import { cleanup, ownedState, registerExpectedRow } from './cs02-ledger.mjs';
import { expectedBaseline } from './cs02-plan.mjs';

function runtime() {
  const accessStore = { async run(work) { return work({ context: {}, async saveSession() {}, async saveAccount() {} }); } };
  const drawerStore = Object.fromEntries(['insertDrawer', 'insertSession', 'updateSession', 'appendEvent', 'saveRetry', 'replacePolicy']
    .map(name => [name, async () => name === 'updateSession' || name === 'replacePolicy' ? true : undefined]));
  const store = { async insert() {}, async replacePolicy() {} };
  return { accessStore, drawerStore, store };
}
function scopedFixture() {
  const fixture = syntheticFixtures();
  return { fixture, ledger: { fixture }, scope: { businessId: fixture.businesses[0], branchId: fixture.branches[0] } };
}

test('capture ties writes to committed transactions, preserves competing success and restores hooks', async () => {
  const a = runtime(), b = runtime(), { fixture, scope } = scopedFixture();
  const original = a.accessStore.run, originalInsert = a.drawerStore.insertDrawer;
  const committed = { id: fixture.operationKeys[0], label: 'Synthetic A' }, rolledBack = { id: fixture.operationKeys[1], label: 'Synthetic B' };
  const capture = await captureOwnedWrites([a, b], async () => {
    await assert.rejects(a.accessStore.run(async unit => { await a.drawerStore.insertDrawer(scope, rolledBack, unit.context); throw Error('rollback'); }));
    await b.accessStore.run(async unit => b.drawerStore.insertDrawer(scope, committed, unit.context));
    throw Error('outer failed after competitor committed');
  });
  assert.match(capture.outcome.error.message, /outer failed/);
  assert.deepEqual(capture.expected, [{ table: 'cash_drawers', expected: { business_id: scope.businessId,
    branch_id: scope.branchId, id: committed.id, label: committed.label } }]);
  assert.equal(a.accessStore.run, original); assert.equal(a.drawerStore.insertDrawer, originalInsert);
});

test('admission uses expected identity and rejects altered or missing committed rows', async () => {
  const { fixture, ledger, scope } = scopedFixture(), id = fixture.operationKeys[0];
  const row = { id, business_id: scope.businessId, branch_id: scope.branchId, label: 'Synthetic' }, queries = [];
  const client = { async query(sql, params) { queries.push({ sql, params }); return { rows: [{ row: structuredClone(row) }] }; } };
  await admitOwnedWrites(client, ledger, [{ table: 'cash_drawers', expected: row }]);
  assert.deepEqual(queries[0].params, [id]); assert.match(queries[0].sql, /where "id"=\$1/);
  assert.ok(ledger.registered.cash_drawers[id]);
  await assert.rejects(admitOwnedWrites(client, ledger, [{ table: 'cash_drawers', expected: { ...row, label: 'Changed' } }]));
  await assert.rejects(admitOwnedWrites({ query: async () => ({ rows: [] }) }, ledger, [{ table: 'cash_drawers', expected: row }]));
  await assert.rejects(admitOwnedWrites(client, ledger, [{ table: 'unexpected', expected: row }]));
});

test('Access writes are captured only after commit, with last account/session values retained', async () => {
  const r = runtime(), { fixture, scope } = scopedFixture(), now = new Date('2026-10-29T00:00:00.000Z');
  const session = { digest: 'a'.repeat(64), businessId: scope.businessId, accountId: fixture.actors[0],
    csrfToken: 'private', createdAt: now, lastActivityAt: now, revokedAt: null };
  const capture = await captureOwnedWrites([r], async () => {
    await r.accessStore.run(async unit => { await unit.saveSession(session); });
    await assert.rejects(r.accessStore.run(async unit => { await unit.saveSession({ ...session, revokedAt: now }); throw Error('rollback'); }));
  });
  assert.equal(capture.access.length, 1); assert.equal(capture.access[0].value.revokedAt, null);
});

test('Access admission verifies session and account including credentials and grants without storing secrets', async () => {
  const { fixture, ledger, scope } = scopedFixture(), accountId = fixture.actors[0], digest = 'b'.repeat(64);
  ledger.sessionDigests = [digest]; ledger.fixedRows = { access_sessions: { [digest]: 'old' }, staff_accounts: { [accountId]: 'old' } };
  const account = { id: accountId, businessId: scope.businessId, username: 'synthetic', displayName: 'Synthetic',
    status: 'disabled', role: 'staff', passwordChangeRequired: false, passwordHash: 'private-hash', branchIds: [scope.branchId] };
  const accountRow = { id: accountId, business_id: scope.businessId, username: account.username, display_name: account.displayName,
    status: account.status, role: account.role, password_change_required: false };
  const session = { digest, businessId: scope.businessId, accountId, csrfToken: 'private-csrf', createdAt: new Date(), lastActivityAt: new Date(), revokedAt: null };
  const sessionRow = { digest, business_id: scope.businessId, account_id: accountId, csrf_token: session.csrfToken,
    created_at: 'created', last_activity_at: 'updated', revoked_at: null };
  const client = { async query(sql) {
    if (sql.includes('jsonb_build_object')) return { rows: [{ row: structuredClone(sessionRow) }] };
    if (sql.includes('from access_sessions')) return { rows: [{ row: structuredClone(sessionRow) }] };
    if (sql.includes('from staff_accounts')) return { rows: [{ row: structuredClone(accountRow) }] };
    if (sql.includes('from staff_credentials')) return { rows: [{ password_hash: account.passwordHash }] };
    if (sql.includes('from staff_branch_grants')) return { rows: [{ business_id: scope.businessId, branch_id: scope.branchId }] };
    throw Error('unexpected query');
  } };
  await admitAccessMutations(client, ledger, [{ type: 'session', value: session }, { type: 'account', value: account }]);
  assert.ok(ledger.expectedAccess.access_sessions[digest]); assert.ok(ledger.expectedAccess.staff_accounts[accountId]);
  assert.ok(!JSON.stringify(ledger).includes('private'));
  const altered = { ...client, async query(sql, params) {
    if (sql.includes('from staff_credentials')) return { rows: [{ password_hash: 'wrong' }] };
    return client.query(sql, params);
  } };
  await assert.rejects(admitAccessMutations(altered, ledger, [{ type: 'account', value: account }]), /Credential differs/);
});

test('only the exact foreign-branch drawer pair is admitted and cleanup targets its identities', async () => {
  const { fixture: f, ledger } = scopedFixture(), drawerId = f.operationKeys[40], sessionId = f.operationKeys[41];
  ledger.setupCommitted = true; ledger.target = 'a'.repeat(64); ledger.baselineHash = 'b'.repeat(64);
  const drawer = { id: drawerId, business_id: f.businesses[0], branch_id: f.branches[1], label: 'Foreign fixture' };
  const session = { id: sessionId, business_id: f.businesses[0], branch_id: f.branches[1], drawer_id: drawerId,
    custodian_id: f.actors[0], state: { id: sessionId, drawerId } };
  assert.throws(() => registerExpectedRow(ledger, 'cash_drawers', { ...drawer, id: f.operationKeys[42] }, { ...drawer, id: f.operationKeys[42] }));
  assert.throws(() => registerExpectedRow(ledger, 'cash_drawer_events', { ...drawer }, { ...drawer }));
  registerExpectedRow(ledger, 'cash_drawers', drawer, drawer);
  assert.throws(() => registerExpectedRow(ledger, 'cash_drawer_sessions', { ...session, custodian_id: f.actors[1] }, { ...session, custodian_id: f.actors[1] }));
  registerExpectedRow(ledger, 'cash_drawer_sessions', session, session);
  const tables = (await expectedBaseline('post-0007')).tables, calls = [];
  const client = { async query(sql, params) {
    calls.push({ sql, params });
    const match = /^select to_jsonb\(t\) as row from public\."([a-z_]+)" t$/.exec(sql);
    if (match) return { rows: (match[1] === 'cash_drawers' ? [drawer] : match[1] === 'cash_drawer_sessions' ? [session] : []).map(row => ({ row })) };
    if (sql.startsWith('select count')) return { rows: [{ n: '0' }] };
    return { rows: [] };
  }, release() {} };
  ledger.state = await ownedState(client, ledger, tables);
  await cleanup({ connect: async () => client }, ledger, tables, async () => ledger.target);
  const deletes = calls.filter(call => call.sql.startsWith('delete from cash_drawer_sessions where business_id=$1 and branch_id=$2 and id=$3'));
  assert.equal(deletes.length, 1);
  assert.deepEqual(deletes[0].params, [f.businesses[0], f.branches[1], sessionId, drawerId]);
  const drawerDeletes = calls.filter(call => call.sql.startsWith('delete from cash_drawers where business_id=$1 and branch_id=$2 and id=$3'));
  assert.equal(drawerDeletes.length, 1); assert.deepEqual(drawerDeletes[0].params, [f.businesses[0], f.branches[1], drawerId]);
});
