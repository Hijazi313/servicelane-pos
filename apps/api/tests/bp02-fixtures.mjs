// Synthetic Billing dependencies only; no accepted Orders/Menu/Kitchen runner reuse.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { sha256 } from './bp02-controls.mjs';
export function policy(fixture, expectedRevision = 0) {
  return { ...fixture.policy, expectedRevision,
    charges: [{ id: fixture.chargeId, label: 'Synthetic optional charge', enabled: true, application: 'optional', kind: 'fixed', fixedMinor: '500', ratePercent: null }],
    taxes: [{ id: fixture.taxId, label: 'Synthetic tax', enabled: true, ratePercent: '10', priceMode: 'exclusive', targets: { merchandise: true, chargeIds: [fixture.chargeId] } }] };
}
export function snapshot(id, offeringId) {
  const selection = { offeringId, addOnIds: [], choices: [] };
  const unit = { offeringId, name: 'Synthetic item', revision: 1, currencyCode: 'PKR', scale: 2, unitMinor: '10000',
    components: [{ itemId: randomUUID(), itemName: 'Synthetic item', variantId: randomUUID(), variantName: 'Size', quantity: 1 }], addOns: [], choices: [] };
  return { id, createdAt: '2026-10-26T00:00:00.000Z', state: 'captured', fulfillment: 'takeaway', amountKind: 'merchandise', currencyCode: 'PKR', scale: 2,
    totalMinor: '10000', policy: { revision: 0, maxLines: 100, maxQuantity: 1000 }, lines: [{ selection, quantity: 1, unit, lineMinor: '10000' }] };
}
export async function setup(runtime, ledger, saveLedger, tables) {
  const { sql } = await import('drizzle-orm');
  const { transactionDatabase } = await import('../dist/billing-check/infrastructure/database/transaction.js');
  const { token, digest } = await import('../dist/billing-check/modules/authentication/application/access-policy.js');
  const { hashInitialPassword } = await import('../dist/billing-check/modules/authentication/infrastructure/password-hash.js');
  const proofs = [{ session: token(), csrf: token() }, { session: token(), csrf: token() }];
  const passwordHash = await hashInitialPassword(randomBytes(24).toString('base64url'));
  ledger.sessionDigests = proofs.map(proof => digest(proof.session));
  ledger.snapshots = ledger.fixture.orders.map(id => snapshot(id, ledger.fixture.runId));
  ledger.setupAttempted = true; await saveLedger();
  await runtime.accessStore.run(async unit => {
    const tx = transactionDatabase(unit.context), f = ledger.fixture;
    for (const table of tables) { assert.match(table, /^[a-z_]+$/); assert.equal(Number((await tx.execute(sql.raw(`select count(*) as n from public."${table}"`))).rows[0].n), 0); }
    for (const [i, id] of f.businesses.entries()) await tx.execute(sql`insert into businesses(id,name,currency_code,timezone) values(${id}::uuid,${ledger.tag + '.' + i},'PKR','Asia/Karachi')`);
    for (const [i, id] of f.branches.entries()) await tx.execute(sql`insert into branches(id,business_id,name) values(${id}::uuid,${f.businesses[i === 2 ? 1 : 0]}::uuid,${ledger.tag + '.branch.' + i})`);
    await tx.execute(sql`insert into installation_binding(singleton,business_id,branch_id) values(1,${f.businesses[0]}::uuid,${f.branches[0]}::uuid)`);
    for (const [i, id] of f.actors.entries()) {
      await unit.saveAccount({ id, businessId: f.businesses[0], username: ledger.tag + '-' + i, displayName: ledger.tag + '-' + i,
        role: i === 0 ? 'administrator' : 'staff', status: 'active', passwordChangeRequired: false, passwordHash, branchIds: [f.branches[0]] });
      const now = new Date();
      await unit.saveSession({ digest: ledger.sessionDigests[i], businessId: f.businesses[0], accountId: id, csrfToken: proofs[i].csrf, createdAt: now, lastActivityAt: now, revokedAt: null });
    }
    for (const [i, id] of f.orders.entries()) {
      const branch = i === 10 ? 1 : i === 11 ? 2 : 0, business = i === 11 ? 1 : 0;
      const saved = ledger.snapshots[i], request = { currencyCode: 'PKR', scale: 2, lines: [{ selection: saved.lines[0].selection, quantity: 1, expectedUnitMinor: '10000' }] };
      await tx.execute(sql`insert into captured_orders(id,business_id,branch_id,retry_key,request,snapshot) values(${id}::uuid,${f.businesses[business]}::uuid,${f.branches[branch]}::uuid,${f.retryKeys[i]},${JSON.stringify(request)}::jsonb,${JSON.stringify(saved)}::jsonb)`);
    }
  });
  ledger.setupCommitted = true; await saveLedger(); return proofs;
}
const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
export async function ownedState(client, ledger, tables) {
  const f = ledger.fixture, state = {};
  for (const table of tables) {
    assert.match(table, /^[a-z_]+$/);
    const rows = (await client.query(`select to_jsonb(t) as row from public."${table}" t`)).rows.map(result => result.row);
    for (const row of rows) {
      switch (table) {
        case 'businesses': assert.ok(f.businesses.includes(row.id)); break;
        case 'branches': assert.ok(f.branches.includes(row.id)); assert.equal(row.business_id, f.businesses[row.id === f.branches[2] ? 1 : 0]); break;
        case 'installation_binding': assert.equal(row.singleton, 1); assert.equal(row.business_id, f.businesses[0]); assert.equal(row.branch_id, f.branches[0]); break;
        case 'staff_accounts': assert.ok(f.actors.includes(row.id)); assert.equal(row.business_id, f.businesses[0]); break;
        case 'staff_credentials': assert.ok(f.actors.includes(row.account_id)); break;
        case 'staff_branch_grants': assert.ok(f.actors.includes(row.account_id)); assert.equal(row.business_id, f.businesses[0]); assert.equal(row.branch_id, f.branches[0]); break;
        case 'access_sessions': assert.ok(ledger.sessionDigests.includes(row.digest)); assert.ok(f.actors.includes(row.account_id)); assert.equal(row.business_id, f.businesses[0]); break;
        case 'captured_orders': {
          const index = f.orders.indexOf(row.id); assert.ok(index >= 0);
          assert.deepEqual(row.snapshot, ledger.snapshots[index]); assert.equal(row.retry_key, f.retryKeys[index]);
          assert.equal(row.business_id, f.businesses[index === 11 ? 1 : 0]); assert.equal(row.branch_id, f.branches[index === 10 ? 1 : index === 11 ? 2 : 0]); break;
        }
        case 'billing_policies': case 'billing_policy_history':
          assert.equal(row.business_id, f.businesses[0]);
          if (table.endsWith('history')) assert.ok(f.actors.includes(row.actor_id)); break;
        case 'business_display_history':
          assert.equal(row.business_id, f.businesses[0]); assert.equal(row.branch_id, f.branches[0]); assert.ok(f.actors.includes(row.actor_id)); break;
        case 'billing_settlements':
          assert.ok(f.orders.includes(row.order_id));
          assert.equal(row.business_id, f.businesses[row.order_id === f.orders[11] ? 1 : 0]);
          assert.equal(row.branch_id, f.branches[row.order_id === f.orders[10] ? 1 : row.order_id === f.orders[11] ? 2 : 0]);
          assert.ok(f.actors.includes(row.actor_id)); assert.equal(row.id, row.bill.id); assert.equal(row.order_id, row.bill.orderId);
          assert.equal(row.retry_key, row.request.retryKey); assert.equal(row.request.orderId, row.order_id); break;
        default: assert.fail('Unexpected populated table');
      }
    }
    // Only digests survive; never persist credentials or raw session/CSRF values.
    state[table] = rows.map(row => sha256(canonical(row))).sort();
  }
  return state;
}
export async function checkpoint(client, ledger, tables, saveLedger) {
  const next = await ownedState(client, ledger, tables);
  if (ledger.state) for (const table of ['captured_orders', 'staff_accounts', 'staff_credentials', 'staff_branch_grants', 'installation_binding']) assert.deepEqual(next[table], ledger.state[table]);
  if (ledger.state) for (const table of ['billing_settlements', 'billing_policy_history', 'business_display_history']) {
    assert.ok(ledger.state[table].every(digest => next[table].includes(digest)), 'Immutable history changed');
  }
  ledger.state = next; await saveLedger();
}
export async function cleanup(pool, ledger, tables) {
  // No digest checkpoint means setup/commit outcome was not independently certified.
  assert.ok(ledger.state, 'Uncertain owned state; retain ledger for reconciliation');
  const client = await pool.connect();
  try {
    await client.query('begin'); await client.query('select pg_advisory_xact_lock(20261012,2)');
    assert.deepEqual(await ownedState(client, ledger, tables), ledger.state);
    const business = ledger.fixture.businesses[0], actors = ledger.fixture.actors;
    await client.query('delete from billing_settlements where order_id=any($1::uuid[])', [ledger.fixture.orders]);
    for (const table of ['billing_policy_history', 'billing_policies', 'business_display_history']) await client.query(`delete from "${table}" where business_id=$1`, [business]);
    await client.query('delete from captured_orders where id=any($1::uuid[])', [ledger.fixture.orders]);
    await client.query('delete from access_sessions where digest=any($1::text[])', [ledger.sessionDigests]);
    await client.query('delete from staff_branch_grants where account_id=any($1::uuid[])', [actors]);
    await client.query('delete from staff_credentials where account_id=any($1::uuid[])', [actors]);
    await client.query('delete from staff_accounts where id=any($1::uuid[])', [actors]);
    await client.query('delete from installation_binding where singleton=1 and business_id=$1 and branch_id=$2', [business, ledger.fixture.branches[0]]);
    await client.query('delete from branches where id=any($1::uuid[])', [ledger.fixture.branches]);
    await client.query('delete from businesses where id=any($1::uuid[])', [ledger.fixture.businesses]);
    for (const table of tables) assert.equal(Number((await client.query(`select count(*) as n from "${table}"`)).rows[0].n), 0);
    await client.query('commit');
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}
