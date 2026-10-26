import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { inTransaction } from '../dist/billing-check/infrastructure/database/transaction.js';
import { PostgresBillingStore } from '../dist/billing-check/modules/billing/infrastructure/postgres-billing-store.service.js';
import { CURRENCY_PRECISION } from '../dist/billing-check/common/currency-precision.js';
import { CURRENCY_PRECISION as menuPrecision } from '../dist/billing-check/modules/menu/domain/currency-precision.js';

test('BP-A04/05 SQL source uses trusted scoped order/retry reads and one atomic aggregate insert', async () => {
  const queries = [];
  const client = { query: async (config, params) => { queries.push({ sql: typeof config === 'string' ? config : config.text, params }); return { rows: [] }; } };
  const db = drizzle({ client }), store = new PostgresBillingStore({ db });
  const scope = { businessId: randomUUID(), branchId: randomUUID() }, orderId = randomUUID(), retryKey = randomUUID();
  await store.forOrder(scope, orderId);
  assert.match(queries.at(-1).sql, /where.*business_id.*branch_id.*order_id/s);
  assert.deepEqual(queries.at(-1).params, [scope.businessId, scope.branchId, orderId]);
  await inTransaction(db, async tx => {
    await store.forRetry(scope, retryKey, tx);
    assert.deepEqual(queries.at(-1).params, [scope.businessId, scope.branchId, retryKey]);
    const bill = { id: randomUUID(), orderId, payment: { method: 'cash', amountMinor: '100' } };
    await store.insert(scope, { bill, request: { retryKey }, actorId: randomUUID() }, tx);
    assert.match(queries.at(-1).sql, /insert into "billing_settlements"/);
    assert.doesNotMatch(queries.at(-1).sql, /on conflict|update|delete/i);
  });
  assert.equal(queries[1].sql, 'begin');
  assert.equal(queries.at(-1).sql, 'commit');
});
test('BP-A04 escaped uniqueness failure propagates for rollback without internal retry', async () => {
  const queries = [];
  const client = { query: async config => {
    const sql = typeof config === 'string' ? config : config.text; queries.push(sql);
    if (sql.startsWith('insert')) throw Object.assign(new Error('synthetic unique'), { code: '23505' });
    return { rows: [] };
  } };
  const db = drizzle({ client }), store = new PostgresBillingStore({ db });
  await assert.rejects(inTransaction(db, tx => store.insert({ businessId: randomUUID(), branchId: randomUUID() }, {
    bill: { id: randomUUID(), orderId: randomUUID() }, request: { retryKey: randomUUID() }, actorId: randomUUID(),
  }, tx)), { code: 'BILLING_UNAVAILABLE' });
  assert.equal(queries.filter(sql => sql.startsWith('insert')).length, 1);
  assert.equal(queries.at(-1), 'rollback');
});
test('BP-A02 shared standard precision preserves existing Menu registry identity', () => {
  assert.equal(CURRENCY_PRECISION, menuPrecision);
  assert.equal(CURRENCY_PRECISION.PKR, 2);
  assert.equal(CURRENCY_PRECISION.JPY, 0);
  assert.equal(CURRENCY_PRECISION.KWD, 3);
  assert.equal(CURRENCY_PRECISION.CLF, 4);
  assert.equal(CURRENCY_PRECISION.ZZZ, undefined);
});
test('BP-A11 owned known connection failures map unavailable; unknown failures remain unexpected', async () => {
  for (const errorCode of ['ECONNREFUSED', '08006', '57P01', 'synthetic-unknown']) {
    const client = { query: async () => { throw Object.assign(new Error('private connection detail'), { code: errorCode }); } };
    const store = new PostgresBillingStore({ db: drizzle({ client }) });
    await assert.rejects(store.policy({ businessId: randomUUID(), branchId: randomUUID() }),
      error => errorCode === 'synthetic-unknown' ? error.code !== 'BILLING_UNAVAILABLE' : error.code === 'BILLING_UNAVAILABLE');
  }
});
test('BP-A01/06/11 source composition exports supported providers and stays isolated from startup', async () => {
  const { readFile } = await import('node:fs/promises');
  const { BillingModule } = await import('../dist/billing-check/modules/billing/billing.module.js');
  const { OrdersModule, OrderFinancialService } = await import('../dist/billing-check/modules/orders/public.js');
  const { BusinessModule, DisplaySettingsService } = await import('../dist/billing-check/modules/business/public.js');
  const { BusinessDisplayHttpModule } = await import('../dist/billing-check/modules/business/http/business-display-http.module.js');
  assert.ok(Reflect.getMetadata('imports', BillingModule).includes(OrdersModule));
  assert.ok(Reflect.getMetadata('imports', BillingModule).includes(BusinessDisplayHttpModule));
  assert.ok(Reflect.getMetadata('exports', OrdersModule).includes(OrderFinancialService));
  assert.ok(Reflect.getMetadata('exports', BusinessModule).includes(DisplaySettingsService));
  const startup = await readFile(new URL('../src/app.module.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(startup, /BillingModule|BusinessDisplayHttpModule/);
  const migration = await readFile(new URL('../migrations/0006_billing_cash.sql', import.meta.url), 'utf8');
  assert.match(migration, /UNIQUE\("business_id","branch_id","order_id"\)/);
  assert.match(migration, /UNIQUE\("business_id","branch_id","retry_key"\)/);
  assert.doesNotMatch(migration, /INSERT INTO|DELETE FROM|DROP TABLE/i);
});
