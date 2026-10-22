import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { NestFactory, Reflector, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { KitchenController } from '../dist/orders-check/modules/kitchen/http/kitchen.controller.js';
import { KitchenService } from '../dist/orders-check/modules/kitchen/application/kitchen.service.js';
import { AccessService } from '../dist/orders-check/modules/authentication/public.js';
import { AccessBoundaryGuard } from '../dist/orders-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../dist/orders-check/modules/authentication/http/access-exception.filter.js';
import { AccessHttpConfiguration } from '../dist/orders-check/modules/authentication/http/configuration.js';
import { fixture } from './kitchen-fixture.mjs';
async function harness() {
  const h = fixture(); class TestModule {}
  Module({ controllers: [KitchenController], providers: [
    { provide: KitchenService, useValue: h.kitchen }, { provide: AccessService, useValue: h.access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useFactory: (reflector, config, access) => new AccessBoundaryGuard(reflector, config, access), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, new FastifyAdapter({ trustProxy: ['127.0.0.1'], bodyLimit: 16_384 }), { logger: false, abortOnError: false });
  await app.init(); await app.getHttpAdapter().getInstance().ready();
  const request = (method, path = '', payload, overrides = {}) => app.inject({ method, url: '/api/v1/kitchen/tickets' + path, ...(payload === undefined ? {} : { payload }), headers: {
    host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: `__Host-session=${h.sessionToken}`, 'x-csrf-token': h.csrf, ...overrides,
  } });
  return { ...h, app, request };
}
test('Kitchen HTTP dispatch/read/summary/state, access boundary and safe conflicts', async () => {
  const h = await harness();
  try {
    h.state().account.role = 'staff';
    const order = await h.service.create(h.proof, h.body({ customer: { name: 'SyntheticPrivateGuest' }, instructions: 'Pack separately' }));
    const response = await h.request('POST', '', { orderId: order.id }); assert.equal(response.statusCode, 201); assert.equal(response.headers['cache-control'], 'no-store');
    const ticket = response.json(); assert.doesNotMatch(response.body, /SyntheticPrivateGuest|surcharge|totalMinor|dispatchedBy/);
    assert.deepEqual((await h.request('GET', '/' + ticket.id)).json(), ticket);
    assert.equal((await h.request('GET', '?limit=1')).json().tickets[0].id, ticket.id);
    assert.equal((await h.request('PUT', '/' + ticket.id + '/state', { state: 'ready', expectedRevision: 0 })).statusCode, 409);
    assert.equal((await h.request('PUT', '/' + ticket.id + '/state', { state: 'preparing', expectedRevision: 0 })).json().revision, 1);
    assert.equal((await h.request('PUT', '/' + ticket.id + '/state', { state: 'ready', expectedRevision: 1 })).json().revision, 2);
    const conflict = await h.request('PUT', '/' + ticket.id + '/state', { state: 'preparing', expectedRevision: 0 });
    assert.deepEqual(conflict.json().current, { state: 'ready', revision: 2 }); assert.equal('status' in (await import('../dist/orders-check/modules/kitchen/domain/preparation.js')).KitchenError.prototype, false);
    assert.equal((await h.request('POST', '', { orderId: order.id }, { 'x-csrf-token': 'wrong' })).statusCode, 403);
    assert.equal((await h.request('POST', '', { orderId: order.id }, { origin: 'https://foreign.test' })).statusCode, 403);
    assert.equal((await h.request('POST', '', { orderId: order.id, actorId: randomUUID() })).statusCode, 400);
    assert.equal((await h.request('GET', '?limit=1&limit=2')).statusCode, 400);
    assert.equal((await h.request('POST', '', { orderId: randomUUID() })).statusCode, 404);
    assert.equal((await h.request('GET', '/' + randomUUID())).statusCode, 404);
    assert.equal((await h.request('POST', '', { instructions: 'x'.repeat(16_384) })).statusCode, 413);
    assert.equal((await h.request('DELETE', '/' + ticket.id)).statusCode, 404);
  } finally { await h.app.close(); }
});
test('Kitchen HTTP denies revoked/disabled/grantless calls and hides persistence failures', async () => {
  const h = await harness();
  try {
    const order = await h.capture();
    h.failInsert(); const failure = await h.request('POST', '', { orderId: order.id });
    assert.equal(failure.statusCode, 503); assert.doesNotMatch(failure.body, /SyntheticPrivate|SQL/); assert.equal(h.records().length, 0);
    h.state().session.revokedAt = new Date(); assert.equal((await h.request('POST', '', { orderId: order.id })).statusCode, 401);
    h.state().session.revokedAt = null; h.state().account.status = 'disabled'; assert.equal((await h.request('GET')).statusCode, 401);
    h.state().account.status = 'active'; h.state().account.branchIds = []; assert.equal((await h.request('GET')).statusCode, 403);
  } finally { await h.app.close(); }
});
