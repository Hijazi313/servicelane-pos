import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AccessService } from '../dist/ba02-check/modules/authentication/public.js';
import { AccessEntry, proof as requestProof } from '../dist/ba02-check/modules/authentication/http/public.js';
import { AccessExceptionFilter } from '../dist/ba02-check/modules/authentication/http/access-exception.filter.js';
import { digest, token } from '../dist/ba02-check/modules/authentication/application/access-policy.js';
import { inTransaction, transactionDatabase } from '../dist/ba02-check/infrastructure/database/transaction.js';

// Offline serialized transaction double. Exercises the real opaque-context lifetime,
// not PostgreSQL rollback, advisory locks, or actual database revocation ordering.
function fixture() {
  const now = new Date('2026-10-18T08:00:00Z');
  const proof = { session: token(), csrf: token() };
  const installation = {
    businessId: 'business-a', branchId: 'branch-a',
    business: { name: 'Synthetic business', currencyCode: 'PKR', timezone: 'Asia/Karachi' },
    branch: { name: 'Synthetic branch' },
  };
  let state = {
    account: { id: 'admin-a', businessId: installation.businessId, role: 'administrator', status: 'active', passwordChangeRequired: false, branchIds: [installation.branchId], passwordHash: 'private-hash' },
    session: { digest: digest(proof.session), accountId: 'admin-a', businessId: installation.businessId, csrfToken: proof.csrf, createdAt: now, lastActivityAt: new Date(now.getTime() - 1000), revokedAt: null },
    writes: [],
  };
  let queue = Promise.resolve();
  const failures = {};
  const database = {
    transaction(work) {
      const result = queue.then(async () => {
        if (failures.begin) throw new Error('private begin failure');
        const before = structuredClone(state);
        const transaction = { write: value => { state.writes.push(value); } };
        try {
          const result = await work(transaction);
          if (failures.commit) throw new Error('private commit failure');
          return result;
        } catch (error) {
          state = before;
          if (failures.rollback) throw new Error('private rollback failure');
          throw error;
        }
      });
      queue = result.catch(() => {});
      return result;
    },
  };
  const store = {
    run: work => inTransaction(database, context => work({
      context,
      getSession: async key => key === state.session?.digest ? structuredClone(state.session) : undefined,
      findAccount: async (businessId, { id }) => businessId === state.account?.businessId && id === state.account?.id ? structuredClone(state.account) : undefined,
      saveSession: async session => { state.session = structuredClone(session); },
    })),
  };
  const business = {
    resolveInstallationContext: async context => {
      transactionDatabase(context);
      if (failures.binding) throw new Error('private binding failure');
      return structuredClone(installation);
    },
    validateBranchOwnership: async (businessId, branchId, context) => {
      transactionDatabase(context);
      if (failures.ownership || businessId !== installation.businessId || branchId !== installation.branchId) throw new Error('private ownership failure');
    },
  };
  const service = new AccessService(store, business, {});
  service.now = () => new Date(now);
  return { service, store, proof, installation, failures, state: () => state, now };
}
const denies = (promise, reason) => assert.rejects(promise, error => { assert.equal('status' in error, false); return error.reason === reason; });

