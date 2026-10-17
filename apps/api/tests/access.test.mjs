import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { AccessService } from '../dist/ba02-check/modules/authentication/application/access.service.js';
import { digest, token } from '../dist/ba02-check/modules/authentication/application/access-policy.js';
const secret = 'a valid local password';
const replacement = 'a new valid local password';
const denies = (promise, status, message) => assert.rejects(promise, e => e.status === status && (!message || e.message === message));
function fixture() {
  const businessId = randomUUID(), branchId = randomUUID();
  let state = { accounts: new Map(), sessions: new Map(), prelogin: new Map(), limits: new Map(), events: [] };
  let clock = Date.UTC(2026, 9, 12), queue = Promise.resolve();
  const store = { failed: false, run(work) {
    const result = queue.then(async () => {
      if (store.failed) throw new Error('private database detail');
      const before = structuredClone(state);
      const unit = {
        context: { id: Symbol() },
        findAccount: async (bid, selector) => structuredClone([...state.accounts.values()].find(a => a.businessId === bid && (selector.id ? a.id === selector.id : a.username === selector.username))),
        listAccounts: async bid => structuredClone([...state.accounts.values()].filter(a => a.businessId === bid)),
        saveAccount: async a => { state.accounts.set(a.id, structuredClone(a)); },
        getSession: async key => structuredClone(state.sessions.get(key)),
        saveSession: async s => { state.sessions.set(s.digest, structuredClone(s)); },
        revokeSessions: async (id, now) => { for (const s of state.sessions.values()) if (s.accountId === id) s.revokedAt = now; },
        getPrelogin: async key => structuredClone(state.prelogin.get(key)),
        savePrelogin: async s => { state.prelogin.set(s.digest, structuredClone(s)); },
        deletePrelogin: async key => { state.prelogin.delete(key); },
        getLimit: async (kind, key) => structuredClone(state.limits.get(`${kind}:${key}`)),
        saveLimit: async l => { state.limits.set(`${l.kind}:${l.key}`, structuredClone(l)); },
        deleteLimit: async (kind, key) => { state.limits.delete(`${kind}:${key}`); },
        countLimits: async kind => [...state.limits.values()].filter(l => l.kind === kind).length,
        event: async e => { state.events.push(structuredClone(e)); },
      };
      try { return await work(unit); } catch (e) { state = before; throw e; }
    });
    queue = result.catch(() => {}); return result;
  } };
  const business = {
    resolveInstallationContext: async () => ({ businessId, branchId }),
    validateBranchOwnership: async (bid, branch) => { if (bid !== businessId || branch !== branchId) throw new Error('foreign ownership'); },
  };
  const hasher = { calls: [], hash: async p => { hasher.calls.push('hash'); return `hash:${p}`; }, verify: async (p, h) => { hasher.calls.push('verify'); return h === `hash:${p}`; }, dummy: async () => { hasher.calls.push('dummy'); return false; } };
  const service = new AccessService(store, business, hasher); service.now = () => new Date(clock);
  function account(patch = {}) {
    const a = { id: randomUUID(), businessId, username: `user${state.accounts.size}`, displayName: 'Staff', status: 'active', role: 'administrator', passwordChangeRequired: false, passwordHash: `hash:${secret}`, branchIds: [branchId], ...patch };
    state.accounts.set(a.id, a); return a;
  }
  async function pre() { const p = await service.bootstrap({}); return { prelogin: p.preloginToken, csrf: p.csrfToken }; }
  async function login(a, source = '127.0.0.1') { return service.login({ username: a.username, password: secret }, await pre(), source); }
  const proof = s => ({ session: s.sessionToken, csrf: s.csrfToken });
  return { service, store, business, hasher, businessId, branchId, account, pre, login, proof, state: () => state, advance: ms => { clock += ms; } };
}

