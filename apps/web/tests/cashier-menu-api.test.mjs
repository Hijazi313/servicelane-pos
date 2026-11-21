import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadCashierMenu, resolveCashierSelection } from '../src/features/cashier/cashier-menu-api.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('loads the staff active catalogue without requesting administrator definitions', async () => {
  const paths = [];
  globalThis.fetch = async url => { paths.push(url); return Response.json({ data: [] }); };
  assert.deepEqual(await loadCashierMenu(), []);
  assert.deepEqual(paths, ['/api/v1/menu/offerings']);
});

test('resolves with one QUERY request and converts the exact server decimal without floating point', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json({
      offeringId: 'item', name: 'Item', currencyCode: 'PKR', scale: 2, total: '1000000000.01',
      components: [], addOns: [], choices: [],
    });
  };
  const selection = { offeringId: 'item', variantId: 'size' };
  const resolved = await resolveCashierSelection(selection);
  assert.equal(resolved.unitMinor, '100000000001');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/v1/menu/resolve');
  assert.equal(calls[0].options.method, 'QUERY');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].options.body), selection);
});

test('rejects a malformed resolution amount', async () => {
  globalThis.fetch = async () => Response.json({
    offeringId: 'item', name: 'Item', currencyCode: 'PKR', scale: 2, total: '1.001',
    components: [], addOns: [], choices: [],
  });
  await assert.rejects(resolveCashierSelection({ offeringId: 'item' }), /Unexpected menu resolution/);
});
