import test from 'node:test';
import assert from 'node:assert/strict';
import { hashInitialPassword, verifyPassword, verifyDummyPassword, HashCapacityError } from '../dist/ba02-check/modules/authentication/infrastructure/password-hash.js';
const password = 'a long local password 🧑';

test('existing PHC policy verifies exact Unicode password and rejects wrong or malformed credentials', async () => {
  const hash = await hashInitialPassword(password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword(`${password} `, hash), false);
  for (const malformed of [hash.replace('m=19456', 'm=999999999'), hash.replace('t=2', 't=1'), hash.replace('v=19', 'v=16'), `${hash}=`, hash.slice(0, -1), 'x'.repeat(100000)]) {
    assert.equal(await verifyPassword(password, malformed), false);
  }
  assert.equal(await verifyPassword('short', hash), false);
  assert.equal(await verifyDummyPassword(password), false);
  assert.equal(await verifyDummyPassword('fixed dummy credential never accepted'), false);
});

test('fixed known-vector PHC remains compatible with accepted Argon2id format', async () => {
  const hash = '$argon2id$v=19$m=19456,t=2,p=1$Ly8vLy8vLy8vLy8vLy8vLw$ILsnY8e2S1/NtWSzZo4WbCOqOX83JjQA3tg21QCpxt8';
  assert.equal(await verifyPassword('fixed dummy credential never accepted', hash), true);
});

test('hash and verification share two slots without a waiting queue and release slots', async () => {
  const hash = await hashInitialPassword(password);
  const first = hashInitialPassword(password);
  const second = verifyPassword(password, hash);
  await assert.rejects(hashInitialPassword(password), HashCapacityError);
  await assert.rejects(verifyDummyPassword(password), HashCapacityError);
  assert.equal(await second, true);
  await first;
  assert.equal(await verifyPassword(password, hash), true);
});

test('application bootstrap validates and checks ownership before hashing and writes only in supplied scope', async () => {
  const { ProvisionInitialAdministrator } = await import('../dist/ba02-check/modules/authentication/application/administrator-provisioner.js');
  const events = [];
  const scope = { id: Symbol() };
  const operation = new ProvisionInitialAdministrator({ validateBranchOwnership: async (businessId, branchId, context) => {
    assert.equal(context, scope); assert.equal(businessId, 'business-a'); assert.equal(branchId, 'branch-a'); events.push('ownership');
  } }, {
    hasAccounts: async (context) => { assert.equal(context, scope); events.push('check'); return false; },
    create: async (input, context) => {
      assert.equal(context, scope); assert.equal(input.username, 'admin'); assert.equal(input.passwordHash, 'private-hash');
      assert.equal(input.businessId, 'business-a'); assert.equal(input.branchId, 'branch-a'); events.push('write');
    },
  }, async () => { events.push('hash'); return 'private-hash'; });
  await assert.rejects(operation.createInitialAdministrator({ username: 'admin' }, 'short', 'business-a', 'branch-a', scope));
  assert.deepEqual(events, []);
  const result = await operation.createInitialAdministrator({ username: 'ADMIN' }, password, 'business-a', 'branch-a', scope);
  assert.deepEqual(Object.keys(result), ['accountId']);
  assert.deepEqual(events, ['check', 'ownership', 'hash', 'write']);
});