test('staff lifecycle enforces roles, initial change, safe outputs and last administrator', async () => {
  const f = fixture(), admin = f.account(), session = await f.login(admin), p = f.proof(session);
  const staff = await f.service.create({ username: 'new.staff', role: 'staff', branchId: f.branchId, password: secret }, p);
  assert.equal(staff.passwordChangeRequired, true); assert.equal('passwordHash' in staff, false);
  const restricted = await f.login(staff), restrictedProof = f.proof(restricted);
  await denies(f.service.me(restrictedProof), 403);
  await denies(f.service.list(restrictedProof), 403);
  const changed = await f.service.changePassword({ currentPassword: secret, newPassword: replacement }, restrictedProof);
  assert.equal(changed.account.passwordChangeRequired, false);
  await denies(f.service.me(restrictedProof), 401);
  assert.equal((await f.service.me(f.proof(changed))).role, 'staff');
  await denies(f.service.create({ username: 'other', role: 'staff', branchId: f.branchId, password: secret }, f.proof(changed)), 403);
  await denies(f.service.patch(admin.id, { status: 'disabled' }, p), 409);
  assert.ok(f.state().events.some(e => e.action === 'staff.update' && e.success === false && e.actorId === admin.id && e.targetId === admin.id));
  await denies(f.service.patch(admin.id, { role: 'staff' }, p), 409);
  assert.equal(f.state().accounts.get(admin.id).status, 'active');
});

