import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { NestFactory, Reflector, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { MenuController } from '../dist/menu-check/modules/menu/http/menu.controller.js';
import { MenuService } from '../dist/menu-check/modules/menu/application/menu.service.js';
import { AccessService } from '../dist/menu-check/modules/authentication/public.js';
import { AccessBoundaryGuard } from '../dist/menu-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../dist/menu-check/modules/authentication/http/access-exception.filter.js';
import { AccessHttpConfiguration } from '../dist/menu-check/modules/authentication/http/configuration.js';
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
    { provide: APP_GUARD, useFactory: (reflector, config, service) => new AccessBoundaryGuard(reflector, config, service), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, new FastifyAdapter({ trustProxy: ['127.0.0.1'], bodyLimit: 16384 }), { logger: false, abortOnError: false });
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
    assert.deepEqual((await h.request('GET', '/offerings')).json(), []);
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
