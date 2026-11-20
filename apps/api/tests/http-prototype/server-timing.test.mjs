import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpAdapter } from '../../dist/orders-check/infrastructure/http/http-adapter.js';

test('server timing accompanies success, errors and existing metrics', async () => {
  const events = [];
  const adapter = createHttpAdapter({ trustedProxies: [], bodyLimit: 16384 }, event => events.push(event));
  const server = adapter.getInstance();
  server.get('/ok', async (_request, reply) => { reply.header('Server-Timing', 'other;dur=1'); return { ok: true }; });
  server.get('/empty', async (_request, reply) => reply.code(204).send());
  server.get('/error', async (_request, reply) => reply.code(503).send({ status: 'unavailable' }));
  try {
    for (const [path, status] of [['/ok', 200], ['/empty', 204], ['/error', 503], ['/missing', 404]]) {
      const response = await server.inject({ method: 'GET', url: path });
      assert.equal(response.statusCode, status);
      assert.match(response.headers['server-timing'], /(?:^|, )app;dur=\d+\.\d{2}$/);
      if (path === '/ok') assert.match(response.headers['server-timing'], /^other;dur=1, /);
      assert.ok(response.headers['x-request-id']);
    }
    assert.equal(events.length, 4);
  } finally { await server.close(); }
});