test('concurrent administrator removals cannot leave zero administrators', async () => {
  const f = fixture(), a = f.account(), b = f.account();
  const pa = f.proof(await f.login(a)), pb = f.proof(await f.login(b));
  const results = await Promise.allSettled([f.service.patch(a.id, { status: 'disabled' }, pa), f.service.patch(b.id, { status: 'disabled' }, pb)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal([...f.state().accounts.values()].filter(a => a.status === 'active' && a.role === 'administrator').length, 1);
});

test('unknown, disabled and wrong-password login are generic and consume identical account budgets', async () => {
  for (const mode of ['unknown', 'disabled', 'wrong']) {
    const f = fixture(), a = f.account({ status: mode === 'disabled' ? 'disabled' : 'active' });
    const input = { username: mode === 'unknown' ? 'missing' : a.username, password: mode === 'wrong' ? replacement : secret };
    const p = await f.pre();
    for (let i = 0; i < 5; i++) await denies(f.service.login(input, p, 'socket'), 401, 'Invalid credentials');
    await denies(f.service.login(input, p, 'socket'), 429);
    assert.equal(f.hasher.calls.length, 5);
    assert.equal(f.hasher.calls.every(c => c === (mode === 'wrong' ? 'verify' : 'dummy')), true);
    f.advance(15 * 60_000);
    await denies(f.service.login(input, await f.pre(), 'socket'), 401);
  }
});

test('source budget includes successful accounts and resets at exact window; capacity fails before hashing', async () => {
  const f = fixture(), a = f.account();
  for (let i = 0; i < 30; i++) await f.login(a, 'shared');
  await denies(f.login(a, 'shared'), 429);
  assert.equal(f.hasher.calls.length, 30);
  f.advance(60_000); await f.login(a, 'shared');
  const g = fixture();
  for (let i = 0; i < 10000; i++) g.state().limits.set(`account:${i}`, { kind: 'account', key: `${i}`, attempts: 1, expiresAt: new Date(g.service.now().getTime() + 900000) });
  await denies(g.service.login({ username: 'new.name', password: secret }, await g.pre(), 'socket'), 429);
  assert.equal(g.hasher.calls.length, 0);
  const h = fixture();
  for (let i = 0; i < 10000; i++) h.state().limits.set(`source:${i}`, { kind: 'source', key: `${i}`, attempts: 1, expiresAt: new Date(h.service.now().getTime() + 60000) });
  await denies(h.service.login({ username: 'new.name', password: secret }, await h.pre(), 'new socket'), 429);
  assert.equal(h.hasher.calls.length, 0);
});

test('CSRF proof, prelogin lifetime and single consumption protect login and logout', async () => {
  const f = fixture(), a = f.account(), p = await f.pre();
  await denies(f.service.login({ username: a.username, password: secret }, { ...p, csrf: token() }, 'socket'), 403);
  await denies(f.service.login({ username: a.username, password: secret }, { ...p, csrf: 'é'.repeat(43) }, 'socket'), 403);
  const session = await f.service.login({ username: a.username, password: secret }, p, 'socket');
  await denies(f.service.login({ username: a.username, password: secret }, p, 'socket'), 403);
  await denies(f.service.logout({ session: session.sessionToken }), 403);
  await f.service.logout(f.proof(session)); await f.service.logout(f.proof(session));
  await denies(f.service.me(f.proof(session)), 401);
  const expired = await f.pre(); f.advance(10 * 60_000);
  await denies(f.service.login({ username: a.username, password: secret }, expired, 'socket'), 403);
});

test('active logout rejects prelogin proof and only succeeds after server-side revocation', async () => {
  const f = fixture(), a = f.account(), session = await f.login(a), pre = await f.pre();
  for (const csrf of [pre.csrf, undefined, token(), 'é'.repeat(43)]) {
    await denies(f.service.logout({ session: session.sessionToken, prelogin: pre.prelogin, csrf }), 403);
    assert.equal((await f.service.me(f.proof(session))).id, a.id);
  }
  await f.service.logout({ ...f.proof(session), prelogin: pre.prelogin });
  await denies(f.service.me(f.proof(session)), 401);
  await f.service.logout(f.proof(session));
});

test('logout retains prelogin fallback for expired, revoked and absent sessions', async () => {
  for (const state of ['expired', 'revoked', 'absent']) {
    const f = fixture(), a = f.account(), session = await f.login(a);
    if (state === 'expired') f.advance(30 * 60_000);
    if (state === 'revoked') await f.service.logout(f.proof(session));
    const pre = await f.pre();
    await f.service.logout({ ...pre, ...(state === 'absent' ? {} : { session: session.sessionToken }) });
    if (state !== 'absent') await denies(f.service.me(f.proof(session)), 401);
  }
});

test('idle and absolute expiry reject exact boundaries even after activity', async () => {
  const f = fixture(), a = f.account(), s = await f.login(a), p = f.proof(s);
  f.advance(29 * 60_000); await f.service.me(p);
  f.advance(30 * 60_000); await denies(f.service.me(p), 401);
  const g = fixture(), b = g.account(), q = g.proof(await g.login(b));
  for (let i = 0; i < 24; i++) { g.advance(29 * 60_000); await g.service.me(q); }
  g.advance(24 * 60_000); await denies(g.service.me(q), 401);
});

test('password change rotates identity and revokes all other devices; reset and re-enable never resurrect sessions', async () => {
  const f = fixture(), admin = f.account(), staff = f.account({ role: 'staff' });
  const p = f.proof(await f.login(admin)); const one = await f.login(staff), two = await f.login(staff);
  const changed = await f.service.changePassword({ currentPassword: secret, newPassword: replacement }, f.proof(one));
  assert.notEqual(changed.sessionToken, one.sessionToken);
  await denies(f.service.me(f.proof(one)), 401); await denies(f.service.me(f.proof(two)), 401);
  await f.service.reset(staff.id, { password: secret }, p);
  await denies(f.service.me(f.proof(changed)), 401);
  assert.equal(f.state().accounts.get(staff.id).passwordChangeRequired, true);
  const current = await f.login(staff);
  await f.service.patch(staff.id, { status: 'disabled' }, p); await f.service.patch(staff.id, { status: 'active' }, p);
  await denies(f.service.authorize(f.proof(current), false, true), 401);
});

test('revocation while admin hash work is pending prevents mutation on transactional recheck', async () => {
  const f = fixture(), admin = f.account(), p = f.proof(await f.login(admin));
  let entered, resume;
  const pending = new Promise(r => { entered = r; });
  f.hasher.hash = async () => { entered(); await new Promise(r => { resume = r; }); return 'private-hash'; };
  const create = f.service.create({ username: 'race.staff', role: 'staff', branchId: f.branchId, password: secret }, p);
  await pending; await f.service.logout(p); resume();
  await denies(create, 401);
  assert.equal([...f.state().accounts.values()].some(a => a.username === 'race.staff'), false);
});

test('installation and branch boundaries deny foreign identities and grants', async () => {
  const f = fixture(), a = f.account(), s = await f.login(a), p = f.proof(s);
  const foreign = f.account({ businessId: randomUUID() });
  await denies(f.service.patch(foreign.id, { displayName: 'changed' }, p), 404);
  await denies(f.service.patch(a.id, { branchId: randomUUID() }, p), 404);
  f.state().sessions.get(digest(s.sessionToken)).businessId = randomUUID();
  await denies(f.service.me(p), 401);
  const g = fixture(), noGrant = g.account({ branchIds: [randomUUID()] });
  await denies(g.login(noGrant), 401);
});

test('local recovery revokes old credentials and sessions, restricts replacement, and outage fails closed', async () => {
  const f = fixture(), a = f.account(), s = await f.login(a);
  await f.service.recover(f.businessId, a.id, replacement, 'local-operator');
  await denies(f.service.me(f.proof(s)), 401); await denies(f.login(a), 401);
  const result = await f.service.login({ username: a.username, password: replacement }, await f.pre(), 'socket');
  assert.equal(result.account.passwordChangeRequired, true); await denies(f.service.me(f.proof(result)), 403);
  assert.ok(f.state().events.some(e => e.action === 'operator.recover' && e.operator === 'local-operator'));
  const staff = f.account({ role: 'staff' });
  await denies(f.service.recover(f.businessId, staff.id, replacement, 'local-operator'), 404);
  await denies(f.service.recover(randomUUID(), a.id, replacement, 'local-operator'), 404);
  f.store.failed = true;
  await denies(f.service.me(f.proof(result)), 503, 'Service unavailable');
  await denies(f.service.login({ username: a.username, password: replacement }, {}, 'socket'), 503, 'Service unavailable');
});


test('parallel login reservations count pending work before password verification', async () => {
  const f = fixture(), a = f.account(), p = await f.pre();
  let release;
  const gate = new Promise(r => { release = r; });
  const entered = [];
  f.hasher.verify = async () => { entered.push(true); await gate; return false; };
  const attempts = Array.from({ length: 6 }, () => f.service.login({ username: a.username, password: replacement }, p, 'shared'));
  // Observe completion of the rejected sixth reservation while the first five hashes remain pending.
  const first = await Promise.race(attempts.map(p => p.then(() => 200, e => e.status)));
  assert.equal(first, 429); assert.equal(entered.length, 5);
  release();
  const results = await Promise.allSettled(attempts);
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.status === 401).length, 5);
});

