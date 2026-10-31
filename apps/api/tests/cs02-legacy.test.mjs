import test from 'node:test';
import assert from 'node:assert/strict';
import { seedLegacy } from './cs02-legacy.mjs';

test('legacy fixture writes one scoped cash settlement using the original request shape', async () => {
  const fixture = { orders: Array.from({ length: 6 }, (_, i) => `order-${i}`), operationKeys: Array.from({ length: 43 }, (_, i) => `key-${i}`), businesses: ['business'], branches: ['branch'], actors: ['admin'] };
  let saved;
  const scope = { actorId: 'admin', installation: { businessId: 'business', branchId: 'branch' }, transaction: {} };
  const runtime = { billing: { assess: async () => ({ orderId: fixture.orders[5], currencyCode: 'PKR', scale: 2, payableMinor: '100', billingPolicy: { revision: 1 }, businessDisplay: { revision: 0 } }) },
    access: { runAuthorized: async (_proof, policy, work) => { assert.equal(policy, 'staff'); return work(scope); } },
    store: { forOrder: async () => undefined, forRetry: async () => undefined, insert: async (_scope, row) => { saved = row; } } };
  const result = await seedLegacy(runtime, fixture, {});
  assert.deepEqual(saved.request, result.request); assert.equal(result.bill.payment.amountMinor, '100');
  assert.equal('sessionId' in result.request, false); assert.equal(saved.actorId, 'admin');
  runtime.store.forOrder = async () => ({});
  await assert.rejects(seedLegacy(runtime, fixture, {}));
});
