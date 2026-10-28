// Exact ownership and cleanup admission; no configuration or database access at import time.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { expectedBaseline } from './cs02-plan.mjs';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
const dynamic = new Set(['cash_drawers', 'cash_drawer_sessions', 'cash_drawer_events', 'cash_drawer_policies',
  'cash_drawer_policy_history', 'cash_drawer_retries', 'billing_policies', 'billing_policy_history', 'billing_settlements', 'business_display_history']);
function identity(table, row) {
  switch (table) {
    case 'cash_drawers': case 'cash_drawer_sessions': case 'cash_drawer_events': case 'billing_settlements': case 'business_display_history': return row.id;
    case 'cash_drawer_policies': return `${row.business_id}/${row.branch_id}`;
    case 'cash_drawer_policy_history': return `${row.business_id}/${row.branch_id}/${row.revision}`;
    case 'cash_drawer_retries': return `${row.business_id}/${row.branch_id}/${row.operation}/${row.retry_key}`;
    case 'billing_policies': return row.business_id;
    case 'billing_policy_history': return `${row.business_id}/${row.revision}`;
    default: throw new Error('Table is not a registerable CS02 result');
  }
}
function assertScoped(ledger, table, row) {
  const f = ledger.fixture;
  assert.equal(row.business_id, f.businesses[0]);
  if ('branch_id' in row) assert.equal(row.branch_id, f.branches[0]);
  if (['cash_drawers', 'cash_drawer_sessions', 'cash_drawer_events', 'billing_settlements', 'business_display_history'].includes(table)) assert.match(row.id, uuid);
  if ('actor_id' in row) assert.ok(f.actors.includes(row.actor_id));
  if (table === 'cash_drawer_sessions') {
    assert.ok(f.actors.includes(row.custodian_id));
    assert.ok(Object.hasOwn(ledger.registered?.cash_drawers ?? {}, row.drawer_id));
    assert.equal(row.state?.id, row.id); assert.equal(row.state?.drawerId, row.drawer_id);
  }
  if (table === 'cash_drawer_events') {
    assert.ok(Object.hasOwn(ledger.registered?.cash_drawer_sessions ?? {}, row.session_id));
    assert.ok(['open', 'movement', 'handover-start', 'handover-accept', 'handover-cancel', 'close', 'cash-sale'].includes(row.kind));
  }
  if (table === 'cash_drawer_retries') {
    assert.ok(f.operationKeys.includes(row.retry_key));
    assert.ok(['create-drawer', 'open', 'move', 'handover', 'accept-handover', 'cancel-handover', 'close'].includes(row.operation));
  }
  if (table === 'billing_settlements') {
    assert.ok(f.orders.includes(row.order_id)); assert.ok(f.operationKeys.includes(row.retry_key));
    assert.equal(row.bill?.id, row.id); assert.equal(row.bill?.orderId, row.order_id);
    assert.equal(row.request?.retryKey, row.retry_key); assert.equal(row.request?.orderId, row.order_id);
  }
  if (table.endsWith('history')) assert.ok(Number.isInteger(row.revision) && row.revision > 0);
}
/** Register only an exact full row whose complete contents the case independently verified.
 * The runner must not bulk-register database enumeration. IDs must come from admitted fixture
 * inputs or verified operation results; the ledger never stores the row, only its digest. */
