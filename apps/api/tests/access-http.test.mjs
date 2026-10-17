import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Module, Controller, Get } from '@nestjs/common';
import { NestFactory, Reflector, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { HealthController } from '../dist/ba02-check/infrastructure/health.controller.js';
import { DatabaseService } from '../dist/ba02-check/infrastructure/database/database.service.js';
import { AccessController } from '../dist/ba02-check/modules/authentication/http/access.controller.js';
import { AccessBoundaryGuard } from '../dist/ba02-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../dist/ba02-check/modules/authentication/http/access-exception.filter.js';
import { AccessHttpConfiguration, readAccessHttpConfiguration, canonicalSource } from '../dist/ba02-check/modules/authentication/http/configuration.js';
import { AccessService } from '../dist/ba02-check/modules/authentication/application/access.service.js';
import { AccessError } from '../dist/ba02-check/modules/authentication/application/access-policy.js';

async function harness() {
  const calls = [];
  const database = { reachable: true, isReachable: async () => database.reachable };
  const account = { id: 'account-a', username: 'admin', displayName: 'Admin', role: 'administrator', status: 'active', passwordChangeRequired: false, branchIds: ['branch-a'] };
  const result = { sessionToken: 'private-session-token', csrfToken: 'csrf-proof', account };
  const stub = {
    authorize: async (...args) => { calls.push(args); },
    bootstrap: async () => ({ preloginToken: 'private-prelogin-token', csrfToken: 'csrf-proof' }),
    login: async () => result,
    logout: async () => {},
    me: async () => ({ account }),
    changePassword: async () => result,
    list: async () => [account],
  };
  class UndeclaredController { read() { return 'must not execute'; } }
  Controller('undeclared')(UndeclaredController);
  Get()(UndeclaredController.prototype, 'read', Object.getOwnPropertyDescriptor(UndeclaredController.prototype, 'read'));
  class TestModule {}
  Module({ controllers: [AccessController, UndeclaredController, HealthController], providers: [
    { provide: AccessService, useValue: stub },
    { provide: DatabaseService, useValue: database },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useFactory: (reflector, config, access) => new AccessBoundaryGuard(reflector, config, access), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, new FastifyAdapter({ trustProxy: ['127.0.0.1'], bodyLimit: 16384 }), { logger: false, abortOnError: false });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  const request = (options) => {
    const headers = { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', ...options.headers };
    for (const key of Object.keys(headers)) if (headers[key] === undefined) delete headers[key];
    return app.inject({ ...options, headers });
  };
  return { app, request, stub, calls, database };
}

test('real HTTP boundary enforces exact origin, authority and HTTPS before invoking login', async () => {
  const h = await harness();
  try {
    let logins = 0;
    h.stub.login = async () => { logins++; return {}; };
    for (const headers of [ { origin: undefined }, { origin: 'null' }, { origin: 'https://other.test' }, { host: 'other.test' }, { 'x-forwarded-proto': 'http' } ]) {
      const response = await h.request({ method: 'POST', url: '/api/v1/auth/login', payload: {}, headers });
      assert.equal(response.statusCode, 403);
      assert.equal(response.headers['cache-control'], 'no-store');
    }
    assert.equal(logins, 0);
    const spoofedProxy = await h.request({ method: 'POST', url: '/api/v1/auth/login', payload: {}, remoteAddress: '192.0.2.10' });
    assert.equal(spoofedProxy.statusCode, 403);
    assert.equal(logins, 0);
    const response = await h.request({ method: 'GET', url: '/api/v1/auth/csrf', headers: { origin: undefined } });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { csrfToken: 'csrf-proof' });
    assert.equal(response.headers['access-control-allow-origin'], undefined);
    assert.match(response.headers['set-cookie'], /__Host-prelogin=private-prelogin-token; Path=\/; Secure; HttpOnly; SameSite=Strict/);
  } finally { await h.app.close(); }
});

test('login/password cookie transport hides session tokens and logout clears host cookies', async () => {
  const h = await harness();
  try {
    for (const url of ['/api/v1/auth/login', '/api/v1/auth/password']) {
      const response = await h.request({ method: 'POST', url, payload: {}, headers: { cookie: '__Host-session=old-session', 'x-csrf-token': 'csrf-proof' } });
      assert.equal(response.statusCode, 200);
      assert.equal(response.json().sessionToken, undefined);
      assert.ok(!response.body.includes('private-session-token'));
      assert.equal(response.json().csrfToken, 'csrf-proof');
      const cookies = response.headers['set-cookie'];
      assert.equal(cookies.length, 2);
      assert.match(cookies[0], /^__Host-session=private-session-token; Path=\/; Secure; HttpOnly; SameSite=Strict$/);
      assert.match(cookies[1], /__Host-prelogin=;.*Max-Age=0/);
      assert.ok(cookies.every((cookie) => !cookie.includes('Domain=')));
    }
    assert.deepEqual(h.calls, [[{ session: 'old-session', csrf: 'csrf-proof' }, false, true]]);
    const logout = await h.request({ method: 'POST', url: '/api/v1/auth/logout' });
    assert.equal(logout.statusCode, 204);
    assert.equal(logout.body, '');
    assert.ok(logout.headers['set-cookie'].every((cookie) => cookie.includes('Max-Age=0')));
    h.stub.logout = async () => { throw new AccessError(403, 'Invalid CSRF proof'); };
    const deniedLogout = await h.request({ method: 'POST', url: '/api/v1/auth/logout' });
    assert.equal(deniedLogout.statusCode, 403);
    assert.equal(deniedLogout.headers['set-cookie'], undefined);
  } finally { await h.app.close(); }
});

test('real guard selects staff/admin restrictions and defaults undeclared routes to denied', async () => {
  const h = await harness();
  try {
    for (const url of ['/api/v1/auth/me', '/api/v1/context', '/api/v1/staff']) assert.equal((await h.request({ method: 'GET', url })).statusCode, 200);
    assert.deepEqual(h.calls.map((args) => args.slice(1)), [[false, false], [false, false], [true, false]]);
    const denied = await h.request({ method: 'GET', url: '/undeclared' });
    assert.equal(denied.statusCode, 401);
    assert.ok(!denied.body.includes('must not execute'));
    h.stub.authorize = async () => { throw new AccessError(401, 'Authentication required'); };
    assert.equal((await h.request({ method: 'GET', url: '/api/v1/staff' })).statusCode, 401);
  } finally { await h.app.close(); }
});

test('real exception wiring sanitizes internal errors, returns Retry-After and rejects oversized input', async () => {
  const h = await harness();
  try {
    h.stub.login = async () => { throw new Error('SQL password=secret'); };
    const failed = await h.request({ method: 'POST', url: '/api/v1/auth/login', payload: {} });
    assert.equal(failed.statusCode, 503);
    assert.deepEqual(failed.json(), { statusCode: 503, message: 'Service unavailable' });
    h.stub.login = async () => { throw new AccessError(429, 'Too many attempts', 42); };
    const limited = await h.request({ method: 'POST', url: '/api/v1/auth/login', payload: {} });
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.headers['retry-after'], '42');
    const oversized = await h.request({ method: 'POST', url: '/api/v1/auth/login', payload: { password: 'x'.repeat(17000) } });
    assert.equal(oversized.statusCode, 413);
    assert.equal(oversized.headers['access-control-allow-origin'], undefined);
  } finally { await h.app.close(); }
});

test('configuration requires canonical HTTPS origin and explicit proxy IPs; source canonicalization is stable', () => {
  assert.equal(readAccessHttpConfiguration({ CLIENT_ORIGIN: 'https://pos.test:8443', TRUSTED_PROXY_ADDRESSES: '127.0.0.1,::1' }).authority, 'pos.test:8443');
  for (const origin of [undefined, 'http://pos.test', 'https://pos.test/', 'https://user:pass@pos.test', 'https://pos.test/path', 'https://pos.test?x=1', 'https://pos.test#fragment', 'https://POS.test', 'https://pos.test:443']) assert.throws(() => readAccessHttpConfiguration({ CLIENT_ORIGIN: origin }));
  for (const proxy of ['true', '*', '127.0.0.0/8', 'localhost', '127.0.0.1,']) assert.throws(() => readAccessHttpConfiguration({ CLIENT_ORIGIN: 'https://pos.test', TRUSTED_PROXY_ADDRESSES: proxy }));
  assert.equal(canonicalSource('::ffff:192.0.2.10'), '192.0.2.10');
  assert.equal(canonicalSource('2001:0DB8:0:0:0:0:0:1'), '2001:db8::1');
  assert.equal(canonicalSource('192.0.2.10'), '192.0.2.10');
  assert.throws(() => canonicalSource('spoofed-host'));
});


test('unprefixed technical health preserves accepted success and unavailable contracts', async () => {
  const h = await harness();
  try {
    let response = await h.app.inject({ method: 'GET', url: '/health' });
    assert.equal(response.statusCode, 200); assert.deepEqual(response.json(), { status: 'ok' });
    h.database.reachable = false;
    response = await h.app.inject({ method: 'GET', url: '/health' });
    assert.equal(response.statusCode, 503); assert.deepEqual(response.json(), { status: 'unavailable' });
    const duplicate = await h.request({ method: 'GET', url: '/api/v1/auth/csrf', headers: { cookie: '__Host-session=one; __Host-session=two' } });
    assert.equal(duplicate.statusCode, 400);
  } finally { await h.app.close(); }
});
