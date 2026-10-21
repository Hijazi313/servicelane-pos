// Real persistence composition shared by the separately authorized OR-01 probes.
// Importing this helper does not read configuration or open connections.
export async function createRuntime(pool) {
  await import('reflect-metadata');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { BusinessService } = await import('../dist/orders-check/modules/business/public.js');
  const { AccessService } = await import('../dist/orders-check/modules/authentication/public.js');
  const { PostgresAccessStore } = await import('../dist/orders-check/modules/authentication/infrastructure/access-store.js');
  const { NodePasswordHasher } = await import('../dist/orders-check/modules/authentication/infrastructure/password-hasher.js');
  const { MenuService } = await import('../dist/orders-check/modules/menu/application/menu.service.js');
  const { PostgresMenuStore } = await import('../dist/orders-check/modules/menu/infrastructure/menu-store.js');
  const { MenuOrderResolver } = await import('../dist/orders-check/modules/menu/public.js');
  const { PostgresOrderStore } = await import('../dist/orders-check/modules/orders/infrastructure/postgres-order-store.service.js');
  const { OrdersService } = await import('../dist/orders-check/modules/orders/application/orders.service.js');
  const database = { db: drizzle({ client: pool }) };
  const business = new BusinessService(database);
  const access = new AccessService(new PostgresAccessStore(database), business, new NodePasswordHasher());
  const menu = new MenuService(new PostgresMenuStore(database));
  const store = new PostgresOrderStore(database);
  const orders = new OrdersService(access, new MenuOrderResolver(menu), store);
  return { database, business, access, menu, store, orders };
}

export async function createHttp(runtime) {
  await import('reflect-metadata');
  const { Module } = await import('@nestjs/common');
  const { NestFactory, Reflector, APP_FILTER, APP_GUARD } = await import('@nestjs/core');
  const { FastifyAdapter } = await import('@nestjs/platform-fastify');
  const { OrdersController } = await import('../dist/orders-check/modules/orders/http/orders.controller.js');
  const { OrdersService } = await import('../dist/orders-check/modules/orders/application/orders.service.js');
  const { AccessService } = await import('../dist/orders-check/modules/authentication/public.js');
  const { AccessBoundaryGuard } = await import('../dist/orders-check/modules/authentication/http/access-boundary.guard.js');
  const { AccessExceptionFilter } = await import('../dist/orders-check/modules/authentication/http/access-exception.filter.js');
  const { AccessHttpConfiguration } = await import('../dist/orders-check/modules/authentication/http/configuration.js');
  const { REQUEST_BODY_LIMIT_BYTES } = await import('../dist/orders-check/infrastructure/request-limits.js');
  class AcceptanceModule {}
  Module({ controllers: [OrdersController], providers: [
    { provide: OrdersService, useValue: runtime.orders },
    { provide: AccessService, useValue: runtime.access },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test', 'pos.test', ['127.0.0.1']) },
    { provide: APP_GUARD, useFactory: (reflector, configuration, service) => new AccessBoundaryGuard(reflector, configuration, service), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(AcceptanceModule);
  const app = await NestFactory.create(AcceptanceModule, new FastifyAdapter({ trustProxy: ['127.0.0.1'], bodyLimit: REQUEST_BODY_LIMIT_BYTES }), { logger: false, abortOnError: false });
  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const request = (proof, method, path, payload, overrides = {}) => app.inject({
      method, url: '/api/v1/orders' + path, ...(payload === undefined ? {} : { payload }),
      headers: { host: 'pos.test', 'x-forwarded-proto': 'https', origin: 'https://pos.test', cookie: `__Host-session=${proof.session}`, 'x-csrf-token': proof.csrf, ...overrides },
    });
    return { app, request };
  } catch (error) {
    await app.close();
    throw error;
  }
}
