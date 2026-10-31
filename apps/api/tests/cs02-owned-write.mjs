// Test-only capture of complete expected rows from application-store calls. No DB at import.
import assert from 'node:assert/strict';
import { captureWrites } from './cs02-capture.mjs';
import { registerExpectedAccessRow, registerExpectedRow } from './cs02-ledger.mjs';

const scoped = scope => ({ business_id: scope.businessId, branch_id: scope.branchId });
const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const policyRow = (scope, policy) => ({ ...scoped(scope), revision: policy.revision,
  self_close: policy.selfClose, replacement_close: policy.replacementClose, replacement_ids: policy.replacementIds });
const sessionRow = (scope, session) => ({ ...scoped(scope), id: session.id, drawer_id: session.drawerId,
  custodian_id: session.custodianId, revision: session.revision, open: session.closed === null, state: session });
const eventRow = (scope, event) => ({ ...scoped(scope), id: event.id, session_id: event.sessionId,
  kind: event.kind, actor_id: event.actorId, occurred_at: event.occurredAt, payload: event.payload });
const item = (table, expected) => ({ table, expected });

/** Captures source inputs as independent expectations, never database-enumerated rows.
 * A failed/rolled-back work callback returns no observations; its caller must certify
 * unchanged committed state independently before proceeding. */
export async function captureOwnedWrites(runtimes, work) {
  assert.ok(Array.isArray(runtimes) && runtimes.length > 0 && typeof work === 'function', 'Invalid capture inputs');
  assert.ok(runtimes.every(runtime => typeof runtime?.accessStore?.run === 'function'), 'Access store required');
  assert.equal(new Set(runtimes.map(runtime => runtime.accessStore)).size, runtimes.length, 'Distinct access stores are required');
  const hooks = [], originals = [], transactions = new WeakMap(), states = new Map();
  let sequence = 0;
  for (const runtime of runtimes) {
    const store = runtime.accessStore, original = store?.run;
    originals.push({ store, original });
    store.run = async function (callback) {
      let token;
      try {
        const result = await original.call(this, async unit => {
          token = ++sequence; transactions.set(unit.context, token);
          states.set(token, { committed: false, access: [] });
          const saveSession = unit.saveSession.bind(unit), saveAccount = unit.saveAccount.bind(unit);
          unit.saveSession = async value => { await saveSession(value); states.get(token).access.push({ type: 'session', value: structuredClone(value) }); };
          unit.saveAccount = async value => { await saveAccount(value); states.get(token).access.push({ type: 'account', value: structuredClone(value) }); };
          return callback(unit);
        });
        if (token !== undefined) states.get(token).committed = true;
        return result;
      } catch (error) { throw error; }
    };
  }
  const inTransaction = (args, rows) => {
    const token = transactions.get(args.at(-1));
    if (!token) throw new Error('Write missing captured authorized transaction');
    return { token, rows };
  };
  for (const runtime of runtimes) {
    const drawer = runtime.drawerStore, billing = runtime.store;
    hooks.push(
      { target: drawer, method: 'insertDrawer', project: (args) => inTransaction(args, [item('cash_drawers', { ...scoped(args[0]), id: args[1].id, label: args[1].label })]) },
      { target: drawer, method: 'insertSession', project: (args) => inTransaction(args, [item('cash_drawer_sessions', sessionRow(args[0], args[1]))]) },
      { target: drawer, method: 'updateSession', project: (args, success) => inTransaction(args, success ? [item('cash_drawer_sessions', sessionRow(args[0], args[1]))] : []) },
      { target: drawer, method: 'appendEvent', project: (args) => inTransaction(args, [item('cash_drawer_events', eventRow(args[0], args[1]))]) },
      { target: drawer, method: 'saveRetry', project: (args) => inTransaction(args, [item('cash_drawer_retries', {
        ...scoped(args[0]), operation: args[1], retry_key: args[2], request: args[3].request, result: args[3].result })]) },
      { target: drawer, method: 'replacePolicy', project: (args, success) => inTransaction(args, !success ? [] : [
        item('cash_drawer_policies', policyRow(args[0], args[1].next)),
        item('cash_drawer_policy_history', { ...scoped(args[0]), revision: args[1].next.revision,
          previous: args[1].previous, next: args[1].next, actor_id: args[1].actorId, changed_at: args[1].changedAt, note: args[1].note })]) },
      { target: billing, method: 'insert', project: (args) => inTransaction(args, [item('billing_settlements', {
        ...scoped(args[0]), id: args[1].bill.id, order_id: args[1].bill.orderId, retry_key: args[1].request.retryKey,
        actor_id: args[1].actorId, bill: args[1].bill, request: args[1].request })]) },
      { target: billing, method: 'replacePolicy', project: (args) => inTransaction(args, [
        item('billing_policies', { business_id: args[0].businessId, revision: args[1].next.revision, policy: args[1].next }),
        item('billing_policy_history', { business_id: args[0].businessId, revision: args[1].next.revision,
          previous: args[1].previous, next: args[1].next, actor_id: args[1].actorId, changed_at: args[1].changedAt,
          configuration_note: args[1].configurationNote })]) },
    );
  }
  try {
    // An outer failure can coexist with a committed competitor. Return the error as
    // an outcome so committed transactions can still be certified before rethrowing.
    const result = await captureWrites(hooks, async () => {
      try { return { value: await work() }; } catch (error) { return { error }; }
    });
    return { outcome: result.value,
      expected: result.observed.filter(observation => states.get(observation.token)?.committed).flatMap(observation => observation.rows),
      access: [...states.values()].filter(state => state.committed).flatMap(state => state.access) };
  } finally {
    for (const { store, original } of originals) store.run = original;
  }
}

