// Test-only composition. Imports do not load configuration or connect.
export async function createRuntime(pool, name) {
  await import('reflect-metadata');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { sql } = await import('drizzle-orm');
  const { BusinessService } = await import('../dist/cs02-check/modules/business/public.js');
  const { AccessService } = await import('../dist/cs02-check/modules/authentication/public.js');
  const { PostgresAccessStore } = await import('../dist/cs02-check/modules/authentication/infrastructure/access-store.js');
  const { NodePasswordHasher } = await import('../dist/cs02-check/modules/authentication/infrastructure/password-hasher.js');
  const { PostgresOrderStore } = await import('../dist/cs02-check/modules/orders/infrastructure/postgres-order-store.service.js');
  const { OrderFinancialService } = await import('../dist/cs02-check/modules/orders/public.js');
  const { DisplaySettingsService } = await import('../dist/cs02-check/modules/business/public.js');
  const { PostgresDisplayStore } = await import('../dist/cs02-check/modules/business/infrastructure/postgres-display-store.service.js');
  const { BusinessDisplayService } = await import('../dist/cs02-check/modules/business/application/business-display.service.js');
  const { PostgresBillingStore } = await import('../dist/cs02-check/modules/billing/infrastructure/postgres-billing-store.service.js');
  const { BillingService } = await import('../dist/cs02-check/modules/billing/application/billing.service.js');
  const { PostgresDrawerStore } = await import('../dist/cs02-check/modules/cashier-shifts/infrastructure/postgres-drawer-store.service.js');
  const { DrawerService } = await import('../dist/cs02-check/modules/cashier-shifts/application/drawer.service.js');
  const { CashierSettlementService } = await import('../dist/cs02-check/modules/cashier-shifts/application/cashier-settlement.service.js');
  const database = { db: drizzle({ client: pool }) }, business = new BusinessService(database);
  const accessDatabase = name ? { db: { transaction: work => database.db.transaction(async tx => {
    await tx.execute(sql`select set_config('application_name',${name},true)`); return work(tx);
  }) } } : database;
  const accessStore = new PostgresAccessStore(accessDatabase), access = new AccessService(accessStore, business, new NodePasswordHasher());
  const store = new PostgresBillingStore(database), displayStore = new PostgresDisplayStore(database);
  const display = new DisplaySettingsService(displayStore);
  const drawerStore = new PostgresDrawerStore(database), drawers = new DrawerService(access, drawerStore);
  const cashier = new CashierSettlementService(drawerStore);
  return { database, business, accessStore, access, store, displayStore, display, drawerStore, drawers, cashier,
    displayAdmin: new BusinessDisplayService(access, display),
    billing: new BillingService(access, new OrderFinancialService(new PostgresOrderStore(database)), display, store, cashier) };
}
export async function createHttp(runtime) {
  await import('reflect-metadata');
  const { Module } = await import('@nestjs/common');
  const { NestFactory, Reflector, APP_GUARD, APP_FILTER, APP_INTERCEPTOR } = await import('@nestjs/core');
  const { BillingController } = await import('../dist/cs02-check/modules/billing/http/billing.controller.js');
  const { DrawerController } = await import('../dist/cs02-check/modules/cashier-shifts/http/drawer.controller.js');
  const { DrawerService } = await import('../dist/cs02-check/modules/cashier-shifts/application/drawer.service.js');
  const { BillingService } = await import('../dist/cs02-check/modules/billing/application/billing.service.js');
  const { AccessService } = await import('../dist/cs02-check/modules/authentication/public.js');
  const { AccessBoundaryGuard } = await import('../dist/cs02-check/modules/authentication/http/access-boundary.guard.js');
  const { AccessExceptionFilter } = await import('../dist/cs02-check/modules/authentication/http/access-exception.filter.js');
  const { AccessHttpConfiguration } = await import('../dist/cs02-check/modules/authentication/http/configuration.js');
  const { createHttpAdapter } = await import('../dist/cs02-check/infrastructure/http/http-adapter.js');
  const { HttpContractGuard } = await import('../dist/cs02-check/infrastructure/http/http-contract.guard.js');
  const { HttpResponseInterceptor } = await import('../dist/cs02-check/infrastructure/http/http-response.interceptor.js');
  class VerificationModule {}
  Module({ controllers: [BillingController, DrawerController], providers: [
    { provide: BillingService, useValue: runtime.billing }, { provide: DrawerService, useValue: runtime.drawers }, { provide: AccessService, useValue: runtime.access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useClass: HttpContractGuard }, { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_GUARD, useFactory: (reflector, config, access) => new AccessBoundaryGuard(reflector, config, access), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(VerificationModule);
  const app = await NestFactory.create(VerificationModule, createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: 2097152 }, () => {}), { logger: false, abortOnError: false });
  try {
    await app.init(); await app.getHttpAdapter().getInstance().ready();
    return { app, request: (proof, method, path, payload) => app.inject({ method, url: '/api/v1' + path,
      ...(payload === undefined ? {} : { payload }), headers: { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: `__Host-session=${proof.session}`, 'x-csrf-token': proof.csrf } }) };
  } catch (error) { await app.close(); throw error; }
}
