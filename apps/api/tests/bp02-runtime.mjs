// Test-only composition. Imports do not load configuration or connect.
export async function createRuntime(pool, name) {
  await import('reflect-metadata');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { sql } = await import('drizzle-orm');
  const { BusinessService } = await import('../dist/billing-check/modules/business/public.js');
  const { AccessService } = await import('../dist/billing-check/modules/authentication/public.js');
  const { PostgresAccessStore } = await import('../dist/billing-check/modules/authentication/infrastructure/access-store.js');
  const { NodePasswordHasher } = await import('../dist/billing-check/modules/authentication/infrastructure/password-hasher.js');
  const { PostgresOrderStore } = await import('../dist/billing-check/modules/orders/infrastructure/postgres-order-store.service.js');
  const { OrderFinancialService } = await import('../dist/billing-check/modules/orders/public.js');
  const { DisplaySettingsService } = await import('../dist/billing-check/modules/business/public.js');
  const { PostgresDisplayStore } = await import('../dist/billing-check/modules/business/infrastructure/postgres-display-store.service.js');
  const { BusinessDisplayService } = await import('../dist/billing-check/modules/business/application/business-display.service.js');
  const { PostgresBillingStore } = await import('../dist/billing-check/modules/billing/infrastructure/postgres-billing-store.service.js');
  const { BillingService } = await import('../dist/billing-check/modules/billing/application/billing.service.js');
  const database = { db: drizzle({ client: pool }) }, business = new BusinessService(database);
  const accessDatabase = name ? { db: { transaction: work => database.db.transaction(async tx => {
    await tx.execute(sql`select set_config('application_name',${name},true)`); return work(tx);
  }) } } : database;
  const accessStore = new PostgresAccessStore(accessDatabase), access = new AccessService(accessStore, business, new NodePasswordHasher());
  const store = new PostgresBillingStore(database), displayStore = new PostgresDisplayStore(database);
  const display = new DisplaySettingsService(displayStore);
  return { database, business, accessStore, access, store, displayStore, display,
    displayAdmin: new BusinessDisplayService(access, display),
    billing: new BillingService(access, new OrderFinancialService(new PostgresOrderStore(database)), display, store) };
}
export async function createHttp(runtime) {
  await import('reflect-metadata');
  const { Module } = await import('@nestjs/common');
  const { NestFactory, Reflector, APP_GUARD, APP_FILTER, APP_INTERCEPTOR } = await import('@nestjs/core');
  const { BillingController } = await import('../dist/billing-check/modules/billing/http/billing.controller.js');
  const { BillingService } = await import('../dist/billing-check/modules/billing/application/billing.service.js');
  const { AccessService } = await import('../dist/billing-check/modules/authentication/public.js');
  const { AccessBoundaryGuard } = await import('../dist/billing-check/modules/authentication/http/access-boundary.guard.js');
  const { AccessExceptionFilter } = await import('../dist/billing-check/modules/authentication/http/access-exception.filter.js');
  const { AccessHttpConfiguration } = await import('../dist/billing-check/modules/authentication/http/configuration.js');
  const { createHttpAdapter } = await import('../dist/billing-check/infrastructure/http/http-adapter.js');
  const { HttpContractGuard } = await import('../dist/billing-check/infrastructure/http/http-contract.guard.js');
  const { HttpResponseInterceptor } = await import('../dist/billing-check/infrastructure/http/http-response.interceptor.js');
  class VerificationModule {}
  Module({ controllers: [BillingController], providers: [
    { provide: BillingService, useValue: runtime.billing }, { provide: AccessService, useValue: runtime.access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useClass: HttpContractGuard }, { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_GUARD, useFactory: (reflector, config, access) => new AccessBoundaryGuard(reflector, config, access), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(VerificationModule);
  const app = await NestFactory.create(VerificationModule, createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: 2097152 }, () => {}), { logger: false, abortOnError: false });
  try {
    await app.init(); await app.getHttpAdapter().getInstance().ready();
    return { app, request: (proof, method, path, payload) => app.inject({ method, url: '/api/v1/billing' + path,
      ...(payload === undefined ? {} : { payload }), headers: { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: `__Host-session=${proof.session}`, 'x-csrf-token': proof.csrf } }) };
  } catch (error) { await app.close(); throw error; }
}
