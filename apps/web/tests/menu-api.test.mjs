import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadMenu, saveMenu, MenuRequestError } from '../src/features/menu/menu-api.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const item = {
  id: 'item', name: 'Fries', active: true, revision: 1, currencyCode: 'PKR', scale: 2,
  kind: 'item', sized: false, variants: [{ id: 'variant', name: 'Standard', price: '180.00', active: true }],
  addOnGroups: [],
};

test('loads definitions, active envelope and bound currency', async () => {
  globalThis.fetch = async url => {
    if (url.endsWith('/menu/definitions')) return Response.json([item]);
    if (url.endsWith('/menu/offerings')) return Response.json({ data: [item], meta: { requestId: 'test' } });
    return Response.json({ business: { currencyCode: 'PKR' } });
  };
  assert.deepEqual(await loadMenu(), { definitions: [item], active: [item], currency: 'PKR' });
});

test('edit sends a single complete definition with revision and fresh CSRF', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? Response.json({ csrfToken: 'proof' }) : Response.json({});
  };
  const definition = { kind: 'item', name: 'Fries', active: true, sized: false, variants: [], addOnGroups: [] };
  await saveMenu(definition, { id: 'saved', revision: 3 });
  assert.equal(calls[1].url, '/api/v1/menu/offerings/saved');
  assert.equal(calls[1].options.method, 'PUT');
  assert.equal(calls[1].options.headers['X-CSRF-Token'], 'proof');
  assert.deepEqual(JSON.parse(calls[1].options.body), { definition, expectedRevision: 3 });
});

test('save does not retry an uncertain request or hide rejection', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1 ? Response.json({ csrfToken: 'proof' }) : new Response(null, { status: 409 });
  };
  await assert.rejects(saveMenu({ kind: 'item' }), error => error instanceof MenuRequestError && error.status === 409);
  assert.equal(calls, 2);
});

test('rejects saved offerings missing nested identities before rendering', async () => {
  const malformed = { ...item, variants: [{ name: 'Standard', price: '180.00', active: true }] };
  globalThis.fetch = async url => {
    if (url.endsWith('/menu/definitions')) return Response.json([malformed]);
    if (url.endsWith('/menu/offerings')) return Response.json({ data: [item] });
    return Response.json({ business: { currencyCode: 'PKR' } });
  };
  await assert.rejects(loadMenu(), /Unexpected menu response/);
});