export function registerExpectedRow(ledger, table, row, expected) {
  if (!dynamic.has(table)) throw new Error('Unexpected registration table');
  assert.deepEqual(row, expected, 'Expected full row must be independently verified');
  assertScoped(ledger, table, row);
  const key = identity(table, row);
  assert.ok(typeof key === 'string' && key.length > 0);
  ledger.registered ??= {};
  ledger.registered[table] ??= {};
  ledger.registered[table][key] = digest(row);
}
function verifyFixed(ledger, table, row) {
  const f = ledger.fixture;
  switch (table) {
    case 'businesses': assert.ok(f.businesses.includes(row.id)); break;
    case 'branches': assert.ok(f.branches.includes(row.id)); assert.equal(row.business_id, f.businesses[row.id === f.branches[2] ? 1 : 0]); break;
    case 'installation_binding': assert.equal(row.singleton, 1); assert.equal(row.business_id, f.businesses[0]); assert.equal(row.branch_id, f.branches[0]); break;
    case 'staff_accounts': assert.ok(f.actors.includes(row.id)); assert.equal(row.business_id, f.businesses[0]); break;
    case 'staff_credentials': assert.ok(f.actors.includes(row.account_id)); break;
    case 'staff_branch_grants': assert.ok(f.actors.includes(row.account_id)); assert.equal(row.business_id, f.businesses[0]); assert.equal(row.branch_id, f.branches[0]); break;
    case 'access_sessions': assert.ok(ledger.sessionDigests.includes(row.digest)); assert.ok(f.actors.includes(row.account_id)); assert.equal(row.business_id, f.businesses[0]); break;
    case 'captured_orders': {
      const i = f.orders.indexOf(row.id); assert.ok(i >= 0);
      assert.equal(row.business_id, f.businesses[i === 7 ? 1 : 0]); assert.equal(row.branch_id, f.branches[i === 6 ? 1 : i === 7 ? 2 : 0]);
      assert.equal(row.retry_key, f.orderRetryKeys[i]); assert.deepEqual(row.snapshot, ledger.snapshots[i]); break;
    }
    default: assert.fail('Unexpected populated table');
  }
}
async function fullManifest(tables) {
  const expected = (await expectedBaseline('post-0007')).tables;
  assert.ok(Array.isArray(tables)); assert.deepEqual([...tables].sort(), expected, 'Full table manifest required');
  return expected;
}
const mutableAccess = new Set(['staff_accounts', 'staff_branch_grants', 'access_sessions']);
function accessIdentity(table, row) {
  switch (table) {
    case 'staff_accounts': return row.id;
    case 'staff_branch_grants': return `${row.account_id}/${row.branch_id}`;
    case 'access_sessions': return row.digest;
    default: throw new Error('Not a mutable access table');
  }
}
/** Admit a specific full Access row only after the case independently verifies the
 * expected mutation. Its identity must already belong to the certified fixture. */