test('MN00-AC01: every denied authority/CSRF/context case prevents callback execution', async t => {
  const cases = [
    ['missing session', f => { delete f.proof.session; }, 'UNAUTHENTICATED'],
    ['forged session', f => { f.proof.session = token(); }, 'UNAUTHENTICATED'],
    ['idle expiry', f => { f.state().session.lastActivityAt = new Date(f.now.getTime() - 30 * 60_000); }, 'UNAUTHENTICATED'],
    ['absolute expiry', f => { f.state().session.createdAt = new Date(f.now.getTime() - 12 * 60 * 60_000); }, 'UNAUTHENTICATED'],
    ['revoked session', f => { f.state().session.revokedAt = f.now; }, 'UNAUTHENTICATED'],
    ['disabled account', f => { f.state().account.status = 'disabled'; }, 'UNAUTHENTICATED'],
    ['missing account', f => { f.state().account = undefined; }, 'UNAUTHENTICATED'],
    ['foreign session', f => { f.state().session.businessId = 'foreign-business'; }, 'UNAUTHENTICATED'],
    ['wrong role', f => { f.state().account.role = 'staff'; }, 'FORBIDDEN'],
    ['removed grant', f => { f.state().account.branchIds = []; }, 'FORBIDDEN'],
    ['forced change', f => { f.state().account.passwordChangeRequired = true; }, 'FORBIDDEN'],
    ['missing CSRF', f => { delete f.proof.csrf; }, 'FORBIDDEN'],
    ['wrong CSRF', f => { f.proof.csrf = token(); }, 'FORBIDDEN'],
    ['invalid binding', f => { f.failures.binding = true; }, 'UNAVAILABLE'],
    ['invalid ownership', f => { f.failures.ownership = true; }, 'UNAVAILABLE'],
  ];
  for (const [name, change, status] of cases) await t.test(name, async () => {
    const f = fixture(); change(f);
    const before = structuredClone(f.state()); let calls = 0;
    await denies(f.service.runAuthorized(f.proof, 'administrator', async () => { calls++; }), status);
    assert.equal(calls, 0);
    assert.deepEqual(f.state(), before);
  });
});

test('MN00-AC02/04: policies, safe scope, shared transaction and post-success lifetime', async () => {
  for (const [role, policy] of [['administrator', 'administrator'], ['administrator', 'staff'], ['staff', 'staff']]) {
    const f = fixture(); f.state().account.role = role;
    let captured;
    const result = await f.service.runAuthorized(f.proof, policy, async scope => {
      captured = scope;
      assert.deepEqual(Object.keys(scope).sort(), ['actorId', 'installation', 'transaction']);
      assert.deepEqual(scope.installation, f.installation);
      assert.equal(scope.actorId, f.state().account.id);
      assert.deepEqual(Object.keys(scope.transaction), ['id']);
      transactionDatabase(scope.transaction).write('consumer write');
      return { saved: true };
    });
    assert.deepEqual(result, { saved: true });
    assert.deepEqual(f.state().writes, ['consumer write']);
    assert.deepEqual(f.state().session.lastActivityAt, f.now);
    assert.throws(() => transactionDatabase(captured.transaction), /Inactive transaction context/);
  }
  const f = fixture(); let called = false;
  await denies(f.service.runAuthorized(f.proof, 'public', async () => { called = true; }), 'FORBIDDEN');
  assert.equal(called, false);
});

test('MN00-AC04: consumer errors survive rollback unchanged; failed scope expires', async () => {
  class ConsumerConflict extends Error {}
  for (const expected of [new ConsumerConflict('map in consumer boundary'), new BadRequestException('private input detail'), new ConflictException('private conflict detail'), new Error('private storage detail'), undefined]) {
    const f = fixture(), before = structuredClone(f.state()); let scope;
    const result = await f.service.runAuthorized(f.proof, 'administrator', async value => {
      scope = value;
      transactionDatabase(scope.transaction).write('must roll back');
      throw expected;
    }).then(() => ({ resolved: true }), error => ({ error }));
    assert.equal(result.resolved, undefined);
    assert.equal(result.error, expected);
    assert.deepEqual(f.state(), before);
    assert.throws(() => transactionDatabase(scope.transaction), /Inactive transaction context/);
  }
});

