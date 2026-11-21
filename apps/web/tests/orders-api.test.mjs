import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { captureOrder, listOrders, priceConfirmation } from '../src/features/cashier/orders-api.ts';
import { HttpRequestError } from '../src/shared/api/http-client.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('returns validated price conflict details without treating other conflicts as price changes', async () => {
  globalThis.fetch = async url => url.endsWith('/auth/csrf') ? Response.json({ csrfToken: 'proof' }) : Response.json({
    type: '/problems/price-confirmation-required', details: { currencyCode: 'PKR', scale: 2, lines: [{ line: 0, unitMinor: '15000' }] },
  }, { status: 409 });
  await assert.rejects(captureOrder({ retryKey: 'test-key-01234567', currencyCode: 'PKR', scale: 2, lines: [] }), error => {
    assert.deepEqual(priceConfirmation(error), { currencyCode: 'PKR', scale: 2, lines: [{ line: 0, unitMinor: '15000' }] });
    return true;
  });
  assert.equal(priceConfirmation(new HttpRequestError(409, { type: '/problems/retry-content-conflict' })), undefined);
  assert.equal(priceConfirmation(new HttpRequestError(409, { type: '/problems/price-confirmation-required', details: { currencyCode: 'PKR', scale: 2, lines: [{ line: 0, unitMinor: 'bad' }] } })), undefined);
});

test('encodes the opaque cursor and validates page metadata', async () => {
  globalThis.fetch = async url => {
    assert.equal(url, '/api/v1/orders?cursor=a%2Bb%2Fc');
    return Response.json({ data: [], meta: { page: { nextCursor: null } } });
  };
  assert.deepEqual(await listOrders('a+b/c'), { orders: [], nextCursor: null });
  globalThis.fetch = async () => Response.json({ data: [], meta: { page: {} } });
  await assert.rejects(listOrders(), /Unexpected order list response/);
});
