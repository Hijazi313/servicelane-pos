// Composition only; no configuration reads, driver construction or connections at import.
import { createRuntime as ordersRuntime } from './or01-runtime.mjs';
export async function namedTransactions(database, name) {
  const { sql } = await import('drizzle-orm');
  return { transaction: work => database.transaction(async tx => {
    await tx.execute(sql`select set_config('application_name',${name},true)`);
    return work(tx);
  }) };
}
export async function createRuntime(pool, transactionName) {
  const runtime = await ordersRuntime(pool);
  if (transactionName) {
    const { AccessService } = await import('../dist/orders-check/modules/authentication/public.js');
    const { PostgresAccessStore } = await import('../dist/orders-check/modules/authentication/infrastructure/access-store.js');
    const { NodePasswordHasher } = await import('../dist/orders-check/modules/authentication/infrastructure/password-hasher.js');
    runtime.access = new AccessService(new PostgresAccessStore({ db: await namedTransactions(runtime.database.db, transactionName) }), runtime.business, new NodePasswordHasher());
  }
  const { OrderPreparationService } = await import('../dist/orders-check/modules/orders/public.js');
  const { PostgresKitchenStore } = await import('../dist/orders-check/modules/kitchen/infrastructure/postgres-kitchen-store.service.js');
  const { KitchenService } = await import('../dist/orders-check/modules/kitchen/application/kitchen.service.js');
  const kitchenStore = new PostgresKitchenStore(runtime.database);
  return { ...runtime, kitchenStore, kitchen: new KitchenService(runtime.access, new OrderPreparationService(runtime.store), kitchenStore) };
}
export async function createHttp(runtime) {
  await import('reflect-metadata');
  const { Module } = await import('@nestjs/common');
  const { NestFactory, Reflector, APP_GUARD, APP_FILTER, APP_INTERCEPTOR } = await import('@nestjs/core');
  const { KitchenController } = await import('../dist/orders-check/modules/kitchen/http/kitchen.controller.js');
  const { KitchenService } = await import('../dist/orders-check/modules/kitchen/application/kitchen.service.js');
  const { AccessService } = await import('../dist/orders-check/modules/authentication/public.js');
  const { AccessBoundaryGuard } = await import('../dist/orders-check/modules/authentication/http/access-boundary.guard.js');
  const { AccessExceptionFilter } = await import('../dist/orders-check/modules/authentication/http/access-exception.filter.js');
  const { AccessHttpConfiguration } = await import('../dist/orders-check/modules/authentication/http/configuration.js');
  const { createHttpAdapter } = await import('../dist/orders-check/infrastructure/http/http-adapter.js');
  const { HttpContractGuard } = await import('../dist/orders-check/infrastructure/http/http-contract.guard.js');
  const { HttpResponseInterceptor } = await import('../dist/orders-check/infrastructure/http/http-response.interceptor.js');
  class AcceptanceModule {}
  Module({ controllers: [KitchenController], providers: [
    { provide: KitchenService, useValue: runtime.kitchen }, { provide: AccessService, useValue: runtime.access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useClass: HttpContractGuard }, { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_GUARD, useFactory: (reflector, config, access) => new AccessBoundaryGuard(reflector, config, access), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(AcceptanceModule);
  const app = await NestFactory.create(AcceptanceModule, createHttpAdapter({ trustedProxies: ['127.0.0.1'], bodyLimit: 16_384 }, () => {}), { logger: false, abortOnError: false });
  try {
    await app.init(); await app.getHttpAdapter().getInstance().ready();
    return { app, request: (proof, method, path, payload) => app.inject({ method, url: '/api/v1/kitchen/tickets' + path,
      ...(payload === undefined ? {} : { payload }), headers: { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: `__Host-session=${proof.session}`, 'x-csrf-token': proof.csrf } }) };
  } catch (error) { await app.close(); throw error; }
}
