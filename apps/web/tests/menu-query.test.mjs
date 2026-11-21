import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { createQueryClient } from '../src/app/query-client.ts';
import { useMenu } from '../src/features/menu/use-menu.ts';

const originalFetch = globalThis.fetch;
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { globalThis.fetch = originalFetch; onlineManager.setOnline(true); });

async function setup(fetcher) {
  globalThis.fetch = fetcher;
  const client = createQueryClient();
  let current;
  function Probe() { current = useMenu(); return null; }
  const container = document.createElement('div');
  const root = createRoot(container);
  const render = show => root.render(React.createElement(QueryClientProvider, { client }, show ? React.createElement(Probe) : null));
  await act(async () => { render(true); });
  async function waitFor(predicate) {
    for (let i = 0; i < 40 && !predicate(); i++) await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
    assert.ok(predicate(), 'expected state did not arrive');
  }
  return { client, get current() { return current; }, waitFor,
    async show(visible) { await act(async () => render(visible)); },
    async close() { await act(async () => root.unmount()); client.clear(); } };
}

const emptyMenu = url => url.endsWith('/definitions') ? Response.json([])
  : url.endsWith('/offerings') ? Response.json({ data: [] })
    : Response.json({ business: { currencyCode: 'PKR' } });

test('reads on LAN when browser reports offline and clears cache', async () => {
  onlineManager.setOnline(false);
  const view = await setup(async url => emptyMenu(url));
  await view.waitFor(() => view.current.currency === 'PKR');
  assert.ok(view.client.getQueryData(['menu']));
  view.client.clear();
  assert.equal(view.client.getQueryData(['menu']), undefined);
  await view.close();
});

test('returning to Menu shows cached data while the server refreshes', async () => {
  let hold = false;
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const view = await setup(async url => { if (hold) await pending; return emptyMenu(url); });
  await view.waitFor(() => view.current.currency === 'PKR');
  await view.show(false);
  hold = true;
  await view.show(true);
  await view.waitFor(() => view.current.refreshing);
  assert.equal(view.current.currency, 'PKR');
  assert.equal(view.current.loading, false);
  await act(async () => { release(); });
  await view.waitFor(() => !view.current.refreshing);
  await view.close();
});

test('failed read is an error rather than an empty menu and is not retried', async () => {
  let calls = 0;
  const view = await setup(async () => { calls++; return new Response(null, { status: 403 }); });
  await view.waitFor(() => Boolean(view.current.error));
  assert.match(view.current.error, /permission/);
  assert.equal(calls, 3);
  await view.close();
});

test('unknown save is not replayed and successful save retains identity when readback fails', async () => {
  let writeCount = 0;
  let mode = 'unknown';
  const view = await setup(async (url, options) => {
    if (url.endsWith('/csrf')) return Response.json({ csrfToken: 'proof' });
    if (options?.method === 'POST') {
      writeCount++;
      if (mode === 'unknown') throw new Error('connection lost');
      return Response.json({ id: 'saved-id' });
    }
    if (mode === 'read-fails') throw new Error('read failed');
    return emptyMenu(url);
  });
  await view.waitFor(() => view.current.currency === 'PKR');
  await act(async () => { view.current.startEditing(); });
  await act(async () => { await view.current.save({ kind: 'item' }); });
  assert.equal(writeCount, 1);
  assert.equal(view.current.uncertain, true);
  assert.equal(view.current.open, true);
  await act(async () => { view.current.acknowledgeReview(); });
  mode = 'read-fails';
  await act(async () => { await view.current.save({ kind: 'item' }); });
  assert.equal(writeCount, 2);
  assert.equal(view.current.savedId, 'saved-id');
  assert.match(view.current.error, /could not be loaded/);
  assert.equal(view.current.open, false);
  await view.close();
});

test('conflicting edits retain the draft and reload the current revision', async () => {
  const item = { id: 'item', name: 'Sample', active: true, revision: 2, currencyCode: 'PKR', scale: 2,
    kind: 'item', sized: false, variants: [{ id: 'variant', name: 'Standard', price: '10', active: true }], addOnGroups: [] };
  let writes = 0;
  const view = await setup(async (url, options) => {
    if (url.endsWith('/csrf')) return Response.json({ csrfToken: 'proof' });
    if (options?.method === 'PUT') { writes++; return new Response(null, { status: 409 }); }
    if (url.endsWith('/definitions')) return Response.json([item]);
    if (url.endsWith('/offerings')) return Response.json({ data: [item] });
    return Response.json({ business: { currencyCode: 'PKR' } });
  });
  await view.waitFor(() => view.current.definitions.length === 1);
  await act(async () => { view.current.startEditing({ ...item, revision: 1 }); });
  await act(async () => { await view.current.save({ kind: 'item' }); });
  assert.equal(writes, 1);
  assert.equal(view.current.conflict, true);
  assert.equal(view.current.open, true);
  await act(async () => { await view.current.reloadWhileEditing(); });
  assert.equal(view.current.latest.revision, 2);
  await view.close();
});
