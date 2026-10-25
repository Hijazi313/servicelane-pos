import assert from 'node:assert/strict';
import { fixture as ordersFixture } from './orders-fixture.mjs';
import { KitchenService } from '../dist/orders-check/modules/kitchen/application/kitchen.service.js';
import { OrderPreparationService } from '../dist/orders-check/modules/orders/public.js';
export function fixture() {
  const h = ordersFixture();
  let records = [], sequence = 0n, active, failInsert = false, projectionReads = 0;
  const run = h.access.runAuthorized.bind(h.access);
  h.access.runAuthorized = (proof, policy, work) => run(proof, policy, async scope => {
    const before = structuredClone(records); active = scope.transaction;
    try { return await work(scope); } catch (error) { records = before; throw error; } finally { active = undefined; }
  });
  const scoped = (row, scope) => row.scope.businessId === scope.businessId && row.scope.branchId === scope.branchId;
  const find = (scope, id) => records.find(row => scoped(row, scope) && row.ticket.id === id);
  const store = {
    get: async (scope, id, tx) => { if (tx) assert.equal(tx, active); return structuredClone(find(scope, id)?.ticket); },
    forOrder: async (scope, orderId, tx) => { assert.equal(tx, active); return structuredClone(records.find(row => scoped(row, scope) && row.ticket.orderId === orderId)?.ticket); },
    insert: async (scope, ticket, tx) => {
      assert.equal(tx, active); assert.equal(records.some(row => scoped(row, scope) && row.ticket.orderId === ticket.orderId), false);
      records.push({ scope: { businessId: scope.businessId, branchId: scope.branchId }, ticket: structuredClone(ticket), position: (++sequence).toString() });
      if (failInsert) { failInsert = false; throw new Error('SyntheticPrivateSQL'); }
      return structuredClone(ticket);
    },
    advance: async (scope, id, expected, target, actorId, at, tx) => {
      assert.equal(tx, active); const row = find(scope, id);
      if (!row || row.ticket.revision !== expected) return undefined;
      Object.assign(row.ticket, { state: target, revision: expected + 1, ...(target === 'preparing' ? { preparingAt: at, preparingBy: actorId } : { readyAt: at, readyBy: actorId }) });
      return structuredClone(row.ticket);
    },
    maximum: async scope => records.filter(row => scoped(row, scope)).at(-1)?.position ?? '0',
    page: async (scope, after, fence, limit) => records.filter(row => scoped(row, scope) && BigInt(row.position) > BigInt(after) && BigInt(row.position) <= BigInt(fence)).slice(0, limit).map(row => ({ position: row.position, summary: {
      id: row.ticket.id, orderId: row.ticket.orderId, capturedAt: row.ticket.capturedAt, dispatchedAt: row.ticket.dispatchedAt, state: row.ticket.state, revision: row.ticket.revision,
    } })),
  };
  const originalGet = h.store.get;
  const preparation = new OrderPreparationService({ get: async (business, branch, id, tx) => {
    assert.equal(tx, active); projectionReads++; return originalGet(business, branch, id);
  } });
  const kitchen = new KitchenService(h.access, preparation, store);
  const capture = () => h.service.create(h.proof, h.body());
  return { ...h, kitchen, kitchenStore: store, preparation, capture, records: () => records, failInsert: () => { failInsert = true; }, projectionReads: () => projectionReads };
}
