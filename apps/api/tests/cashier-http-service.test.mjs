import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, NestFactory, Reflector } from '@nestjs/core';
import { createHttpAdapter } from '../dist/cashier-check/infrastructure/http/http-adapter.js';
import { HttpContractGuard } from '../dist/cashier-check/infrastructure/http/http-contract.guard.js';
import { HttpResponseInterceptor } from '../dist/cashier-check/infrastructure/http/http-response.interceptor.js';
import { AccessBoundaryGuard } from '../dist/cashier-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../dist/cashier-check/modules/authentication/http/access-exception.filter.js';
import { AccessHttpConfiguration } from '../dist/cashier-check/modules/authentication/http/configuration.js';
import { AccessService } from '../dist/cashier-check/modules/authentication/public.js';
import { DrawerController } from '../dist/cashier-check/modules/cashier-shifts/http/drawer.controller.js';
import { DrawerService } from '../dist/cashier-check/modules/cashier-shifts/application/drawer.service.js';
import { DrawerStore } from '../dist/cashier-check/modules/cashier-shifts/application/drawer-store.js';

const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
async function harness() {
  const installation = { businessId: id(1), branchId: id(2), business: { currencyCode: 'PKR' } };
  let state = { drawers: [], sessions: [], policy: undefined, events: [], retries: [] };
  const access = {
    async authorize() {},
    async runCashierAuthorized(_proof, _required, work) {
      const before = structuredClone(state);
      try { return await work({ actorId: id(3), actorRole: 'administrator', installation, transaction: {}, staffEligible: async () => true }); }
      catch (error) { state = before; throw error; }
    },
    async cashierReadContext() { return { actorId: id(3), actorRole: 'administrator', installation }; },
  };
  const store = {
    async drawers() { return [...state.drawers].sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)); },
    async drawer(_scope, key) { return state.drawers.find(drawer => drawer.id === key); },
    async drawerByLabel(_scope, label) { return state.drawers.find(drawer => drawer.label === label); },
    async insertDrawer(_scope, drawer) { state.drawers.push(drawer); },
    async session(_scope, key) { return state.sessions.find(session => session.id === key); },
    async current(_scope, actor) { return state.sessions.find(session => !session.closed && session.custodianId === actor); },
    async openForDrawer(_scope, key) { return state.sessions.find(session => !session.closed && session.drawerId === key); },
    async insertSession(_scope, session) { state.sessions.push(session); },
    async updateSession(_scope, next, expected) {
      const index = state.sessions.findIndex(session => session.id === next.id && session.revision === expected);
      if (index < 0) return false;
      state.sessions[index] = next; return true;
    },
    async policy() { return state.policy; },
    async replacePolicy(_scope, change) { state.policy = change.next; return true; },
    async appendEvent(_scope, event) { state.events.push(event); },
    async retry(_scope, operation, key) { return state.retries.find(retry => retry.operation === operation && retry.key === key); },
    async saveRetry(_scope, operation, key, data) { state.retries.push({ operation, key, ...structuredClone(data) }); },
  };
  class TestModule {}
  Module({ controllers: [DrawerController], providers: [
    DrawerService, { provide: DrawerStore, useValue: store }, { provide: AccessService, useValue: access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useClass: HttpContractGuard },
    { provide: APP_GUARD, useFactory: (reflector, config, service) => new AccessBoundaryGuard(reflector, config, service),
      inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor }, { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: 16_384 }, () => {}), { logger: false, abortOnError: false });
  await app.init(); await app.getHttpAdapter().getInstance().ready();
  const request = (method, path, payload) => app.inject({ method, url: '/api/v1/' + path,
    ...(payload === undefined ? {} : { payload }), headers: { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test' } });
  return { app, request, state: () => state };
}

test('actual cashier HTTP and service cover policy, discovery, opening, movement, closure and replay', async () => {
  const h = await harness();
  try {
    const call = async (method, path, body, status = 200) => {
      const response = await h.request(method, path, body);
      assert.equal(response.statusCode, status, response.body);
      assert.equal(response.headers['cache-control'], 'no-store');
      return response;
    };
    const policy = { selfClose: true, replacementClose: false, replacementStaffIds: [], expectedRevision: 0, note: 'Synthetic configuration' };
    assert.equal((await call('PUT', 'cash-drawer-policy', policy)).json().data.configured, true);
    const drawer = (await call('POST', 'cash-drawers', { label: 'Front', retryKey: id(10) })).json().data;
    assert.deepEqual((await call('GET', 'cash-drawers')).json().data, [drawer]);
    const opening = { openingMinor: '1000', retryKey: id(11) };
    const opened = await call('POST', `cash-drawers/${drawer.id}/sessions`, opening, 201);
    const session = opened.json().data;
    assert.equal(opened.headers.location, `/api/v1/cash-drawer-sessions/${session.id}`);
    assert.deepEqual((await call('POST', `cash-drawers/${drawer.id}/sessions`, opening, 201)).json().data, session);
    const movement = { direction: 'out', amountMinor: '100', reason: 'Safe drop', expectedRevision: 0, retryKey: id(12) };
    const recorded = (await call('POST', `cash-drawer-sessions/${session.id}/movements`, movement)).json().data;
    assert.deepEqual((await call('POST', `cash-drawer-sessions/${session.id}/movements`, movement)).json().data, recorded);
    const closing = { countedMinor: '800', varianceReason: 'Count difference', expectedRevision: 1, retryKey: id(13) };
    const closed = (await call('POST', `cash-drawer-sessions/${session.id}/close`, closing)).json().data;
    assert.equal(closed.closed.expectedMinor, '900'); assert.equal(closed.closed.varianceMinor, '-100');
    assert.deepEqual((await call('POST', `cash-drawer-sessions/${session.id}/close`, closing)).json().data, closed);
    assert.equal((await call('GET', 'cash-drawer-sessions/current')).json().data, null);
    const conflict = await call('POST', `cash-drawer-sessions/${session.id}/movements`, { ...movement, amountMinor: '101' }, 409);
    assert.equal(conflict.json().code, 'RETRY_CONFLICT');
    assert.equal(h.state().sessions.length, 1);
    assert.equal(h.state().events.filter(event => event.kind === 'movement').length, 1);
    assert.equal(h.state().events.filter(event => event.kind === 'close').length, 1);
  } finally { await h.app.close(); }
});
