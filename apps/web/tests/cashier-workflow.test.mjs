import { test } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../src/app/query-client.ts';
import { useCashier } from '../src/features/cashier/use-cashier.ts';

test('an uncertain save keeps the exact retry identity and draft until replay succeeds', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  const priorWindow = globalThis.window, priorDocument = globalThis.document, priorFetch = globalThis.fetch;
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/menu/offerings')) return Response.json({ data: [] });
    if (url.endsWith('/orders/capture-policy')) return Response.json({ maxLines: 50, maxQuantity: 100, revision: 0 });
    if (url.endsWith('/auth/csrf')) return Response.json({ csrfToken: 'synthetic' });
    if (url.endsWith('/orders') && options?.method === 'POST') {
      requests.push(JSON.parse(options.body));
      if (requests.length === 1) throw new Error('connection lost');
      return Response.json({ data: { id: 'saved', createdAt: '2026-01-01T00:00:00Z', state: 'captured', fulfillment: 'takeaway', currencyCode: 'PKR', scale: 2, totalMinor: '100', lines: [{ quantity: 1, lineMinor: '100', unit: { name: 'Item', unitMinor: '100', components: [], addOns: [], choices: [] } }] } });
    }
    throw new Error('Unexpected request');
  };
  const client = createQueryClient();
  let current;
  function Probe() { current = useCashier(); return null; }
  const root = createRoot(document.createElement('div'));
  async function waitFor(predicate) {
    for (let i = 0; i < 80 && !predicate(); i++) await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
    assert.ok(predicate(), 'expected state did not arrive');
  }
  try {
    await act(async () => root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Probe))));
    await waitFor(() => current?.policy.data);
    await act(async () => current.addLine({ offeringId: 'item' }, { offeringId: 'item', name: 'Item', currencyCode: 'PKR', scale: 2, unitMinor: '100', components: [], addOns: [], choices: [] }));
    await act(async () => current.submit());
    await waitFor(() => current.message.includes('may have completed'));
    assert.equal(current.lines.length, 1);
    assert.equal(current.pendingRequest.retryKey, requests[0].retryKey);
    await act(async () => current.retrySave());
    await waitFor(() => current.saved?.id === 'saved');
    assert.deepEqual(requests[1], requests[0]);
    assert.equal(current.lines.length, 0);
    assert.equal(current.pendingRequest, undefined);
  } finally {
    await act(async () => root.unmount()); client.clear(); dom.window.close();
    globalThis.window = priorWindow; globalThis.document = priorDocument; globalThis.fetch = priorFetch;
  }
});
