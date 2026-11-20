import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { HttpRequestError, request, write } from '../src/shared/api/http-client.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('applies common request settings and handles an empty response', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/example');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
    return new Response(null, { status: 204 });
  };
  assert.equal(await request('example'), undefined);
});

test('surfaces HTTP status and malformed JSON', async () => {
  globalThis.fetch = async () => new Response(null, { status: 403 });
  await assert.rejects(request('example'), error => error instanceof HttpRequestError && error.status === 403);
  globalThis.fetch = async () => new Response('{');
  await assert.rejects(request('example'), SyntaxError);
});

test('does not send a write when CSRF proof is malformed', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({}); };
  await assert.rejects(write('example', 'POST', {}), /Unexpected CSRF response/);
  assert.equal(calls, 1);
});
