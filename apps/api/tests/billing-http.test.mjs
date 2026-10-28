import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { NestFactory, Reflector, APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { createHttpAdapter } from '../dist/billing-check/infrastructure/http/http-adapter.js';
import { HttpContractGuard } from '../dist/billing-check/infrastructure/http/http-contract.guard.js';
import { HttpResponseInterceptor } from '../dist/billing-check/infrastructure/http/http-response.interceptor.js';
import { BillingController } from '../dist/billing-check/modules/billing/http/billing.controller.js';
import { BillingService } from '../dist/billing-check/modules/billing/application/billing.service.js';
import { AccessService } from '../dist/billing-check/modules/authentication/public.js';
import { AccessBoundaryGuard } from '../dist/billing-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../dist/billing-check/modules/authentication/http/access-exception.filter.js';
import { AccessHttpConfiguration } from '../dist/billing-check/modules/authentication/http/configuration.js';
import { billingFixture } from './billing-fixture.mjs';
import { BusinessDisplayController } from '../dist/billing-check/modules/business/http/business-display.controller.js';
import { BusinessDisplayService } from '../dist/billing-check/modules/business/application/business-display.service.js';
import { DisplaySettingsService } from '../dist/billing-check/modules/business/public.js';

async function harness() {
  const h = billingFixture(); class OfflineBillingModule {}
  const display = new DisplaySettingsService({ get: async () => structuredClone(h.state().display),
    replace: async (_scope, _before, after) => h.setDisplay(after) });
  Module({ controllers: [BillingController, BusinessDisplayController], providers: [
    { provide: BusinessDisplayService, useValue: new BusinessDisplayService(h.access, display) },
    { provide: BillingService, useValue: h.service }, { provide: AccessService, useValue: h.access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useClass: HttpContractGuard }, { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_GUARD, useFactory: (reflector, config, access) => new AccessBoundaryGuard(reflector, config, access), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(OfflineBillingModule);
  const app = await NestFactory.create(OfflineBillingModule, createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: 16_384 }, () => {}), { logger: false, abortOnError: false });
  await app.init(); await app.getHttpAdapter().getInstance().ready();
  const request = (method, path, payload, headers = {}) => app.inject({ method, url: path.startsWith('/api/') ? path : '/api/v1/billing' + path, ...(payload === undefined ? {} : { payload }), headers: {
    host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: '__Host-session=offline', 'x-csrf-token': 'offline-csrf', ...headers,
  } });
  return { ...h, app, request };
}
function problem(response, status, code) {
  assert.equal(response.statusCode, status, response.body); const body = response.json(); assert.equal(body.code, code);
  assert.equal(body.type, '/problems/' + code.toLowerCase().replaceAll('_', '-'));
  assert.equal(body.meta.requestId, response.headers['x-request-id']); assert.equal(response.headers['cache-control'], 'no-store');
  assert.match(response.headers['content-type'], /^application\/problem\+json/); return body;
}
test('BP-A11: policy and assessment methods use shared envelopes and explicit unconfigured behavior', async () => {
  const h = await harness();
  try {
    const policy = await h.request('GET', '/policy'); assert.equal(policy.statusCode, 200); assert.equal(policy.json().data.status, 'unconfigured');
    problem(await h.request('POST', '/assessments', { orderId: h.order.orderId, optionalChargeIds: [] }), 409, 'BILLING_POLICY_UNCONFIGURED');
    const updated = await h.request('PUT', '/policy', h.policy()); assert.equal(updated.statusCode, 200, updated.body); assert.equal(updated.json().data.revision, 1);
    const assessed = await h.request('POST', '/assessments', { orderId: h.order.orderId, optionalChargeIds: [] }); assert.equal(assessed.statusCode, 200);
    assert.equal(assessed.json().meta.requestId, assessed.headers['x-request-id']);
    assert.equal(assessed.headers['cache-control'], 'no-store');
  } finally { await h.app.close(); }
});
test('BP-A01/07/11: strict DTOs, safe failures, stale details and response field exclusion', async () => {
  const h = await harness();
  try {
    for (const payload of [{}, { orderId: h.order.orderId }, { orderId: h.order.orderId, optionalChargeIds: null }, { orderId: h.order.orderId, optionalChargeIds: [], actorId: randomUUID() }, { orderId: h.order.orderId, optionalChargeIds: [], constructor: {} }]) {
      const body = problem(await h.request('POST', '/assessments', payload), 400, 'VALIDATION_FAILED'); assert.ok(body.errors.length);
    }
    for (const [method, path, body] of [['GET', '/policy?x=1'], ['PUT', '/policy?x=1', h.policy()], ['POST', '/assessments?x=1', { orderId: h.order.orderId, optionalChargeIds: [] }], ['POST', '/bills?x=1', {}], ['GET', `/orders/${h.order.orderId}/bill?x=1`]]) {
      problem(await h.request(method, path, body), 400, 'VALIDATION_FAILED');
    }
    const nested = h.policy({ taxes: [{ id: randomUUID(), enabled: true, label: 'Sample', ratePercent: '10', priceMode: 'exclusive', targets: { merchandise: true, chargeIds: [], foreign: true } }] });
    problem(await h.request('PUT', '/policy', nested), 400, 'VALIDATION_FAILED');
    problem(await h.request('PUT', '/policy', h.policy({ expectedRevision: '0' })), 400, 'VALIDATION_FAILED');
    problem(await h.request('GET', '/orders/not-uuid/bill'), 400, 'VALIDATION_FAILED');
    for (const value of [null, [], { merchandise: true, chargeIds: null }]) {
      problem(await h.request('PUT', '/policy', h.policy({ taxes: [{ id: randomUUID(), enabled: true, label: 'Offline', ratePercent: '10', priceMode: 'exclusive', targets: value }] })), 400, 'VALIDATION_FAILED');
    }
    problem(await h.request('PUT', '/policy', h.policy({ charges: [{ id: randomUUID(), enabled: 'true', label: 'Offline', application: 'automatic', kind: 'fixed', fixedMinor: '10', ratePercent: null }] })), 400, 'VALIDATION_FAILED');
    assert.equal((await h.request('POST', '/assessments', '{', { 'content-type': 'application/json' })).statusCode, 400);
    assert.equal((await h.request('POST', '/assessments', 'offline', { 'content-type': 'application/unsupported' })).statusCode, 415);

    problem(await h.request('GET', '/policy', undefined, { cookie: '' }), 401, 'ACCESS_UNAUTHENTICATED');
    problem(await h.request('POST', '/assessments', { orderId: h.order.orderId, optionalChargeIds: [] }, { 'x-csrf-token': 'wrong' }), 403, 'ACCESS_FORBIDDEN');
    await h.request('PUT', '/policy', h.policy());
    const a = (await h.request('POST', '/assessments', { orderId: h.order.orderId, optionalChargeIds: [] })).json().data;
    const r = { orderId: a.orderId, optionalChargeIds: [], retryKey: randomUUID(), expectedCurrencyCode: a.currencyCode, expectedScale: a.scale, expectedPayableMinor: a.payableMinor, expectedPolicyRevision: a.billingPolicy.revision, expectedDisplayRevision: a.businessDisplay.revision, sessionId: h.sessionId };
    const { sessionId: _sessionId, ...legacy } = r;
    problem(await h.request('POST', '/bills', legacy), 409, 'CASH_DRAWER_REQUIRED');
    problem(await h.request('POST', '/bills', { ...r, sessionId: null }), 400, 'VALIDATION_FAILED');
    h.setDisplay({ revision: 1 }); const stale = problem(await h.request('POST', '/bills', r), 409, 'STALE_ASSESSMENT'); assert.deepEqual(stale.details, { policyRevision: 1, displayRevision: 1 });
    h.setDisplay({ revision: 0 }); h.fail(true); const failed = await h.request('POST', '/bills', r); problem(failed, 500, 'INTERNAL_ERROR'); assert.doesNotMatch(failed.body, /SQL|secret/); assert.equal(h.state().records.length, 0);
    h.fail(false); const settled = await h.request('POST', '/bills', r); assert.equal(settled.statusCode, 201, settled.body);
    assert.equal(settled.headers.location, `/api/v1/billing/orders/${a.orderId}/bill`);
    assert.equal(settled.json().meta.requestId, settled.headers['x-request-id']);
    assert.doesNotMatch(settled.body, /actorId|configurationNote|retryKey|customer|instructions/);
    const replay = await h.request('POST', '/bills', r); assert.equal(replay.statusCode, 201); assert.deepEqual(replay.json().data, settled.json().data);
    problem(await h.request('POST', '/bills', legacy), 409, 'SETTLEMENT_RETRY_CONFLICT');
    h.state().records[0].request = legacy;
    const legacyReplay = await h.request('POST', '/bills', legacy); assert.equal(legacyReplay.statusCode, 201, legacyReplay.body);
    assert.deepEqual(legacyReplay.json().data, settled.json().data);
    h.state().records[0].request = r;
    const read = await h.request('GET', `/orders/${a.orderId}/bill`); assert.deepEqual(read.json().data, settled.json().data);
    problem(await h.request('POST', '/bills', { ...r, expectedPayableMinor: '999' }), 409, 'SETTLEMENT_RETRY_CONFLICT');
    problem(await h.request('GET', `/orders/${randomUUID()}/bill`), 404, 'BILL_NOT_FOUND');
    assert.equal((await h.request('DELETE', `/orders/${a.orderId}/bill`)).statusCode, 404);
    assert.equal((await h.request('POST', '/assessments', { padding: 'x'.repeat(16_384) })).statusCode, 413);
  } finally { await h.app.close(); }
});

test('BP-A01/09/10/11/12: Business display routes share authorization, envelopes, null and stale revision behavior', async () => {
  const h = await harness(), path = '/api/v1/business/display-settings';
  try {
    const read = await h.request('GET', path); assert.equal(read.statusCode, 200, read.body);
    assert.equal(read.json().data.branchAddress, null); assert.equal(read.headers['cache-control'], 'no-store');
    assert.equal(read.json().meta.requestId, read.headers['x-request-id']);
    const input = { expectedRevision: 0, businessName: 'Updated offline name', branchName: 'Offline branch', branchAddress: null };
    h.admin(false); problem(await h.request('PUT', path, input), 403, 'ACCESS_FORBIDDEN'); h.admin(true);
    problem(await h.request('PUT', path, input, { 'x-csrf-token': 'wrong' }), 403, 'ACCESS_FORBIDDEN');
    problem(await h.request('GET', path + '?x=1'), 400, 'VALIDATION_FAILED');
    problem(await h.request('PUT', path, { ...input, currencyCode: 'USD' }), 400, 'VALIDATION_FAILED');
    problem(await h.request('PUT', path, { ...input, businessName: null }), 400, 'VALIDATION_FAILED');
    const changed = await h.request('PUT', path, input); assert.equal(changed.statusCode, 200, changed.body);
    assert.deepEqual(changed.json().data, { ...read.json().data, revision: 1, businessName: input.businessName });
    const stale = problem(await h.request('PUT', path, input), 409, 'STALE_DISPLAY_SETTINGS'); assert.deepEqual(stale.details, { revision: 1 });
    const noOp = await h.request('PUT', path, { ...input, expectedRevision: 1 }); assert.equal(noOp.json().data.revision, 1);
  } finally { await h.app.close(); }
});