test('MN00-AC01/04: begin, activity-write, commit and rollback failures fail closed', async () => {
  for (const mode of ['begin', 'activity', 'commit', 'rollback']) {
    const f = fixture(); let captured, calls = 0;
    f.failures[mode] = true;
    if (mode === 'activity') {
      const run = f.store.run;
      f.store.run = work => run(unit => work({ ...unit, saveSession: async () => { throw new Error('private activity failure'); } }));
    }
    await assert.rejects(f.service.runAuthorized(f.proof, 'administrator', async scope => {
      calls++; captured = scope.transaction;
      transactionDatabase(captured).write('write');
      if (mode === 'rollback') throw new ConflictException('must not hide rollback failure');
    }), error => error.reason === 'UNAVAILABLE' && error.message === 'Service unavailable');
    assert.equal(calls, ['begin', 'activity'].includes(mode) ? 0 : 1);
    if (captured) assert.throws(() => transactionDatabase(captured), /Inactive transaction context/);
  }
});

test('MN00-AC03 model only: serialized double holds callback until completion before revocation', async () => {
  const f = fixture(); let enter, release;
  const entered = new Promise(resolve => { enter = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const events = [];
  const write = f.service.runAuthorized(f.proof, 'administrator', async scope => {
    enter(); await gate;
    transactionDatabase(scope.transaction).write('accepted before revocation');
    events.push('write');
  });
  await entered;
  const revoke = f.store.run(async unit => {
    const session = await unit.getSession(digest(f.proof.session));
    await unit.saveSession({ ...session, revokedAt: f.now });
    events.push('revoke');
  });
  try {
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, []);
  } finally { release(); }
  await Promise.all([write, revoke]);
  assert.deepEqual(events, ['write', 'revoke']);
  let called = false;
  await denies(f.service.runAuthorized(f.proof, 'administrator', async () => { called = true; }), 'UNAUTHENTICATED');
  assert.equal(called, false);
});

test('MN00-AC05: public HTTP policy/proof surface and sanitized consumer errors', () => {
  class Consumer { write() {} }
  AccessEntry('administrator')(Consumer.prototype, 'write', Object.getOwnPropertyDescriptor(Consumer.prototype, 'write'));
  assert.equal(Reflect.getMetadata('access-entry', Consumer.prototype.write), 'administrator');
  assert.deepEqual(requestProof({ headers: { cookie: '__Host-session=session-proof', 'x-csrf-token': 'csrf-proof' } }), { session: 'session-proof', csrf: 'csrf-proof' });
  assert.throws(() => requestProof({ headers: { cookie: '__Host-session=one; __Host-session=two' } }), error => error.reason === 'INVALID_INPUT');
  for (const [error, status, message] of [[new BadRequestException('private'), 400, 'Invalid input'], [new ConflictException('private'), 409, 'Conflict'], [new Error('private'), 503, 'Service unavailable']]) {
    const response = { headers: {}, header(key, value) { this.headers[key] = value; return this; }, status(value) { this.code = value; return this; }, send(value) { this.body = value; } };
    new AccessExceptionFilter().catch(error, { switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => response }) });
    assert.deepEqual(response.body, { statusCode: status, message });
    assert.equal(response.headers['Cache-Control'], 'no-store');
  }
});

test('cashier authorization supplies current role and transaction-bound staff eligibility', async () => {
  const f = fixture();
  let eligible;
  await f.service.runCashierAuthorized(f.proof, 'staff', async scope => {
    assert.equal(scope.actorRole, 'administrator');
    assert.equal(await scope.staffEligible('admin-a'), true);
    assert.equal(await scope.staffEligible('missing'), false);
    f.state().account.status = 'disabled';
    assert.equal(await scope.staffEligible('admin-a'), false);
    f.state().account.status = 'active';
    f.state().account.branchIds = [];
    assert.equal(await scope.staffEligible('admin-a'), false);
    eligible = scope.staffEligible;
  });
  await assert.rejects(eligible('admin-a'), /Inactive transaction context/);
  const denied = fixture(); denied.proof.csrf = token();
  let called = false;
  await denies(denied.service.runCashierAuthorized(denied.proof, 'staff', async () => { called = true; }), 'FORBIDDEN');
  assert.equal(called, false);
});
