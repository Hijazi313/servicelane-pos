import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, NestFactory, Reflector } from '@nestjs/core';
import { createHttpAdapter } from '../dist/cashier-check/infrastructure/http/http-adapter.js';
import { HttpContractGuard } from '../dist/cashier-check/infrastructure/http/http-contract.guard.js';
import { HttpResponseInterceptor } from '../dist/cashier-check/infrastructure/http/http-response.interceptor.js';
import { AccessExceptionFilter } from '../dist/cashier-check/modules/authentication/http/access-exception.filter.js';
import { AccessBoundaryGuard } from '../dist/cashier-check/modules/authentication/http/access-boundary.guard.js';
import { AccessHttpConfiguration } from '../dist/cashier-check/modules/authentication/http/configuration.js';
import { AccessService } from '../dist/cashier-check/modules/authentication/public.js';
import { AccessError } from '../dist/cashier-check/modules/authentication/application/access-policy.js';
import { DrawerController } from '../dist/cashier-check/modules/cashier-shifts/http/drawer.controller.js';
import { DrawerService } from '../dist/cashier-check/modules/cashier-shifts/application/drawer.service.js';
import { DrawerError } from '../dist/cashier-check/modules/cashier-shifts/domain/drawer-session.js';

const id = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
async function harness() {
  const calls = [];
  const result = { id, drawerId: second, status: 'open', openingMinor: '0' };
  let failure;
  let role = 'administrator';
  const access = { authorize: async (_proof, admin) => {
    if (admin && role !== 'administrator') throw new AccessError('FORBIDDEN', 'Access denied');
  } };
  const service = {};
  for (const name of ['createDrawer', 'listDrawers', 'open', 'current', 'get', 'move', 'beginHandover', 'acceptHandover', 'cancelHandover', 'close', 'getPolicy', 'replacePolicy']) {
    service[name] = async (...args) => { calls.push([name, ...args]); if (failure) throw failure; return result; };
  }
  class TestModule {}
  Module({ controllers: [DrawerController], providers: [
    { provide: DrawerService, useValue: service }, { provide: APP_GUARD, useClass: HttpContractGuard },
    { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor }, { provide: APP_FILTER, useClass: AccessExceptionFilter },
    { provide: AccessService, useValue: access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useFactory: (reflector, config, accessService) => new AccessBoundaryGuard(reflector, config, accessService),
      inject: [Reflector, AccessHttpConfiguration, AccessService] },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: 16_384 }, () => {}), { logger: false, abortOnError: false });
  await app.init(); await app.getHttpAdapter().getInstance().ready();
  const request = (method, path, payload) => app.inject({ method, url: '/api/v1/' + path,
    ...(payload === undefined ? {} : { payload }), headers: { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test' } });
  return { app, calls, request, fail: value => { failure = value; }, role: value => { role = value; } };
}

test('cashier HTTP routes call intended operations and use safe response metadata', async () => {
  const h = await harness();
  try {
    const routes = [
      ['POST', 'cash-drawers', { label: 'Front', retryKey: id }, 'createDrawer', 200],
      ['GET', 'cash-drawers', undefined, 'listDrawers', 200],
      ['POST', `cash-drawers/${id}/sessions`, { openingMinor: '0', retryKey: id }, 'open', 201],
      ['GET', 'cash-drawer-sessions/current', undefined, 'current', 200],
      ['GET', `cash-drawer-sessions/${id}`, undefined, 'get', 200],
      ['POST', `cash-drawer-sessions/${id}/movements`, { direction: 'out', amountMinor: '100', reason: 'Safe', expectedRevision: 0, retryKey: id }, 'move', 200],
      ['POST', `cash-drawer-sessions/${id}/handovers`, { recipientStaffId: second, expectedRevision: 0, retryKey: id }, 'beginHandover', 200],
      ['POST', `cash-drawer-sessions/${id}/handovers/${second}/accept`, { countedMinor: '0', varianceReason: null, expectedRevision: 0, retryKey: id }, 'acceptHandover', 200],
      ['POST', `cash-drawer-sessions/${id}/handovers/${second}/cancel`, { expectedRevision: 0, retryKey: id }, 'cancelHandover', 200],
      ['POST', `cash-drawer-sessions/${id}/close`, { countedMinor: '0', varianceReason: null, expectedRevision: 0, retryKey: id }, 'close', 200],
      ['GET', 'cash-drawer-policy', undefined, 'getPolicy', 200],
      ['PUT', 'cash-drawer-policy', { selfClose: true, replacementClose: false, replacementStaffIds: [], expectedRevision: 0, note: 'Initial' }, 'replacePolicy', 200],
    ];
    for (const [method, path, body, name, status] of routes) {
      const response = await h.request(method, path, body);
      assert.equal(response.statusCode, status, response.body);
      assert.equal(h.calls.at(-1)[0], name);
      assert.equal(response.json().meta.requestId, response.headers['x-request-id']);
      assert.equal(response.headers['cache-control'], 'no-store');
      if (name === 'open') assert.equal(response.headers.location, `/api/v1/cash-drawer-sessions/${id}`);
    }
  } finally { await h.app.close(); }
});

test('cashier HTTP validates body, query and paths without exposing input', async () => {
  const h = await harness();
  try {
    for (const [method, path, body] of [
      ['POST', 'cash-drawers', { label: 'SyntheticPrivate', retryKey: id, actorId: id }],
      ['POST', `cash-drawers/${id}/sessions`, { openingMinor: '1.00', retryKey: id }],
      ['POST', `cash-drawer-sessions/${id}/close`, { countedMinor: '0', expectedRevision: '0', retryKey: id, varianceReason: null }],
      ['GET', 'cash-drawer-policy?extra=1'], ['GET', 'cash-drawer-sessions/invalid'],
    ]) {
      const response = await h.request(method, path, body);
      assert.equal(response.statusCode, 400, response.body);
      assert.equal(response.json().code, 'VALIDATION_FAILED');
      assert.doesNotMatch(response.body, /SyntheticPrivate/);
    }
    assert.equal(h.calls.length, 0);
    h.role('staff');
    const denied = await h.request('POST', 'cash-drawers', { label: 'Front', retryKey: id });
    assert.equal(denied.statusCode, 403); assert.equal(h.calls.length, 0);
    h.fail(new DrawerError('DRAWER_NOT_FOUND'));
    const response = await h.request('GET', `cash-drawer-sessions/${id}`);
    assert.equal(response.statusCode, 404); assert.equal(response.json().code, 'DRAWER_NOT_FOUND');
  } finally { await h.app.close(); }
});
