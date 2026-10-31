import 'reflect-metadata';
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app-routes-check/app.module.js';
import { createHttpAdapter } from '../dist/app-routes-check/infrastructure/http/http-adapter.js';
import { AccessService } from '../dist/app-routes-check/modules/authentication/public.js';
import { BillingService } from '../dist/app-routes-check/modules/billing/application/billing.service.js';
import { DrawerService } from '../dist/app-routes-check/modules/cashier-shifts/application/drawer.service.js';

test('AppModule dispatches Billing and Cashier requests through their controllers', async () => {
  process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/test';
  process.env.CLIENT_ORIGIN = 'https://pos.test';
  process.env.NODE_ENV = 'test';
  const app = await NestFactory.create(AppModule,
    createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: 16_384 }, () => {}),
    { logger: false, abortOnError: false });
  try {
    const access = mock.method(app.get(AccessService), 'authorize', async () => {});
    const billing = mock.method(app.get(BillingService), 'getPolicy', async () => ({ configured: false }));
    const drawers = mock.method(app.get(DrawerService), 'listDrawers', async () => []);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const headers = { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: '__Host-session=synthetic' };
    for (const [url, expected] of [
      ['/api/v1/billing/policy', { configured: false }],
      ['/api/v1/cash-drawers', []],
    ]) {
      const response = await app.inject({ method: 'GET', url, headers });
      assert.equal(response.statusCode, 200, response.body);
      assert.deepEqual(response.json().data, expected);
    }
    assert.equal(access.mock.calls.length, 2);
    assert.equal(billing.mock.calls.length, 1);
    assert.equal(drawers.mock.calls.length, 1);
  } finally {
    mock.restoreAll();
    await app.close();
  }
});
