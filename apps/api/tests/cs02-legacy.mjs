// Synthetic pre-shift settlement fixture; caller must capture and certify the committed write.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export async function seedLegacy(runtime, fixture, proof) {
  const orderId = fixture.orders[5], retryKey = fixture.operationKeys[42];
  assert.ok(orderId && retryKey);
  const assessment = await runtime.billing.assess(proof, { orderId, optionalChargeIds: [] });
  const request = { orderId, optionalChargeIds: [], retryKey, expectedCurrencyCode: assessment.currencyCode,
    expectedScale: assessment.scale, expectedPayableMinor: assessment.payableMinor,
    expectedPolicyRevision: assessment.billingPolicy.revision, expectedDisplayRevision: assessment.businessDisplay.revision };
  const bill = { ...assessment, id: randomUUID(), settledAt: new Date().toISOString(),
    payment: { method: 'cash', amountMinor: assessment.payableMinor } };
  await runtime.access.runAuthorized(proof, 'staff', async scope => {
    assert.equal(scope.installation.businessId, fixture.businesses[0]);
    assert.equal(scope.installation.branchId, fixture.branches[0]);
    assert.equal(scope.actorId, fixture.actors[0]);
    assert.equal(await runtime.store.forOrder(scope.installation, orderId, scope.transaction), undefined);
    assert.equal(await runtime.store.forRetry(scope.installation, retryKey, scope.transaction), undefined);
    await runtime.store.insert(scope.installation, { bill, request, actorId: scope.actorId }, scope.transaction);
  });
  return { request, bill };
}
