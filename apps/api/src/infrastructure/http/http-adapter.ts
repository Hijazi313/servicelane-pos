import { randomUUID } from 'node:crypto';
import { FastifyAdapter } from '@nestjs/platform-fastify';

export interface HttpCompletion {
  requestId: string;
  method: string;
  route: string | null;
  status: number;
  duration: number;
}
export interface HttpAdapterOptions { bodyLimit: number; trustedProxies: readonly string[] }

/** Supported adapter hooks; reporting must be nonthrowing and secret-safe. */
export function createHttpAdapter(options: HttpAdapterOptions, report: (event: HttpCompletion) => void): FastifyAdapter {
  const adapter = new FastifyAdapter({ logger: false, bodyLimit: options.bodyLimit, trustProxy: options.trustedProxies.length ? [...options.trustedProxies] : false, requestIdHeader: false, genReqId: () => randomUUID() });
  const starts = new WeakMap<object, number>();
  const server = adapter.getInstance();
  server.addHook('onRequest', async (request, reply) => {
    starts.set(request, performance.now());
    reply.header('X-Request-Id', request.id);
  });
  server.addHook('onResponse', async (request, reply) => {
    const start = starts.get(request);
    report({ requestId: request.id, method: request.method, route: request.routeOptions.url ?? null,
      status: reply.statusCode, duration: start === undefined ? 0 : performance.now() - start });
  });
  return adapter;
}
