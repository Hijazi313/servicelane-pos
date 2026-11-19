import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AccessRequestError, changePassword, currentAccount, login, logout } from '../src/features/access/access-api.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('login obtains same-origin CSRF proof and submits credentials once', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? Response.json({ csrfToken: 'synthetic-proof' })
      : Response.json({ account: { displayName: 'Sample', passwordChangeRequired: false } });
  };
  assert.deepEqual(await login('sample', 'synthetic-password'), { displayName: 'Sample', passwordChangeRequired: false });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, '/api/v1/auth/csrf');
  assert.equal(calls[1].url, '/api/v1/auth/login');
  assert.equal(calls[1].options.credentials, 'same-origin');
  assert.equal(calls[1].options.headers['X-CSRF-Token'], 'synthetic-proof');
  assert.deepEqual(JSON.parse(calls[1].options.body), { username: 'sample', password: 'synthetic-password' });
});

test('failed identity response does not become an authenticated account', async () => {
  globalThis.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(currentAccount(), error => error instanceof AccessRequestError && error.status === 401);
  globalThis.fetch = async () => Response.json({ displayName: 'Sample' });
  await assert.rejects(currentAccount(), /Unexpected account response/);
});

test('failed logout is surfaced without automatic replay', async () => {
  let count = 0;
  globalThis.fetch = async () => {
    count += 1;
    return count === 1 ? Response.json({ csrfToken: 'synthetic-proof' }) : Promise.reject(new Error('connection lost'));
  };
  await assert.rejects(logout(), /connection lost/);
  assert.equal(count, 2);
});

test('password change sends fresh CSRF proof and returns the rotated account', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? Response.json({ csrfToken: 'synthetic-proof' })
      : Response.json({ account: { displayName: 'Sample', passwordChangeRequired: false } });
  };
  assert.equal((await changePassword('temporary-secret', 'replacement-secret')).passwordChangeRequired, false);
  assert.equal(calls[1].url, '/api/v1/auth/password');
  assert.equal(calls[1].options.headers['X-CSRF-Token'], 'synthetic-proof');
  assert.deepEqual(JSON.parse(calls[1].options.body), { currentPassword: 'temporary-secret', newPassword: 'replacement-secret' });
});
