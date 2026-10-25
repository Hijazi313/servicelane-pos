import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fixture } from './kitchen-fixture.mjs';
import { KitchenService, ticketFits } from '../dist/orders-check/modules/kitchen/application/kitchen.service.js';
import { KitchenQueueCursor } from '../dist/orders-check/modules/kitchen/application/kitchen-queue-cursor.js';
import { TICKET_RESPONSE_BYTES, queueRequest } from '../dist/orders-check/modules/kitchen/domain/preparation.js';
const rejects = (work, code) => assert.rejects(work, error => error.code === code);

test('dispatch retry and concurrent model create one scoped ticket; immutable history and rollback', async () => {
  const h = fixture(), order = await h.capture();
  assert.equal(h.records().length, 0);
  const [a, b] = await Promise.all([h.kitchen.dispatch(h.proof, { orderId: order.id }), h.kitchen.dispatch(h.proof, { orderId: order.id })]);
  assert.deepEqual(a, b); assert.equal(h.records().length, 1); assert.equal(h.projectionReads(), 1);
  assert.equal('dispatchedBy' in a, false); assert.equal(h.records()[0].ticket.dispatchedBy, h.state().account.id);
  h.state().catalogue.length = 0;
  assert.deepEqual(await h.kitchen.get(h.proof, a.id), a);
  assert.deepEqual(await h.service.get(h.proof, order.id), order);
  const missing = randomUUID(); await rejects(() => h.kitchen.dispatch(h.proof, { orderId: missing }), 'ORDER_NOT_FOUND');
  const other = { ...structuredClone(order), id: randomUUID() };
  h.state().orders.push({ business: h.installation.businessId, branch: h.installation.branchId, key: randomUUID(), order: { snapshot: other } });
  h.failInsert(); await assert.rejects(h.kitchen.dispatch(h.proof, { orderId: other.id }), /SyntheticPrivateSQL/);
  assert.equal(h.records().length, 1);
  const retried = await h.kitchen.dispatch(h.proof, { orderId: other.id }); assert.equal(h.records().length, 2); assert.equal(retried.revision, 0);
});

test('revision races, retries and attribution remain distinct across both transitions', async () => {
  const h = fixture(), order = await h.capture(), ticket = await h.kitchen.dispatch(h.proof, { orderId: order.id });
  const dispatchedBy = h.records()[0].ticket.dispatchedBy;
  h.state().account.id = randomUUID(); h.state().session.accountId = h.state().account.id; const preparingBy = h.state().account.id;
  const [a, b] = await Promise.all([0, 1].map(() => h.kitchen.advance(h.proof, ticket.id, { state: 'preparing', expectedRevision: 0 })));
  assert.deepEqual(a, b); assert.equal(a.revision, 1);
  h.state().account.id = randomUUID(); h.state().session.accountId = h.state().account.id;
  const immediate = await h.kitchen.advance(h.proof, ticket.id, { state: 'preparing', expectedRevision: 0 }); assert.deepEqual(immediate, a);
  const ready = await h.kitchen.advance(h.proof, ticket.id, { state: 'ready', expectedRevision: 1 }); assert.equal(ready.revision, 2);
  const stored = h.records()[0].ticket;
  assert.equal(stored.dispatchedBy, dispatchedBy); assert.equal(stored.preparingBy, preparingBy); assert.equal(stored.readyBy, h.state().account.id);
  assert.deepEqual(await h.kitchen.advance(h.proof, ticket.id, { state: 'ready', expectedRevision: 1 }), ready);
  for (const body of [{ state: 'preparing', expectedRevision: 0 }, { state: 'ready', expectedRevision: 0 }, { state: 'preparing', expectedRevision: 1 }]) await rejects(() => h.kitchen.advance(h.proof, ticket.id, body), 'STALE_TICKET');
  assert.deepEqual(await h.kitchen.dispatch(h.proof, { orderId: order.id }), ready);
  const nextOrder = await h.capture(), next = await h.kitchen.dispatch(h.proof, { orderId: nextOrder.id });
  await rejects(() => h.kitchen.advance(h.proof, next.id, { state: 'ready', expectedRevision: 0 }), 'STALE_TICKET');
});

test('finite summary scan discovers pre-fence tickets exactly once and refreshes after later dispatch/status', async () => {
  const h = fixture();
  for (let i = 0; i < 4; i++) { const order = await h.capture(); await h.kitchen.dispatch(h.proof, { orderId: order.id }); }
  const first = await h.kitchen.list(h.proof, { limit: '2' }); assert.equal(first.tickets.length, 2); assert.ok(first.nextCursor);
  assert.equal('preparation' in first.tickets[0], false);
  // Timestamps can go backwards; immutable persistence order governs pagination.
  h.records()[0].ticket.dispatchedAt = '2099-01-01T00:00:00.000Z';
  const late = await h.capture(); await h.kitchen.dispatch(h.proof, { orderId: late.id });
  await h.kitchen.advance(h.proof, first.tickets[0].id, { state: 'preparing', expectedRevision: 0 });
  const second = await h.kitchen.list(h.proof, { limit: '2', cursor: first.nextCursor });
  assert.equal(second.nextCursor, undefined); assert.equal(new Set([...first.tickets, ...second.tickets].map(row => row.id)).size, 4);
  const fresh = await h.kitchen.list(h.proof, {}); assert.equal(fresh.tickets.length, 5); assert.equal(fresh.tickets[0].state, 'preparing');
  assert.equal((await h.kitchen.get(h.proof, fresh.tickets[0].id)).preparation.lines.length, 1);
  for (const value of [{ limit: '0' }, { limit: '101' }, { state: 'queued' }]) await rejects(() => h.kitchen.list(h.proof, value), 'INVALID_KITCHEN_INPUT');
  for (const cursor of ['3:2', '0:999', '0:9223372036854775808', 'bad']) await rejects(() => h.kitchen.list(h.proof, { cursor }), 'INVALID_KITCHEN_CURSOR');
  assert.throws(() => queueRequest({ cursor: ['0:1'] }));
});