// Strict allowlist and parameterized identities. Never admit a table scan as ownership proof.
const keys = Object.freeze({
  cash_drawers: ['id'], cash_drawer_sessions: ['id'], cash_drawer_events: ['id'],
  cash_drawer_policies: ['business_id', 'branch_id'], cash_drawer_policy_history: ['business_id', 'branch_id', 'revision'],
  cash_drawer_retries: ['business_id', 'branch_id', 'operation', 'retry_key'],
  billing_policies: ['business_id'], billing_policy_history: ['business_id', 'revision'], billing_settlements: ['id'],
});

/** Verify exact full committed rows against captured expectations, then register them.
 * Repeated updates to an identity in one transaction use the final captured state. */
export async function admitOwnedWrites(client, ledger, expected) {
  assert.ok(Array.isArray(expected));
  const last = new Map();
  for (const entry of expected) {
    const columns = Object.hasOwn(keys, entry.table) ? keys[entry.table] : undefined;
    assert.ok(columns && entry.expected && columns.every(column => Object.hasOwn(entry.expected, column)), 'Unknown row or incomplete identity');
    const identity = JSON.stringify([entry.table, ...columns.map(column => entry.expected[column])]);
    last.set(identity, entry);
  }
  for (const { table, expected: row } of last.values()) {
    const columns = keys[table];
    const where = columns.map((column, i) => `"${column}"=$${i + 1}`).join(' and ');
    const found = await client.query(`select to_jsonb(t) as row from public."${table}" t where ${where}`, columns.map(column => row[column]));
    assert.equal(found.rows.length, 1, 'Expected exactly one committed row');
    registerExpectedRow(ledger, table, found.rows[0].row, row);
  }
}

/** Admit only independently reconstructed account/session mutations. Credentials and
 * grants touched by saveAccount are checked against its actual inputs as well; they
 * must still match the previously certified fixture at the subsequent checkpoint.
 * Sensitive values are never written to the ledger or emitted in diagnostic output. */
export async function admitAccessMutations(client, ledger, access) {
  assert.ok(Array.isArray(access));
  const last = new Map();
  for (const entry of access) {
    assert.ok(entry.type === 'session' || entry.type === 'account', 'Unexpected access write');
    const id = entry.type === 'session' ? entry.value.digest : entry.value.id;
    last.set(`${entry.type}/${id}`, entry);
  }
  for (const { type, value } of last.values()) {
    if (type === 'session') {
      const observed = await client.query('select to_jsonb(t) as row from access_sessions t where digest=$1', [value.digest]);
      assert.equal(observed.rows.length, 1, 'Expected fixture session');
      // PostgreSQL formats timestamptz JSON itself, avoiding local timezone assumptions.
      const expected = await client.query(`select jsonb_build_object('digest',$1::text,'business_id',$2::uuid,
        'account_id',$3::uuid,'csrf_token',$4::text,'created_at',$5::timestamptz,
        'last_activity_at',$6::timestamptz,'revoked_at',$7::timestamptz) as row`,
      [value.digest, value.businessId, value.accountId, value.csrfToken, value.createdAt, value.lastActivityAt, value.revokedAt]);
      assert.ok(canonical(observed.rows[0].row) === canonical(expected.rows[0].row), 'Session differs from captured input');
      registerExpectedAccessRow(ledger, 'access_sessions', observed.rows[0].row, expected.rows[0].row);
    } else {
      const observed = await client.query('select to_jsonb(t) as row from staff_accounts t where id=$1', [value.id]);
      assert.equal(observed.rows.length, 1, 'Expected fixture account');
      const expected = { id: value.id, business_id: value.businessId, username: value.username,
        display_name: value.displayName, status: value.status, role: value.role, password_change_required: value.passwordChangeRequired };
      registerExpectedAccessRow(ledger, 'staff_accounts', observed.rows[0].row, expected);
      const credentials = await client.query('select password_hash from staff_credentials where account_id=$1', [value.id]);
      assert.equal(credentials.rows.length, 1, 'Expected fixture credential');
      assert.ok(credentials.rows[0].password_hash === value.passwordHash, 'Credential differs from captured input');
      const grants = await client.query('select business_id,branch_id from staff_branch_grants where account_id=$1 order by branch_id', [value.id]);
      assert.deepEqual(grants.rows, [...value.branchIds].sort().map(branch_id => ({ business_id: value.businessId, branch_id })));
    }
  }
}
