import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { NestFactory, Reflector, APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { createHttpAdapter } from '../dist/orders-check/infrastructure/http/http-adapter.js';
import { HttpContractGuard } from '../dist/orders-check/infrastructure/http/http-contract.guard.js';
import { HttpResponseInterceptor } from '../dist/orders-check/infrastructure/http/http-response.interceptor.js';
import { KitchenController } from '../dist/orders-check/modules/kitchen/http/kitchen.controller.js';
import { KitchenService } from '../dist/orders-check/modules/kitchen/application/kitchen.service.js';
import { AccessService } from '../dist/orders-check/modules/authentication/public.js';
import { AccessBoundaryGuard } from '../dist/orders-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../dist/orders-check/modules/authentication/http/access-exception.filter.js';
import { AccessHttpConfiguration } from '../dist/orders-check/modules/authentication/http/configuration.js';
import { fixture } from './kitchen-fixture.mjs';
function assertProblem(response, status, code) {
  const body = response.json();
  assert.equal(response.statusCode, status); assert.equal(body.status, status); assert.equal(body.code, code);
  assert.equal(body.type, '/problems/' + code.toLowerCase().replaceAll('_', '-'));
  assert.match(response.headers['content-type'], /^application\/problem\+json/);
  assert.equal(body.meta.requestId, response.headers['x-request-id']);
  assert.equal(response.headers['cache-control'], 'no-store');
  return body;
}
async function harness() {
  const h = fixture(); class TestModule {}
  Module({ controllers: [KitchenController], providers: [
    { provide: KitchenService, useValue: h.kitchen }, { provide: AccessService, useValue: h.access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useClass: HttpContractGuard }, { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_GUARD, useFactory: (reflector, config, access) => new AccessBoundaryGuard(reflector, config, access), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: 16_384 }, () => {}), { logger: false, abortOnError: false });
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
    const ticket = response.json().data; assert.equal(response.headers.location, `/api/v1/kitchen/tickets/${ticket.id}`);
    assert.equal(response.json().meta.requestId, response.headers['x-request-id']); assert.doesNotMatch(response.body, /SyntheticPrivateGuest|surcharge|totalMinor|dispatchedBy/);
    assert.deepEqual((await h.request('GET', '/' + ticket.id)).json().data, ticket);
    assert.equal((await h.request('GET', '?limit=1')).json().data[0].id, ticket.id);
    assert.equal((await h.request('PUT', '/' + ticket.id + '/state', { state: 'ready', expectedRevision: 0 })).statusCode, 409);
    assert.equal((await h.request('PUT', '/' + ticket.id + '/state', { state: 'preparing', expectedRevision: 0 })).json().data.revision, 1);
    assert.equal((await h.request('PUT', '/' + ticket.id + '/state', { state: 'ready', expectedRevision: 1 })).json().data.revision, 2);
    const conflict = await h.request('PUT', '/' + ticket.id + '/state', { state: 'preparing', expectedRevision: 0 });
    assert.deepEqual(conflict.json().details, { state: 'ready', revision: 2 }); assert.equal('status' in (await import('../dist/orders-check/modules/kitchen/domain/preparation.js')).KitchenError.prototype, false);
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
    assert.equal(failure.statusCode, 500); assertProblem(failure, 500, 'INTERNAL_ERROR'); assert.doesNotMatch(failure.body, /SyntheticPrivate|SQL/); assert.equal(h.records().length, 0);
    h.state().session.revokedAt = new Date(); assert.equal((await h.request('POST', '', { orderId: order.id })).statusCode, 401);
    h.state().session.revokedAt = null; h.state().account.status = 'disabled'; assert.equal((await h.request('GET')).statusCode, 401);
    h.state().account.status = 'active'; h.state().account.branchIds = []; assert.equal((await h.request('GET')).statusCode, 403);
  } finally { await h.app.close(); }
});

