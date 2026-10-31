import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHttp, captureSessionWrites } from './cs02-restart.mjs';

test('fresh-process HTTP check requires exact bill, retry and drawer readback', async () => {
  const input = { proof: {}, bill: { orderId: 'order' }, request: {}, session: { id: 'session' }, legacy: { bill: { orderId: 'legacy' }, request: { legacy: true } } }, calls = [];
  const http = { async request(_proof, method, path, body) {
    calls.push([method, path]);
    const isBill = path.includes('/billing/');
    return { statusCode: method === 'POST' ? 201 : 200,
      headers: { 'cache-control': 'no-store', location: `/api/v1/billing/orders/${body?.legacy ? 'legacy' : 'order'}/bill` },
      json: () => ({ data: isBill ? body?.legacy ? input.legacy.bill : input.bill : input.session }) };
  } };
  await checkHttp(http, input);
  assert.deepEqual(calls, [['GET', '/billing/orders/order/bill'], ['POST', '/billing/bills'], ['GET', '/cash-drawer-sessions/session'], ['POST', '/billing/bills']]);
  await assert.rejects(checkHttp({ request: async () => ({ statusCode: 500 }) }, input));
});

test('child capture retains only touches from committed access transactions', async () => {
  const accessStore = { async run(work) {
    const unit = { async saveSession() {} };
    const value = await work(unit);
    if (value === 'rollback') throw new Error('rollback');
    return value;
  } };
  const captured = captureSessionWrites(accessStore);
  await accessStore.run(async unit => { await unit.saveSession({ digest: 'committed' }); return 'ok'; });
  await assert.rejects(accessStore.run(async unit => { await unit.saveSession({ digest: 'rolled-back' }); return 'rollback'; }));
  assert.deepEqual(captured, [{ type: 'session', value: { digest: 'committed' } }]);
});
