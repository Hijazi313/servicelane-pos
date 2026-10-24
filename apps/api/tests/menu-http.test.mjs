import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { NestFactory, Reflector, APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { createHttpAdapter } from '../dist/menu-check/infrastructure/http/http-adapter.js';
import { HttpContractGuard } from '../dist/menu-check/infrastructure/http/http-contract.guard.js';
import { HttpResponseInterceptor } from '../dist/menu-check/infrastructure/http/http-response.interceptor.js';
import { MenuController } from '../dist/menu-check/modules/menu/http/menu.controller.js';
import { MenuService } from '../dist/menu-check/modules/menu/application/menu.service.js';
import { AccessService } from '../dist/menu-check/modules/authentication/public.js';
import { AccessBoundaryGuard } from '../dist/menu-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../dist/menu-check/modules/authentication/http/access-exception.filter.js';
import { AccessHttpConfiguration } from '../dist/menu-check/modules/authentication/http/configuration.js';
import { REQUEST_BODY_LIMIT_BYTES } from '../dist/menu-check/infrastructure/request-limits.js';
import { token, digest } from '../dist/menu-check/modules/authentication/application/access-policy.js';

async function harness() {
  const installation = { businessId: randomUUID(), branchId: randomUUID(), business: { name: 'Synthetic', currencyCode: 'PKR', timezone: 'Asia/Karachi' }, branch: { name: 'Synthetic' } };
  const sessionToken = token(), csrf = token(), now = new Date();
  let state = { catalogue: [], account: { id: randomUUID(), businessId: installation.businessId, branchIds: [installation.branchId], role: 'administrator', status: 'active', passwordChangeRequired: false }, session: { digest: digest(sessionToken), businessId: installation.businessId, createdAt: now, lastActivityAt: now, revokedAt: null, csrfToken: csrf } };
  state.session.accountId = state.account.id;
  let queue = Promise.resolve();
  const store = { run(work) {
    const result = queue.then(async () => {
      const before = structuredClone(state);
      try { return await work({ context: { id: Symbol() }, getSession: async key => key === state.session.digest ? structuredClone(state.session) : undefined, findAccount: async business => business === installation.businessId ? structuredClone(state.account) : undefined, saveSession: async session => { state.session = structuredClone(session); } }); }
      catch (error) { state = before; throw error; }
    }); queue = result.catch(() => {}); return result;
  } };
  const business = { resolveInstallationContext: async () => installation, validateBranchOwnership: async () => {} };
  const access = new AccessService(store, business, {});
  const menuStore = { read: async business => business === installation.businessId ? structuredClone(state.catalogue) : [], save: async (business, offering) => {
    assert.equal(business, installation.businessId);
    state.catalogue = [...state.catalogue.filter(row => row.id !== offering.id), structuredClone(offering)];
  } };
  const menu = new MenuService(menuStore);
  class TestModule {}
  Module({ controllers: [MenuController], providers: [
    { provide: MenuService, useValue: menu }, { provide: AccessService, useValue: access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useClass: HttpContractGuard }, { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_GUARD, useFactory: (reflector, config, service) => new AccessBoundaryGuard(reflector, config, service), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: REQUEST_BODY_LIMIT_BYTES }, () => {}), { logger: false, abortOnError: false });
  await app.init(); await app.getHttpAdapter().getInstance().ready();
  const request = (method, path, payload, overrides = {}) => app.inject({ method, url: '/api/v1/menu' + path, ...(payload === undefined ? {} : { payload }), headers: { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: `__Host-session=${sessionToken}`, 'x-csrf-token': csrf, ...overrides } });
  return { app, request, state: () => state, installation };
}
const definition = { kind: 'item', name: 'Burger', active: true, sized: false, variants: [{ name: 'Default', price: '450', active: true }], addOnGroups: [] };
const editable = row => { const { id, revision, currencyCode, scale, ...definition } = row; return definition; };

test('actual Menu HTTP uses MN-00: admin CRUD, staff active reads/resolution, no inactive disclosure', async () => {
  const h = await harness();
  try {
    const created = await h.request('POST', '/offerings', { definition }); assert.equal(created.statusCode, 201);
    const item = created.json(); assert.equal(item.revision, 1);
    assert.equal((await h.request('GET', '/offerings/' + item.id)).statusCode, 200);
    h.state().account.role = 'staff';
    assert.equal((await h.request('POST', '/offerings', { definition })).statusCode, 403);
    assert.equal((await h.request('GET', '/definitions')).statusCode, 403);
    assert.equal((await h.request('GET', '/definitions/' + item.id)).statusCode, 403);
    const resolved = await h.request('POST', '/resolve', { offeringId: item.id });
    assert.equal(resolved.statusCode, 200); assert.equal(resolved.json().total, '450.00');
    h.state().account.role = 'administrator';
    const update = await h.request('PUT', '/offerings/' + item.id, { definition: { ...editable(item), name: 'Edited burger' }, expectedRevision: 1 });
    assert.equal(update.statusCode, 200); assert.equal(update.json().variants[0].id, item.variants[0].id);
    assert.equal((await h.request('PUT', '/offerings/' + item.id, { definition: editable(item), expectedRevision: 1 })).statusCode, 409);
    assert.equal((await h.request('POST', '/offerings/' + item.id + '/deactivate', { expectedRevision: 2 })).statusCode, 200);
    h.state().account.role = 'staff';
    assert.deepEqual((await h.request('GET', '/offerings')).json().data, []);
    assert.equal((await h.request('GET', '/offerings/' + item.id)).statusCode, 404);
    assert.equal((await h.request('POST', '/resolve', { offeringId: item.id })).statusCode, 409);
    h.state().account.role = 'administrator'; assert.equal((await h.request('GET', '/definitions')).json().length, 1);
  } finally { await h.app.close(); }
});

test('Menu rejects invalid input, foreign identity, bad origin/CSRF and revoked/grant-restricted sessions', async () => {
  const h = await harness();
  try {
    assert.equal((await h.request('POST', '/offerings', { definition }, { 'x-csrf-token': 'bad' })).statusCode, 403);
    assert.equal((await h.request('POST', '/offerings', { definition }, { origin: 'https://foreign.test' })).statusCode, 403);
    assert.equal((await h.request('POST', '/offerings', { definition: { ...definition, businessId: randomUUID() } })).statusCode, 400);
    assert.equal(h.state().catalogue.length, 0);
    assert.equal((await h.request('GET', '/offerings/' + randomUUID())).statusCode, 404);
    h.state().account.branchIds = [];
    assert.equal((await h.request('POST', '/offerings', { definition })).statusCode, 403);
    h.state().account.branchIds = [h.installation.branchId]; h.state().account.passwordChangeRequired = true;
    assert.equal((await h.request('GET', '/offerings')).statusCode, 403);
    h.state().account.passwordChangeRequired = false; h.state().session.revokedAt = new Date();
    const denied = await h.request('POST', '/offerings', { definition });
    assert.equal(denied.statusCode, 401); assert.equal(denied.headers['cache-control'], 'no-store');
    assert.equal(h.state().catalogue.length, 0);
  } finally { await h.app.close(); }
});

function configurableItem(groups, options = 24) {
  return {
    ...structuredClone(definition),
    addOnGroups: Array.from({ length: groups }, (_,group) => ({
      name: `Group ${group}`, maximum: options,
      options: Array.from({ length: options }, (_,option) => ({ name: `Option ${option}`, surcharge: '1', active: true })),
    })),
  };
}
const bytes = payload => Buffer.byteLength(JSON.stringify(payload), 'utf8');

test('editable size: admitted create round-trips; ID expansion rejects create and update atomically', async () => {
  const h = await harness();
  try {
    // This compact create expands beyond the limit once the server assigns IDs.
    const oversized = { definition: configurableItem(8) };
    assert.ok(bytes(oversized) < REQUEST_BODY_LIMIT_BYTES);
    const empty = structuredClone(h.state());
    assert.equal((await h.request('POST', '/offerings', oversized)).statusCode, 400);
    assert.deepEqual(h.state(), empty);

    const created = await h.request('POST', '/offerings', { definition: configurableItem(4) });
    assert.equal(created.statusCode, 201);
    const original = created.json();
    const renamed = { definition: { ...editable(original), name: 'Renamed item' }, expectedRevision: original.revision };
    assert.ok(bytes(renamed) < REQUEST_BODY_LIMIT_BYTES);
    const edited = await h.request('PUT', `/offerings/${original.id}`, renamed);
    assert.equal(edited.statusCode, 200);
    const row = edited.json();
    assert.deepEqual(row.addOnGroups, original.addOnGroups);
    assert.equal(row.variants[0].id, original.variants[0].id);
    assert.equal(row.revision, 2);

    // Existing IDs + compact new options fit the incoming body, but new IDs do not.
    const expanded = editable(row);
    expanded.addOnGroups.push(...configurableItem(8).addOnGroups.slice(4));
    const update = { definition: expanded, expectedRevision: row.revision };
    assert.ok(bytes(update) < REQUEST_BODY_LIMIT_BYTES);
    const before = structuredClone(h.state());
    assert.equal((await h.request('PUT', `/offerings/${row.id}`, update)).statusCode, 400);
    assert.deepEqual(h.state(), before);
  } finally { await h.app.close(); }
});

test('editable size: inclusive UTF-8 boundary reserves revision digits and counts JSON escapes', async () => {
  const h = await harness();
  try {
    const input = configurableItem(8, 12);
    input.name = 'Meal 🍔';
    input.addOnGroups[0].options[0].name = 'Quoted "extra" 🍟';
    const response = await h.request('POST', '/offerings', { definition: input });
    assert.equal(response.statusCode, 201);
    const row = response.json(), edited = editable(row);
    let remaining = REQUEST_BODY_LIMIT_BYTES - bytes({ definition: edited, expectedRevision: 2147483646 });
    assert.ok(remaining > 0);
    for (const group of edited.addOnGroups) for (const option of group.options) {
      const count = Math.min(remaining, 120 - [...option.name].length);
      option.name += 'x'.repeat(count); remaining -= count;
    }
    assert.equal(remaining, 0);
    assert.equal(bytes({ definition: edited, expectedRevision: 2147483646 }), REQUEST_BODY_LIMIT_BYTES);
    const exact = await h.request('PUT', `/offerings/${row.id}`, { definition: edited, expectedRevision: row.revision });
    assert.equal(exact.statusCode, 200);
    const saved = exact.json(), before = structuredClone(h.state());
    const tooLarge = { definition: { ...editable(saved), name: saved.name + 'x' }, expectedRevision: saved.revision };
    // Current small revision still fits transport; the reserved future envelope exceeds by one byte.
    assert.ok(bytes(tooLarge) < REQUEST_BODY_LIMIT_BYTES);
    assert.equal((await h.request('PUT', `/offerings/${row.id}`, tooLarge)).statusCode, 400);
    assert.deepEqual(h.state(), before);
    const unchanged = await h.request('PUT', `/offerings/${row.id}`, { definition: editable(saved), expectedRevision: saved.revision });
    assert.equal(unchanged.statusCode, 200);
    const transportEdit = { definition: editable(unchanged.json()), expectedRevision: unchanged.json().revision };
    const json = JSON.stringify(transportEdit);
    const atLimit = json + ' '.repeat(REQUEST_BODY_LIMIT_BYTES - Buffer.byteLength(json));
    assert.equal((await h.request('PUT', `/offerings/${row.id}`, atLimit, { 'content-type': 'application/json' })).statusCode, 200);
    const afterExact = structuredClone(h.state());
    assert.equal((await h.request('PUT', `/offerings/${row.id}`, atLimit + ' ', { 'content-type': 'application/json' })).statusCode, 413);
    assert.deepEqual(h.state(), afterExact);
  } finally { await h.app.close(); }
});

test('Menu domain reasons map only at HTTP boundary and preserve sanitized responses', async () => {
  const { MenuError } = await import('../dist/menu-check/modules/menu/public.js');
  const h = await harness();
  try {
    const service = h.app.get(MenuService);
    for (const [reason, status] of [ ['INVALID_INPUT', 400], ['DEFINITION_TOO_LARGE', 400], ['NOT_FOUND', 404], ['SELECTION_UNAVAILABLE', 409], ['CURRENCY_CHANGED', 409], ['STALE_REVISION', 409], ['CATALOGUE_CAPACITY', 409], ['UNSUPPORTED_CURRENCY', 503], ['CATALOGUE_UNAVAILABLE', 503] ]) {
      service.list = async () => { throw new MenuError(reason, 'SyntheticPrivateFailure'); };
      const response = await h.request('GET', '/offerings');
      assert.equal(response.statusCode, status); assert.equal(response.json().status, status);
      assert.equal(response.headers['cache-control'], 'no-store'); assert.doesNotMatch(response.body, /SyntheticPrivateFailure|reason/);
    }
  } finally { await h.app.close(); }
});


test('migrated active list uses strict query/envelope/problems while definitions stay legacy', async () => {
  const h = await harness();
  try {
    const empty = await h.request('GET', '/offerings');
    assert.equal(empty.statusCode, 200); assert.deepEqual(empty.json().data, []);
    assert.equal(empty.json().meta.requestId, empty.headers['x-request-id']);
    for (const suffix of ['?limt=50', '?limit=1&limit=2']) {
      const invalid = await h.request('GET', '/offerings' + suffix);
      assert.equal(invalid.statusCode, 400); assert.match(invalid.headers['content-type'], /^application\/problem\+json/);
      assert.match(invalid.json().type, /^\/problems\//);
    }
    assert.ok(Array.isArray((await h.request('GET', '/definitions?ignored=1')).json()));
    const denied = await h.request('GET', '/offerings', undefined, { origin: 'https://foreign.test' });
    assert.equal(denied.statusCode, 403); assert.equal(denied.json().code, 'ACCESS_FORBIDDEN');
    assert.equal(denied.json().meta.requestId, denied.headers['x-request-id']);
    await h.request('POST', '/offerings', { definition });
    h.state().catalogue[0].currencyCode = 'USD';
    const failure = await h.request('GET', '/offerings');
    assert.equal(failure.statusCode, 409); assert.equal(failure.json().type, '/problems/menu-currency-changed');
    assert.doesNotMatch(failure.body, /SQL|stack/);
  } finally { await h.app.close(); }
});