test('Kitchen DTO boundary rejects coercion, extra fields and unknown queries before dispatch', async () => {
  const h = await harness();
  try {
    const order = await h.capture();
    for (const body of [{}, { orderId: null }, { orderId: 1 }, { orderId: 'SyntheticPrivateInvalid' }, { orderId: order.id, actorId: 'SyntheticPrivateActor' }, { orderId: order.id, constructor: {} }]) {
      const response = await h.request('POST', '', body);
      const problem = assertProblem(response, 400, 'VALIDATION_FAILED');
      assert.ok(problem.errors.every(issue => issue.location === 'body' && typeof issue.field === 'string' && typeof issue.code === 'string'));
      assert.doesNotMatch(response.body, /SyntheticPrivate|constraints|target/);
    }
    assert.equal(h.records().length, 0); assert.equal(h.projectionReads(), 0);
    const ticket = (await h.request('POST', '', { orderId: order.id })).json().data;
    for (const body of [{ state: 'preparing', expectedRevision: '0' }, { state: 'ready', expectedRevision: null }, { state: 'queued', expectedRevision: 0 }, { state: 'preparing', expectedRevision: -1 }, { state: 'preparing', expectedRevision: 0, actorId: randomUUID() }]) {
      assertProblem(await h.request('PUT', '/' + ticket.id + '/state', body), 400, 'VALIDATION_FAILED');
    }
    for (const [method, path, body] of [['POST', '?extra=1', { orderId: order.id }], ['GET', '?extra=1'], ['GET', '/' + ticket.id + '?extra=1'], ['PUT', '/' + ticket.id + '/state?extra=1', { state: 'preparing', expectedRevision: 0 }]]) {
      assertProblem(await h.request(method, path, body), 400, 'VALIDATION_FAILED');
    }
    for (const path of ['?limit=0', '?limit=101', '?limit=', '?limit=1&limit=2', '?cursor=1:2']) {
      const response = await h.request('GET', path); assert.equal(response.statusCode, 400); assert.match(response.headers['content-type'], /^application\/problem\+json/);
    }
    const invalidPath = await h.request('GET', '/not-a-uuid'); assert.equal(invalidPath.statusCode, 400); assert.match(invalidPath.headers['content-type'], /^application\/problem\+json/);
    assert.equal(h.records()[0].ticket.revision, 0);
  } finally { await h.app.close(); }
});

test('Kitchen pages use array data and nullable continuation; tampered cursors fail safely', async () => {
  const h = await harness();
  try {
    const empty = await h.request('GET'); assert.deepEqual(empty.json().data, []); assert.equal(empty.json().meta.page.nextCursor, null);
    const tickets = [];
    for (let index = 0; index < 3; index++) {
      const order = await h.capture(); const response = await h.request('POST', '', { orderId: order.id }); tickets.push(response.json().data);
      const replay = await h.request('POST', '', { orderId: order.id }); assert.equal(replay.statusCode, 201); assert.deepEqual(replay.json().data, tickets[index]); assert.equal(replay.headers.location, response.headers.location);
    }
    const first = await h.request('GET', '?limit=2'); const page = first.json();
    assert.deepEqual(page.data.map(row => row.id), tickets.slice(0, 2).map(row => row.id)); assert.equal(page.meta.requestId, first.headers['x-request-id']);
    const cursor = page.meta.page.nextCursor; assert.equal(typeof cursor, 'string'); assert.ok(cursor.length > 0); assert.doesNotMatch(cursor, /^\d+:\d+$/);
    const last = await h.request('GET', '?limit=2&cursor=' + encodeURIComponent(cursor)); assert.deepEqual(last.json().data.map(row => row.id), [tickets[2].id]); assert.equal(last.json().meta.page.nextCursor, null);
    assertProblem(await h.request('GET', '?limit=1&cursor=' + encodeURIComponent(cursor)), 400, 'INVALID_KITCHEN_CURSOR');
    const other = await harness();
    try { assertProblem(await other.request('GET', '?limit=2&cursor=' + encodeURIComponent(cursor)), 400, 'INVALID_KITCHEN_CURSOR'); } finally { await other.app.close(); }
    const tampered = (cursor[0] === 'a' ? 'b' : 'a') + cursor.slice(1);
    const rejected = await h.request('GET', '?limit=2&cursor=' + encodeURIComponent(tampered)); assert.equal(rejected.statusCode, 400); assert.match(rejected.headers['content-type'], /^application\/problem\+json/);
    assert.doesNotMatch(first.body, /preparation|dispatchedBy|totalMinor|surcharge/);
  } finally { await h.app.close(); }
});

test('Kitchen known unavailability and access failures use correlated safe problems', async () => {
  const h = await harness();
  try {
    const { KitchenError } = await import('../dist/orders-check/modules/kitchen/domain/preparation.js');
    h.kitchen.list = async () => { throw new KitchenError('KITCHEN_UNAVAILABLE'); };
    assertProblem(await h.request('GET'), 503, 'KITCHEN_UNAVAILABLE');
    const denied = await h.request('GET', '', undefined, { cookie: '' });
    assert.equal(denied.statusCode, 401); assert.match(denied.headers['content-type'], /^application\/problem\+json/); assert.equal(denied.json().meta.requestId, denied.headers['x-request-id']);
  } finally { await h.app.close(); }
});