export function registerExpectedAccessRow(ledger, table, observed, expected) {
  assert.ok(mutableAccess.has(table), 'Unexpected access mutation table');
  assert.deepEqual(observed, expected, 'Expected full access row must be independently verified');
  verifyFixed(ledger, table, observed);
  const key = accessIdentity(table, observed);
  assert.ok(Object.hasOwn(ledger.fixedRows?.[table] ?? {}, key), 'Uncertified access identity');
  ledger.expectedAccess ??= {};
  ledger.expectedAccess[table] ??= {};
  ledger.expectedAccess[table][key] = digest(observed);
}
async function collectOwned(client, ledger, tables) {
  const manifest = await fullManifest(tables), state = {}, fixedRows = {};
  for (const table of manifest) {
    assert.match(table, /^[a-z_]+$/);
    const rows = (await client.query(`select to_jsonb(t) as row from public."${table}" t`)).rows.map(result => result.row);
    for (const row of rows) {
      if (dynamic.has(table)) {
        assertScoped(ledger, table, row);
        assert.equal(ledger.registered?.[table]?.[identity(table, row)], digest(row), 'Unexpected or unverified row');
      } else verifyFixed(ledger, table, row);
    }
    if (dynamic.has(table)) {
      assert.equal(rows.length, Object.keys(ledger.registered?.[table] ?? {}).length, 'Registered row missing');
    }
    state[table] = rows.map(digest).sort();
    if (mutableAccess.has(table)) {
      const entries = rows.map(row => [accessIdentity(table, row), digest(row)]);
      assert.equal(new Set(entries.map(([key]) => key)).size, entries.length, 'Duplicate access identity');
      fixedRows[table] = Object.fromEntries(entries);
    }
  }
  return { state, fixedRows };
}
export async function ownedState(client, ledger, tables) {
  return (await collectOwned(client, ledger, tables)).state;
}
export async function checkpoint(client, ledger, tables, saveLedger) {
  assert.equal(ledger.setupCommitted, true, 'Uncertain fixture setup');
  const { state: next, fixedRows } = await collectOwned(client, ledger, tables);
  if (!ledger.state) {
    for (const [table, count] of Object.entries({ businesses: 2, branches: 3, installation_binding: 1,
      staff_accounts: 3, staff_credentials: 3, staff_branch_grants: 3, access_sessions: 3, captured_orders: 8 })) {
      assert.equal(next[table].length, count, 'Incomplete initial fixtures');
    }
    for (const table of dynamic) assert.equal(next[table].length, 0, 'Unexpected initial result');
  }
  if (ledger.state) for (const table of ['businesses', 'branches', 'captured_orders', 'staff_credentials', 'installation_binding']) {
    assert.deepEqual(next[table], ledger.state[table], 'Fixed fixture changed');
  }
  if (ledger.state) for (const table of ['billing_settlements', 'billing_policy_history', 'business_display_history', 'cash_drawer_events', 'cash_drawer_policy_history', 'cash_drawer_retries']) {
    assert.ok(ledger.state[table].every(hash => next[table].includes(hash)), 'Immutable history changed');
  }
  if (ledger.state) for (const table of mutableAccess) {
    assert.ok(ledger.fixedRows?.[table], 'Certified access identities missing');
    assert.deepEqual(Object.keys(fixedRows[table]).sort(), Object.keys(ledger.fixedRows[table]).sort(), 'Access identity changed');
    for (const [key, hash] of Object.entries(fixedRows[table])) {
      assert.ok(hash === ledger.fixedRows[table][key] || hash === ledger.expectedAccess?.[table]?.[key], 'Unapproved access mutation');
    }
  }
  ledger.state = next; ledger.fixedRows = fixedRows; delete ledger.expectedAccess; await saveLedger();
}
export async function cleanup(pool, ledger, tables, verifyTarget) {
  await fullManifest(tables);
  assert.ok(ledger.setupCommitted && ledger.state && /^[a-f0-9]{64}$/.test(ledger.baselineHash ?? '') && /^[a-f0-9]{64}$/.test(ledger.target ?? ''), 'Uncertain owned state or target');
  assert.equal(typeof verifyTarget, 'function', 'Live target verification required');
  const client = await pool.connect();
  try {
    await client.query('begin'); await client.query('select pg_advisory_xact_lock(20261012,2)');
    assert.equal(await verifyTarget(client), ledger.target, 'Target mismatch');
    assert.deepEqual(await ownedState(client, ledger, tables), ledger.state, 'Certified rows changed');
    const f = ledger.fixture, business = f.businesses[0], branch = f.branches[0];
    // Full-state equality and scope admission precede every DELETE. FK dependents go first.
    for (const table of ['cash_drawer_events', 'cash_drawer_retries', 'cash_drawer_policy_history', 'cash_drawer_policies', 'cash_drawer_sessions', 'cash_drawers']) {
      await client.query(`delete from public."${table}" where business_id=$1 and branch_id=$2`, [business, branch]);
    }
    await client.query('delete from billing_settlements where order_id=any($1::uuid[])', [f.orders]);
    for (const table of ['billing_policy_history', 'billing_policies', 'business_display_history']) await client.query(`delete from public."${table}" where business_id=$1`, [business]);
    await client.query('delete from captured_orders where id=any($1::uuid[])', [f.orders]);
    await client.query('delete from access_sessions where digest=any($1::text[])', [ledger.sessionDigests]);
    await client.query('delete from staff_branch_grants where account_id=any($1::uuid[])', [f.actors]);
    await client.query('delete from staff_credentials where account_id=any($1::uuid[])', [f.actors]);
    await client.query('delete from staff_accounts where id=any($1::uuid[])', [f.actors]);
    await client.query('delete from installation_binding where singleton=1 and business_id=$1 and branch_id=$2', [business, branch]);
    await client.query('delete from branches where id=any($1::uuid[])', [f.branches]);
    await client.query('delete from businesses where id=any($1::uuid[])', [f.businesses]);
    for (const table of tables) assert.equal(Number((await client.query(`select count(*) as n from public."${table}"`)).rows[0].n), 0);
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}