test('unchanged temporary passwords cannot clear forced change or revoke sessions', async () => {
  for (const role of ['administrator', 'staff']) {
    const f = fixture(), a = f.account({ role, passwordChangeRequired: true });
    const session = await f.login(a), other = await f.login(a), before = structuredClone(f.state().accounts.get(a.id));
    await denies(f.service.changePassword({ currentPassword: secret, newPassword: secret }, f.proof(session)), 400);
    assert.deepEqual(f.state().accounts.get(a.id), before);
    await f.service.authorize(f.proof(session), false, true);
    await f.service.authorize(f.proof(other), false, true);
    await denies(f.service.me(f.proof(session)), 403);
    const changed = await f.service.changePassword({ currentPassword: secret, newPassword: replacement }, f.proof(session));
    assert.equal((await f.service.me(f.proof(changed))).passwordChangeRequired, false);
    await denies(f.service.me(f.proof(other)), 401);
  }
});

test('successful login preserves other pending attempts and the shared account cap', async () => {
  const f = fixture(), a = f.account(), waiting = [], jobs = [];
  f.hasher.verify = async () => new Promise(resolve => waiting.push(resolve));
  async function start() {
    const pre = await f.pre();
    const job = f.service.login({ username: a.username, password: secret }, pre, 'shared').then(value => ({ value }), error => ({ error }));
    jobs.push(job); return { job };
  }
  try {
    for (let i = 0; i < 5; i++) await start();
    for (let i = 0; i < 100 && waiting.length < 5; i++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(waiting.length, 5);
    waiting[0](true); assert.ok((await jobs[0]).value);
    assert.equal(f.state().limits.get(`account:${digest(a.username)}`)?.attempts, 4);
    await start();
    for (let i = 0; i < 100 && waiting.length < 6; i++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(waiting.length, 6);
    let outcome;
    const excess = await start(); excess.job.then(value => { outcome = value; });
    for (let i = 0; i < 100 && !outcome && waiting.length < 7; i++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(waiting.length, 6, 'excess attempt must not enter password verification');
    assert.equal(outcome?.error?.status, 429);
  } finally {
    for (const resolve of waiting.slice(1)) resolve(false);
    await Promise.all(jobs);
  }
  assert.equal(f.state().limits.get(`account:${digest(a.username)}`)?.attempts, 5);
});

test('hashing errors and rejected login completion settle only their own reservations', async () => {
  for (const mode of ['hash-error', 'consumed-csrf', 'transaction-rollback']) {
    const f = fixture(), a = f.account(), pre = await f.pre();
    if (mode === 'hash-error') f.hasher.verify = async () => { throw new Error('Hash unavailable'); };
    if (mode === 'consumed-csrf') f.hasher.verify = async () => { f.state().prelogin.clear(); return true; };
    if (mode === 'transaction-rollback') {
      f.hasher.verify = async () => { f.business.validateBranchOwnership = async () => { throw new Error('Ownership unavailable'); }; return true; };
    }
    await denies(f.service.login({ username: a.username, password: secret }, pre, 'socket'), mode === 'consumed-csrf' ? 403 : 503);
    const limit = f.state().limits.get(`account:${digest(a.username)}`);
    assert.equal(limit.attempts, 1);
    assert.deepEqual(limit.pendingIds, []);
    assert.equal(f.state().sessions.size, 0);
  }
});

test('late attempt settlement cannot overwrite a newer throttle window', async () => {
  const f = fixture(), a = f.account(), waiting = [];
  f.hasher.verify = async () => new Promise(resolve => waiting.push(resolve));
  const older = f.service.login({ username: a.username, password: secret }, await f.pre(), 'socket').catch(error => error);
  for (let i = 0; i < 100 && waiting.length < 1; i++) await new Promise(resolve => setImmediate(resolve));
  f.advance(15 * 60_000);
  const newer = f.service.login({ username: a.username, password: secret }, await f.pre(), 'socket');
  for (let i = 0; i < 100 && waiting.length < 2; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(waiting.length, 2);
  const before = structuredClone(f.state().limits.get(`account:${digest(a.username)}`));
  waiting[0](false); assert.equal((await older).status, 401);
  assert.deepEqual(f.state().limits.get(`account:${digest(a.username)}`), before);
  waiting[1](true); await newer;
  assert.equal(f.state().limits.has(`account:${digest(a.username)}`), false);
});

test('lost commit acknowledgement does not settle another attempt twice', async () => {
  const f = fixture(), a = f.account(), waiting = [];
  f.hasher.verify = async () => new Promise(resolve => waiting.push(resolve));
  const run = f.store.run.bind(f.store); let loseAck = true;
  f.store.run = async work => {
    const value = await run(work);
    if (loseAck && value?.sessionToken) { loseAck = false; throw new Error('Commit acknowledgement lost'); }
    return value;
  };
  const one = f.service.login({ username: a.username, password: secret }, await f.pre(), 'socket').catch(error => error);
  const two = f.service.login({ username: a.username, password: secret }, await f.pre(), 'socket').catch(error => error);
  for (let i = 0; i < 100 && waiting.length < 2; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(waiting.length, 2);
  waiting[0](true); assert.equal((await one).status, 503);
  const limit = f.state().limits.get(`account:${digest(a.username)}`);
  assert.equal(limit.attempts, 1); assert.equal(limit.pendingIds.length, 1);
  waiting[1](false); assert.equal((await two).status, 401);
  assert.equal(f.state().limits.get(`account:${digest(a.username)}`).attempts, 1);
  assert.deepEqual(f.state().limits.get(`account:${digest(a.username)}`).pendingIds, []);
});