test('foreign records/orders and revoked authority fail without work', async () => {
  const h = fixture(), own = await h.capture(), saved = await h.kitchen.dispatch(h.proof, { orderId: own.id });
  h.records()[0].scope.branchId = randomUUID();
  await rejects(() => h.kitchen.get(h.proof, saved.id), 'TICKET_NOT_FOUND');
  await rejects(() => h.kitchen.advance(h.proof, saved.id, { state: 'preparing', expectedRevision: 0 }), 'TICKET_NOT_FOUND');
  assert.equal((await h.kitchen.list(h.proof, {})).tickets.length, 0);
  h.state().orders[0].branch = randomUUID(); await rejects(() => h.kitchen.dispatch(h.proof, { orderId: own.id }), 'ORDER_NOT_FOUND');
  h.state().session.revokedAt = new Date();
  await assert.rejects(h.kitchen.dispatch(h.proof, { orderId: own.id }), error => error.reason === 'UNAUTHENTICATED');
  assert.equal(h.records().length, 1);
});

test('reserve final response growth at inclusive UTF-8 boundary and reject oversize before persistence', async () => {
  const h = fixture(), order = await h.capture(), saved = await h.kitchen.dispatch(h.proof, { orderId: order.id }), record = h.records()[0].ticket;
  const base = structuredClone(record); base.preparation.instructions = '';
  const reserved = { data: { ...saved, preparation: base.preparation, state: 'ready', revision: 2, preparingAt: '9999-12-31T23:59:59.999Z', readyAt: '9999-12-31T23:59:59.999Z' }, meta: { requestId: '00000000-0000-0000-0000-000000000000' } };
  const remaining = TICKET_RESPONSE_BYTES - Buffer.byteLength(JSON.stringify(reserved));
  base.preparation.instructions = 'é'.repeat(Math.floor(remaining / 2)) + 'x'.repeat(remaining % 2);
  assert.equal(ticketFits(base), true); base.preparation.instructions += 'x'; assert.equal(ticketFits(base), false);
  const failing = new KitchenService(h.access, { get: async () => base.preparation }, h.kitchenStore);
  await rejects(() => failing.dispatch(h.proof, { orderId: randomUUID() }), 'TICKET_CAPACITY'); assert.equal(h.records().length, 1);
});


test('queue tokens reject tampering, different scope/limit and service restart', async () => {
  const h = fixture();
  for (let index = 0; index < 2; index++) { const order = await h.capture(); await h.kitchen.dispatch(h.proof, { orderId: order.id }); }
  const page = await h.kitchen.list(h.proof, { limit: 1 });
  const token = page.nextCursor; assert.equal(typeof token, 'string');
  const [payload, signature] = token.split('.');
  const changed = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), a: '0' })).toString('base64url');
  await rejects(() => h.kitchen.list(h.proof, { limit: 1, cursor: `${changed}.${signature}` }), 'INVALID_KITCHEN_CURSOR');
  await rejects(() => h.kitchen.list(h.proof, { limit: 2, cursor: token }), 'INVALID_KITCHEN_CURSOR');
  const codec = new KitchenQueueCursor();
  const scoped = codec.issue({ after: '1', fence: '2' }, h.installation, 1);
  assert.throws(() => codec.read(scoped, { ...h.installation, branchId: randomUUID() }, 1), error => error.code === 'INVALID_KITCHEN_CURSOR');
  assert.throws(() => codec.read(scoped, { ...h.installation, businessId: randomUUID() }, 1), error => error.code === 'INVALID_KITCHEN_CURSOR');
  const restarted = new KitchenService(h.access, h.preparation, h.kitchenStore);
  await rejects(() => restarted.list(h.proof, { limit: 1, cursor: token }), 'INVALID_KITCHEN_CURSOR');
  assert.equal((await restarted.list(h.proof, { limit: 1 })).tickets.length, 1);
});

test('unexpected persistence failures preserve the original error for the HTTP boundary', async () => {
  const h = fixture(), failure = new Error('PrivateFailure');
  const service = new KitchenService(h.access, h.preparation, { ...h.kitchenStore, maximum: async () => { throw failure; } });
  await assert.rejects(service.list(h.proof, {}), error => error === failure);
});
