import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { contend, injected } from './bp02-controls.mjs';
import { policy, ownedState } from './bp02-fixtures.mjs';
export const code = expected => error => (error.code ?? error.reason) === expected;
export async function settlementRequest(runtime, proof, orderId, optionalChargeIds = []) {
  const a = await runtime.billing.assess(proof, { orderId, optionalChargeIds });
  return { orderId, retryKey: randomUUID(), optionalChargeIds, expectedCurrencyCode: a.currencyCode, expectedScale: a.scale,
    expectedPayableMinor: a.payableMinor, expectedPolicyRevision: a.billingPolicy.revision, expectedDisplayRevision: a.businessDisplay.revision };
}
function successful(result) { if (result.error) throw result.error; return result.value; }
export async function runCases({ runtime: r, other, one, proofs: [proof, staff], ledger, tables, observe, record, checkpoint }) {
  const { inTransaction } = await import('../dist/billing-check/infrastructure/database/transaction.js');
  const f = ledger.fixture, scope = { businessId: f.businesses[0], branchId: f.branches[0] };
  await r.billing.replacePolicy(proof, policy(f)); await checkpoint();
  const run = async (id, work) => { record(id, 'running'); await work(); await checkpoint(); record(id, 'passed'); };
  let savedRequest, savedBill;
  await run('B01', async () => {
    for (const id of [f.orders[10], f.orders[11], randomUUID()]) {
      await assert.rejects(r.billing.assess(proof, { orderId: id, optionalChargeIds: [] }), code('ORDER_NOT_FOUND'));
    }
    const request = await settlementRequest(r, proof, f.orders[7], [f.chargeId]);
    const bill = await r.billing.settle(proof, request); assert.equal(bill.payableMinor, '11550');
    // Test-only foreign records, same retry key: scoped uniqueness and actual hidden rows.
    for (const index of [10, 11]) {
      const foreignScope = { businessId: f.businesses[index === 11 ? 1 : 0], branchId: f.branches[index === 11 ? 2 : 1] };
      const foreign = { bill: { ...bill, id: randomUUID(), orderId: f.orders[index] }, request: { ...request, orderId: f.orders[index] }, actorId: f.actors[0] };
      await inTransaction(r.database.db, tx => r.store.insert(foreignScope, foreign, tx));
      await assert.rejects(r.billing.get(proof, f.orders[index]), code('BILL_NOT_FOUND'));
      assert.equal(await r.store.forOrder(scope, f.orders[index]), undefined);
      assert.equal(await r.store.forOrder(foreignScope, bill.orderId), undefined);
    }
    assert.equal(await r.store.policy({ businessId: f.businesses[1], branchId: f.branches[2] }), undefined);
  });
  await run('B02', async () => {
    savedRequest = await settlementRequest(r, proof, f.orders[0]); assert.equal(savedRequest.expectedPayableMinor, '11000');
    const outcomes = await contend(r.store, 'insert', () => r.billing.settle(proof, savedRequest), () => other.billing.settle(staff, savedRequest), observe);
    savedBill = successful(outcomes[0]); assert.deepEqual(successful(outcomes[1]), savedBill);
    const rows = (await one.query('select actor_id,bill,request from billing_settlements where order_id=$1', [savedBill.orderId])).rows;
    assert.deepEqual(rows, [{ actor_id: f.actors[0], bill: savedBill, request: savedRequest }]);
    // Model a lost response by ignoring the known committed result and recovering with same key.
    assert.deepEqual(await r.billing.settle(proof, savedRequest), savedBill);
    await assert.rejects(r.billing.settle(proof, { ...savedRequest, optionalChargeIds: [f.chargeId] }), code('SETTLEMENT_RETRY_CONFLICT'));
  });
  await run('B03', async () => {
    const first = await settlementRequest(r, proof, f.orders[1]), second = { ...first, retryKey: randomUUID() };
    const results = await contend(r.store, 'insert', () => r.billing.settle(proof, first), () => other.billing.settle(staff, second), observe);
    successful(results[0]); assert.ok(code('ORDER_ALREADY_SETTLED')(results[1].error));
    assert.equal(Number((await one.query('select count(*) as n from billing_settlements where order_id=$1', [first.orderId])).rows[0].n), 1);
    // Two independent database uniqueness guarantees, both rolled back. No mutation fuzzing.
    const row = (await one.query('select * from billing_settlements where order_id=$1', [first.orderId])).rows[0];
    for (const duplicate of ['order', 'retry']) {
      const client = await one.connect();
      try {
        await client.query('begin');
        const id = randomUUID(), orderId = duplicate === 'order' ? row.order_id : f.orders[8], retryKey = duplicate === 'retry' ? row.retry_key : randomUUID();
        await assert.rejects(client.query('insert into billing_settlements(id,business_id,branch_id,order_id,retry_key,actor_id,bill,request) values($1,$2,$3,$4,$5,$6,$7,$8)',
          [id, row.business_id, row.branch_id, orderId, retryKey, row.actor_id, { ...row.bill, id, orderId }, { ...row.request, orderId, retryKey }]), error => error.code === '23505' && error.constraint === (duplicate === 'order' ? 'billing_order_scope' : 'billing_retry_scope'));
      } finally { try { await client.query('rollback'); } finally { client.release(); } }
    }
  });
  await run('B04', async () => {
    for (const [kindIndex, kind] of ['policy', 'display'].entries()) for (const editFirst of [true, false]) {
      const orderId = f.orders[2 + kindIndex * 2 + (editFirst ? 0 : 1)], request = await settlementRequest(r, proof, orderId);
      const oldPolicy = await r.billing.getPolicy(proof), oldDisplay = await r.displayAdmin.read(proof);
      // Full accepted replacement shape; no extra revision property crosses normalization.
      const { revision, ...body } = oldPolicy;
      const policyEdit = () => r.billing.replacePolicy(proof, { ...body, expectedRevision: revision, rounding: body.rounding === 'halfUp' ? 'halfEven' : 'halfUp', configurationNote: 'Synthetic race' });
      const displayEdit = () => r.displayAdmin.update(proof, { expectedRevision: oldDisplay.revision, businessName: oldDisplay.businessName,
        branchName: oldDisplay.branchName + 'x', branchAddress: oldDisplay.branchAddress });
      const change = kind === 'policy' ? policyEdit : displayEdit;
      const first = editFirst ? change : () => r.billing.settle(proof, request);
      const second = editFirst ? () => other.billing.settle(staff, request) : async () => {
        // Edit must use contender's real Access transaction too.
        if (kind === 'policy') return other.billing.replacePolicy(proof, { ...body, expectedRevision: revision, rounding: body.rounding === 'halfUp' ? 'halfEven' : 'halfUp', configurationNote: 'Synthetic race' });
        return other.displayAdmin.update(proof, { expectedRevision: oldDisplay.revision, businessName: oldDisplay.businessName, branchName: oldDisplay.branchName + 'x', branchAddress: oldDisplay.branchAddress });
      };
      const store = editFirst ? kind === 'policy' ? r.store : r.displayStore : r.store;
      const result = await contend(store, editFirst ? kind === 'policy' ? 'replacePolicy' : 'replace' : 'insert', first, second, observe);
      const winner = successful(result[0]);
      if (editFirst) {
        assert.ok(code('STALE_ASSESSMENT')(result[1].error)); assert.equal(await r.store.forOrder(scope, orderId), undefined);
      } else {
        successful(result[1]); assert.deepEqual(winner.billingPolicy, oldPolicy); assert.deepEqual(winner.businessDisplay, oldDisplay);
        assert.deepEqual(await r.billing.get(proof, orderId), winner);
      }
    }
  });
  await run('B05', async () => {
    const request = await settlementRequest(r, proof, f.orders[6]);
    const before = await ownedState(one, ledger, tables);
    await injected(r.store, 'insert', () => r.billing.settle(proof, request));
    assert.deepEqual(await ownedState(one, ledger, tables), before);
    const current = await r.billing.getPolicy(proof), { revision, ...body } = current;
    const beforePolicy = await ownedState(one, ledger, tables);
    await injected(r.store, 'replacePolicy', () => r.billing.replacePolicy(proof, { ...body, expectedRevision: revision, rounding: body.rounding === 'halfUp' ? 'halfEven' : 'halfUp', configurationNote: 'Synthetic rollback' }));
    assert.deepEqual(await ownedState(one, ledger, tables), beforePolicy);
    const display = await r.displayAdmin.read(proof), beforeDisplay = await ownedState(one, ledger, tables);
    await injected(r.displayStore, 'replace', () => r.displayAdmin.update(proof, { expectedRevision: display.revision, businessName: display.businessName, branchName: 'Synthetic rollback', branchAddress: null }));
    assert.deepEqual(await ownedState(one, ledger, tables), beforeDisplay);
    await r.billing.settle(proof, request);
  });
  const retired = policy(f);
  await run('B06', async () => {
    let current = await r.billing.getPolicy(proof);
    await r.billing.replacePolicy(proof, { ...policy(f, current.revision), charges: [], taxes: [] });
    const display = await r.displayAdmin.read(proof);
    await r.displayAdmin.update(proof, { expectedRevision: display.revision, businessName: 'Synthetic renamed', branchName: 'Synthetic renamed', branchAddress: null });
    current = await r.billing.getPolicy(proof);
    await r.billing.replacePolicy(proof, { ...policy(f, current.revision), status: 'unconfigured', currencyCode: null, scale: null, charges: [], taxes: [] });
    assert.deepEqual(await r.billing.settle(proof, savedRequest), savedBill);
    assert.deepEqual(await r.billing.get(proof, savedBill.orderId), savedBill);
    await assert.rejects(r.billing.settle(proof, { ...savedRequest, expectedPolicyRevision: savedRequest.expectedPolicyRevision + 1 }), code('SETTLEMENT_RETRY_CONFLICT'));
    current = await r.billing.getPolicy(proof); retired.expectedRevision = current.revision;
    const retiredIds = await r.access.runAuthorized(proof, 'administrator', scope => r.store.retiredRuleIds(scope.installation, scope.transaction));
    assert.deepEqual(retiredIds.sort(), [f.chargeId, f.taxId].sort());
    await assert.rejects(r.billing.replacePolicy(proof, retired), code('INVALID_BILLING_INPUT'));
    const history = (await one.query('select revision,previous,next,actor_id,changed_at,configuration_note from billing_policy_history order by revision')).rows;
    assert.equal(history.length, current.revision);
    for (const [index, row] of history.entries()) {
      assert.equal(row.revision, index + 1); assert.equal(row.previous.revision, index); assert.equal(row.next.revision, index + 1);
      if (index) assert.deepEqual(row.previous, history[index - 1].next);
      assert.equal(row.actor_id, f.actors[0]); assert.ok(Number.isFinite(Date.parse(row.changed_at))); assert.ok(row.configuration_note);
    }
    const displayHistory = (await one.query('select revision,before,after,actor_id,changed_at from business_display_history order by revision')).rows;
    const finalDisplay = await r.displayAdmin.read(proof); assert.equal(displayHistory.length, finalDisplay.revision);
    for (const [index, row] of displayHistory.entries()) {
      assert.equal(row.revision, index + 1); assert.equal(row.before.revision, index); assert.equal(row.after.revision, index + 1);
      if (index) assert.deepEqual(row.before, displayHistory[index - 1].after);
      assert.equal(row.actor_id, f.actors[0]); assert.ok(Number.isFinite(new Date(row.changed_at).getTime()));
    }
    const before = (await one.query('select bill,request,actor_id from billing_settlements where order_id=$1', [savedBill.orderId])).rows[0];
    assert.deepEqual(before, { bill: savedBill, request: savedRequest, actor_id: f.actors[0] });
    // Session revocation control only; no Access administration workflow rerun.
    await one.query('update access_sessions set revoked_at=now() where digest=$1', [ledger.sessionDigests[1]]);
    await assert.rejects(other.billing.settle(staff, savedRequest), code('UNAUTHENTICATED'));
  });
  return { proof, bill: savedBill, request: savedRequest, foreignIds: [f.orders[10], f.orders[11]], retired };
}
