// CS02 case orchestration; actual PostgreSQL work requires the reviewed runner and separate authorization.
import assert from 'node:assert/strict';

const code = expected => error => (error?.code ?? error?.reason) === expected;
const success = outcome => { if (outcome?.error) throw outcome.error; assert.ok(outcome && 'value' in outcome); return outcome.value; };
const failed = (outcome, expected) => { assert.ok(outcome?.error && code(expected)(outcome.error), `Expected ${expected}`); };

async function settlement(runtime, proof, orderId, sessionId, retryKey, attempt) {
  const assessment = await attempt(() => runtime.billing.assess(proof, { orderId, optionalChargeIds: [] }));
  return { orderId, sessionId, retryKey, optionalChargeIds: [], expectedCurrencyCode: assessment.currencyCode,
    expectedScale: assessment.scale, expectedPayableMinor: assessment.payableMinor,
    expectedPolicyRevision: assessment.billingPolicy.revision, expectedDisplayRevision: assessment.businessDisplay.revision };
}

/** Requires configured drawer and Billing policies. Every write, injection and paired
 * contention operation is wrapped in coordinator attempt(), which must verify captured
 * writes against committed state or certify rollback before checkpointing. */
export async function runBillingCases({ runtime: r, other, fixture: f, proofs, run, attempt, contend, inject }) {
  const admin = proofs[0], keys = f.operationKeys;
  assert.ok(admin && proofs[1] && f.orders.length >= 5 && keys.length >= 40);
  const makeOpen = async index => {
    const drawer = await attempt(() => r.drawers.createDrawer(admin, { label: `CS02 billing ${f.runId} ${index}`, retryKey: keys[20 + index] }));
    const session = await attempt(() => r.drawers.open(admin, drawer.id, { openingMinor: '1000', retryKey: keys[25 + index] }));
    assert.equal(session.revision, 0); return session;
  };
  const closeInput = (revision, key, count = '11000') => ({ expectedRevision: revision, retryKey: key, countedMinor: count, varianceReason: null });
  let savedRequest, savedBill;
  await run('C02', async () => {
    const session = await makeOpen(0), request = await settlement(r, admin, f.orders[0], session.id, keys[30], attempt);
    assert.equal(request.expectedPayableMinor, '10000');
    for (const [store, method] of [[r.drawerStore, 'updateSession'], [r.drawerStore, 'appendEvent'], [r.store, 'insert']]) {
      await attempt(() => inject(store, method, () => r.billing.settle(admin, request)));
      const current = await attempt(() => r.drawers.get(admin, session.id));
      assert.equal(current.revision, 0); assert.equal(current.status, 'open');
      assert.equal(await r.store.forOrder({ businessId: f.businesses[0], branchId: f.branches[0] }, request.orderId), undefined);
    }
    savedBill = await attempt(() => r.billing.settle(admin, request)); savedRequest = request;
    assert.equal(savedBill.payment.amountMinor, '10000');
    assert.deepEqual(await attempt(() => r.billing.settle(admin, request)), savedBill);
    const current = await attempt(() => r.drawers.get(admin, session.id)); assert.equal(current.revision, 1);
    const closed = await attempt(() => r.drawers.close(admin, session.id, closeInput(current.revision, keys[35])));
    assert.equal(closed.closed.expectedMinor, '11000'); assert.equal(closed.closed.varianceMinor, '0');
    assert.deepEqual(await attempt(() => r.billing.settle(admin, request)), savedBill);
  });
  await run('C03', async () => {
    // Settlement owns the lock first: the stale close must refresh, then includes the sale.
    let session = await makeOpen(1);
    let request = await settlement(r, admin, f.orders[1], session.id, keys[31], attempt);
    let results = await attempt(() => contend(r.drawerStore, 'updateSession',
      () => r.billing.settle(admin, request),
      () => other.drawers.close(admin, session.id, closeInput(0, keys[36]))));
    let bill = success(results[0]); failed(results[1], 'STALE_DRAWER');
    let current = await attempt(() => r.drawers.get(admin, session.id)); assert.equal(current.revision, 1);
    let closed = await attempt(() => r.drawers.close(admin, session.id, closeInput(current.revision, keys[36])));
    assert.equal(closed.closed.expectedMinor, '11000'); assert.deepEqual(await attempt(() => r.billing.settle(admin, request)), bill);

    // Close owns the lock first: the subsequent payment is not admitted.
    session = await makeOpen(2); request = await settlement(r, admin, f.orders[2], session.id, keys[32], attempt);
    results = await attempt(() => contend(r.drawerStore, 'updateSession',
      () => r.drawers.close(admin, session.id, closeInput(0, keys[37], '1000')),
      () => other.billing.settle(admin, request)));
    closed = success(results[0]); failed(results[1], 'CASH_DRAWER_CONFLICT');
    assert.equal(closed.closed.expectedMinor, '1000');
    assert.equal(await r.store.forOrder({ businessId: f.businesses[0], branchId: f.branches[0] }, request.orderId), undefined);

    // Payment before handover invalidates the stale handover revision; refresh and retry.
    session = await makeOpen(3); request = await settlement(r, admin, f.orders[3], session.id, keys[33], attempt);
    const handover = revision => ({ recipientStaffId: f.actors[1], expectedRevision: revision, retryKey: keys[38] });
    results = await attempt(() => contend(r.drawerStore, 'updateSession',
      () => r.billing.settle(admin, request), () => other.drawers.beginHandover(admin, session.id, handover(0))));
    bill = success(results[0]); failed(results[1], 'STALE_DRAWER');
    current = await attempt(() => r.drawers.get(admin, session.id));
    let pending = await attempt(() => r.drawers.beginHandover(admin, session.id, handover(current.revision)));
    assert.deepEqual(await attempt(() => r.billing.settle(admin, request)), bill);
    current = await attempt(() => r.drawers.cancelHandover(admin, session.id, pending.pendingHandover.id,
      { expectedRevision: pending.revision, retryKey: keys[35] }));
    closed = await attempt(() => r.drawers.close(admin, session.id, closeInput(current.revision, keys[38])));
    assert.equal(closed.closed.expectedMinor, '11000');

    // Handover owns the lock first: pending custody blocks the subsequent payment.
    session = await makeOpen(4); request = await settlement(r, admin, f.orders[4], session.id, keys[34], attempt);
    results = await attempt(() => contend(r.drawerStore, 'updateSession',
      () => r.drawers.beginHandover(admin, session.id, { recipientStaffId: f.actors[1], expectedRevision: 0, retryKey: keys[39] }),
      () => other.billing.settle(admin, request)));
    pending = success(results[0]); failed(results[1], 'CASH_DRAWER_CONFLICT');
    assert.equal(await r.store.forOrder({ businessId: f.businesses[0], branchId: f.branches[0] }, request.orderId), undefined);
    current = await attempt(() => r.drawers.cancelHandover(admin, session.id, pending.pendingHandover.id,
      { expectedRevision: pending.revision, retryKey: keys[36] }));
    closed = await attempt(() => r.drawers.close(admin, session.id, closeInput(current.revision, keys[39], '1000')));
    assert.equal(closed.closed.expectedMinor, '1000');
  });
  return { savedRequest, savedBill };
}
