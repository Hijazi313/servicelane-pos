import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { BillingService } from '../dist/billing-check/modules/billing/application/billing.service.js';
import { initialPolicy } from '../dist/billing-check/modules/billing/domain/billing.js';
import { AccessError } from '../dist/billing-check/modules/authentication/application/access-policy.js';

import { billingFixture } from './billing-fixture.mjs';

const code = expected => error => (error.code ?? error.reason) === expected;
test('BP-A01/03/08/12: configured policy, no-op, stale and authorization gates preserve state', async () => {
  const h = billingFixture();
  assert.equal((await h.service.getPolicy(h.proof)).status, 'unconfigured'); assert.equal(h.state().history.length, 0);
  await assert.rejects(h.service.assess(h.proof, { orderId: h.order.orderId, optionalChargeIds: [] }), code('BILLING_POLICY_UNCONFIGURED'));
  h.admin(false); await assert.rejects(h.service.replacePolicy(h.proof, h.policy()), code('FORBIDDEN')); h.admin(true);
  await assert.rejects(h.service.replacePolicy(h.proof, h.policy({ scale: 0 })), code('UNSUPPORTED_BILL_CURRENCY'));
  const p = await h.service.replacePolicy(h.proof, h.policy()); assert.equal(p.revision, 1);
  await h.service.replacePolicy(h.proof, h.policy({ configurationNote: 'Note only' })); assert.equal(h.state().history.length, 1);
  await assert.rejects(h.service.replacePolicy(h.proof, h.policy({ expectedRevision: 0 })), code('STALE_BILLING_POLICY'));
  const a = await h.service.assess(h.proof, { orderId: h.order.orderId, optionalChargeIds: [] }); assert.equal(a.payableMinor, '10000');
  const r = h.request(a); h.setDisplay({ revision: 1 });
  await assert.rejects(h.service.settle(h.proof, r), code('STALE_ASSESSMENT')); assert.equal(h.state().records.length, 0);
  await assert.rejects(h.service.assess({ ...h.proof, csrf: 'bad' }, { orderId: h.order.orderId, optionalChargeIds: [] }), code('FORBIDDEN'));
  await assert.rejects(h.service.assess(h.proof, { orderId: randomUUID(), optionalChargeIds: [] }), code('ORDER_NOT_FOUND'));
  await assert.rejects(h.service.get(h.proof, randomUUID()), code('BILL_NOT_FOUND'));
});
test('BP-A04/05/06/13/16: immutable settlement, selected-charge identity and replay before changed policy', async () => {
  const h = billingFixture(), id = randomUUID();
  await h.service.replacePolicy(h.proof, h.policy({ charges: [{ id, enabled: true, label: 'Offline optional', application: 'optional', kind: 'fixed', fixedMinor: '200', ratePercent: null }] }));
  const original = structuredClone(h.order);
  const a = await h.service.assess(h.proof, { orderId: h.order.orderId, optionalChargeIds: [id] });
  const r = h.request(a, { optionalChargeIds: [id] }), bill = await h.service.settle(h.proof, r);
  assert.equal(bill.payableMinor, '10200'); assert.deepEqual(bill.payment, { method: 'cash', amountMinor: '10200' }); assert.deepEqual(h.order, original);
  await h.service.replacePolicy(h.proof, h.policy({ status: 'unconfigured', currencyCode: null, scale: null })); h.setDisplay({ currencyCode: 'USD', revision: 3 });
  const reads = h.state().projectionReads; assert.deepEqual(await h.service.settle(h.proof, r), bill); assert.equal(h.state().projectionReads, reads);
  assert.deepEqual(await h.service.get(h.proof, h.order.orderId), bill);
  await assert.rejects(h.service.settle(h.proof, { ...r, optionalChargeIds: [] }), code('SETTLEMENT_RETRY_CONFLICT'));
  await assert.rejects(h.service.settle(h.proof, { ...r, retryKey: randomUUID() }), code('ORDER_ALREADY_SETTLED'));
  await assert.rejects(h.service.assess(h.proof, { orderId: h.order.orderId, optionalChargeIds: [] }), code('ORDER_ALREADY_SETTLED'));
  h.deny(true); await assert.rejects(h.service.settle(h.proof, r), code('UNAUTHENTICATED')); assert.equal(h.state().records.length, 1);
});
test('BP-A04: rejected commit leaves no synthetic bill/retry and original key can recover', async () => {
  const h = billingFixture(); await h.service.replacePolicy(h.proof, h.policy());
  const a = await h.service.assess(h.proof, { orderId: h.order.orderId, optionalChargeIds: [] }), r = h.request(a);
  h.fail(true); await assert.rejects(h.service.settle(h.proof, r), /Synthetic SQL secret/); assert.equal(h.state().records.length, 0);
  h.fail(false); await h.service.settle(h.proof, r); assert.equal(h.state().records.length, 1);
});

test('BP-A03/13/16: stale revisions win removed-selector errors and revision-only key changes conflict', async () => {
  const h = billingFixture(), id = randomUUID();
  await h.service.replacePolicy(h.proof, h.policy({ charges: [{ id, enabled: true, label: 'Optional', application: 'optional', kind: 'fixed', fixedMinor: '1', ratePercent: null }] }));
  const a = await h.service.assess(h.proof, { orderId: h.order.orderId, optionalChargeIds: [id] }), r = h.request(a, { optionalChargeIds: [id] });
  await h.service.replacePolicy(h.proof, h.policy());
  await assert.rejects(h.service.settle(h.proof, r), code('STALE_ASSESSMENT'));
  const fresh = await h.service.assess(h.proof, { orderId: h.order.orderId, optionalChargeIds: [] }), confirmed = h.request(fresh);
  await h.service.settle(h.proof, confirmed);
  await assert.rejects(h.service.settle(h.proof, { ...confirmed, expectedPolicyRevision: confirmed.expectedPolicyRevision + 1 }), code('SETTLEMENT_RETRY_CONFLICT'));
});
