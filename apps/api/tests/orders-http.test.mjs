import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { NestFactory, Reflector, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { OrdersController } from '../dist/orders-check/modules/orders/http/orders.controller.js';
import { OrdersService } from '../dist/orders-check/modules/orders/application/orders.service.js';
import { AccessService } from '../dist/orders-check/modules/authentication/public.js';
import { AccessBoundaryGuard } from '../dist/orders-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../dist/orders-check/modules/authentication/http/access-exception.filter.js';
import { AccessHttpConfiguration } from '../dist/orders-check/modules/authentication/http/configuration.js';
import { fixture } from './orders-fixture.mjs';
async function harness() {
  const h = fixture(); class TestModule {}
  Module({ controllers: [OrdersController], providers: [
    { provide: OrdersService, useValue: h.service }, { provide: AccessService, useValue: h.access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useFactory: (reflector, config, service) => new AccessBoundaryGuard(reflector, config, service), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, new FastifyAdapter({ trustProxy: ['127.0.0.1'], bodyLimit: 16_384 }), { logger: false, abortOnError: false });
  await app.init(); await app.getHttpAdapter().getInstance().ready();
  const request = (method, path, payload, overrides = {}) => app.inject({ method, url: '/api/v1/orders' + path, ...(payload === undefined ? {} : { payload }), headers: {
    host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: `__Host-session=${h.sessionToken}`, 'x-csrf-token': h.csrf, ...overrides,
  } });
  return { ...h, app, request };
}

test('actual HTTP capture/read, reconfirmation details, safe errors and existing access boundary', async () => {
  const h = await harness();
  try {
    h.state().account.role = 'staff'; const body = h.body();
    const created = await h.request('POST', '', body); assert.equal(created.statusCode, 201);
    assert.equal(created.headers['cache-control'], 'no-store'); const saved = created.json();
    assert.deepEqual((await h.request('GET', '/' + saved.id)).json(), saved);
    const wrong = h.body(); wrong.lines[0].expectedUnitMinor = '0';
    const conflict = await h.request('POST', '', wrong); assert.equal(conflict.statusCode, 409);
    assert.equal(conflict.json().code, 'PRICE_CONFIRMATION_REQUIRED'); assert.equal(conflict.json().details.lines[0].unitMinor, '1234');
    assert.equal((await h.request('PUT', '/capture-policy', { maxLines: 1, maxQuantity: 1, expectedRevision: 0 })).statusCode, 403);
    assert.equal((await h.request('POST', '', body, { 'x-csrf-token': 'wrong' })).statusCode, 403);
    assert.equal((await h.request('POST', '', body, { origin: 'https://foreign.test' })).statusCode, 403);
    assert.equal((await h.request('GET', '/' + randomUUID())).statusCode, 404);
    assert.equal((await h.request('GET', '/capture-policy')).json().maxLines, 50);
    h.state().account.role = 'administrator';
    const policy = await h.request('PUT', '/capture-policy', { maxLines: 500, maxQuantity: 1000, expectedRevision: 0 }); assert.equal(policy.statusCode, 200);
    assert.equal((await h.request('PUT', '/capture-policy', { maxLines: 1, maxQuantity: 1, expectedRevision: 0 })).json().code, 'STALE_ORDER_POLICY');
    const privateBody = h.body({ customer: { name: 'SyntheticPrivateGuest' }, instructions: 'SyntheticPrivateInstruction' });
    h.failSave(); const failed = await h.request('POST', '', privateBody); assert.equal(failed.statusCode, 503);
    assert.doesNotMatch(failed.body, /SyntheticPrivate|driver|SQL/); assert.equal(h.state().orders.length, 1);
  } finally { await h.app.close(); }
});

test('HTTP denies revoked/disabled/grantless callers; Menu errors and actual input boundary stay safe', async () => {
  const h = await harness();
  try {
    h.state().session.revokedAt = new Date(); assert.equal((await h.request('POST', '', h.body())).statusCode, 401);
    h.state().session.revokedAt = null; h.state().account.status = 'disabled'; assert.equal((await h.request('POST', '', h.body())).statusCode, 401);
    h.state().account.status = 'active'; h.state().account.branchIds = []; assert.equal((await h.request('POST', '', h.body())).statusCode, 403);
    h.state().account.branchIds = [h.installation.branchId];
    const missing = h.body(); missing.lines[0].selection.offeringId = randomUUID(); assert.equal((await h.request('POST', '', missing)).statusCode, 404);
    h.state().catalogue[0].active = false; assert.equal((await h.request('POST', '', h.body())).json().code, 'MENU_SELECTION_CONFLICT');
    assert.equal((await h.request('POST', '', { instructions: 'x'.repeat(16_384) })).statusCode, 413);
    assert.equal(h.state().orders.length, 0);
  } finally { await h.app.close(); }
});

test('Orders filter preserves Menu and Orders error contracts without domain HTTP statuses', async () => {
  const { MenuError } = await import('../dist/orders-check/modules/menu/public.js');
  const { OrdersError } = await import('../dist/orders-check/modules/orders/domain/capture.js');
  const h = await harness();
  try {
    for (const [reason, status, code] of [ ['INVALID_INPUT', 400, 'INVALID_MENU_SELECTION'], ['NOT_FOUND', 404, 'MENU_OFFERING_NOT_FOUND'], ['SELECTION_UNAVAILABLE', 409, 'MENU_SELECTION_CONFLICT'], ['UNSUPPORTED_CURRENCY', 503, 'MENU_UNAVAILABLE'] ]) {
      h.menu.resolve = async () => { throw new MenuError(reason, 'SyntheticPrivateFailure'); };
      const response = await h.request('POST', '', h.body());
      assert.deepEqual(response.json(), { statusCode: status, code }); assert.equal(response.statusCode, status);
    }
    for (const [code, status] of [ ['INVALID_ORDER_INPUT', 400], ['INVALID_RETRY_KEY', 400], ['INVALID_CURRENCY', 400], ['INVALID_LINES', 400], ['ORDER_LIMIT_EXCEEDED', 400], ['ORDER_NOT_FOUND', 404], ['ORDER_AMOUNT_CAPACITY', 409], ['RETRY_CONTENT_CONFLICT', 409], ['PRICE_CONFIRMATION_REQUIRED', 409], ['ORDER_RESPONSE_CAPACITY', 409], ['STALE_ORDER_POLICY', 409], ['MENU_RESULT_UNAVAILABLE', 503], ['INSTALLATION_UNAVAILABLE', 503] ]) {
      h.menu.resolve = async () => { throw new OrdersError(code); };
      const response = await h.request('POST', '', h.body());
      assert.deepEqual(response.json(), { statusCode: status, code }); assert.equal(response.statusCode, status);
    }
    assert.equal(h.state().orders.length, 0);
  } finally { await h.app.close(); }
});
