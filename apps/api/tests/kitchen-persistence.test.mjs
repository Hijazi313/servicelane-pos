import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { inTransaction } from '../dist/orders-check/infrastructure/database/transaction.js';
import { PostgresKitchenStore } from '../dist/orders-check/modules/kitchen/infrastructure/postgres-kitchen-store.service.js';
import { PostgresOrderStore } from '../dist/orders-check/modules/orders/infrastructure/postgres-order-store.service.js';

test('offline Drizzle SQL retains trusted scope, immutable-position bounds and atomic state predicates', async () => {
  // Synthetic driver only: no Pool, connection string, environment loading or network.
  const queries = [];
  const client = { query: async (config, params) => { queries.push({ sql: typeof config === 'string' ? config : config.text, params }); return { rows: [] }; } };
  const db = drizzle({ client });
  const scope = { businessId: randomUUID(), branchId: randomUUID() }, id = randomUUID(), actor = randomUUID();
  const store = new PostgresKitchenStore({ db });
  await store.page(scope, '2', '9', 26);
  let query = queries.at(-1);
  assert.match(query.sql, /business_id.*=.*branch_id.*=.*position.*>.*position.*<=.*order by.*position.*asc.*limit/s);
  assert.deepEqual(query.params, [scope.businessId, scope.branchId, 2n, 9n, 26]);
  // A queue summary must not retrieve full preparation JSON from persistence.
  assert.match(query.sql, /preparation.*->>'capturedAt'/); assert.doesNotMatch(query.sql, /select \*/);
  await inTransaction(db, async tx => {
    await store.advance(scope, id, 0, 'preparing', actor, '2026-10-23T00:00:00.000Z', tx);
    query = queries.at(-1);
    assert.match(query.sql, /update.*set.*preparing_by.*where.*business_id.*branch_id.*id.*revision.*state.*returning/s);
    assert.ok(query.params.includes(actor)); assert.deepEqual(query.params.slice(-5), [scope.businessId, scope.branchId, id, 0, 'queued']);
    const orderStore = new PostgresOrderStore({ db: { select() { throw new Error('Root handle must not be used'); } } });
    await orderStore.get(scope.businessId, scope.branchId, id, tx);
    assert.match(queries.at(-1).sql, /captured_orders/);
  });
});
