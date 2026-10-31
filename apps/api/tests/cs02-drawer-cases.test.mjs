import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrawerCases } from './cs02-drawer-cases.mjs';
import { DrawerService } from '../dist/cs02-check/modules/cashier-shifts/application/drawer.service.js';
import { syntheticFixtures } from './cs02-fixtures.mjs';

function setup() {
  const fixture = syntheticFixtures(), proofs = fixture.actors.map(id => ({ id }));
  const installation = { businessId: fixture.businesses[0], branchId: fixture.branches[0], business: { currencyCode: 'PKR' } };
  let state = { drawers: [], sessions: [], policy: undefined, events: [], retries: [], accounts: fixture.actors.map((id, i) => ({ id, status: 'active', role: i === 0 ? 'administrator' : 'staff' })) };
  const eligible = id => state.accounts.some(account => account.id === id && account.status === 'active');
  const account = proof => { const result = state.accounts.find(a => a.id === proof.id); if (!result || result.status !== 'active') throw Object.assign(new Error('denied'), { reason: 'UNAUTHENTICATED' }); return result; };
  const access = {
    async runCashierAuthorized(proof, required, work) {
      const actor = account(proof); if (required === 'administrator' && actor.role !== 'administrator') throw Object.assign(new Error('denied'), { reason: 'FORBIDDEN' });
      const before = structuredClone(state);
      try { return await work({ actorId: actor.id, actorRole: actor.role, installation, transaction: {}, staffEligible: async id => eligible(id) }); }
      catch (error) { state = before; throw error; }
    },
    async cashierReadContext(proof) { const actor = account(proof); return { actorId: actor.id, actorRole: actor.role, installation }; },
  };
  const store = {
    async drawer(_scope, id) { return state.drawers.find(row => row.id === id); },
    async drawerByLabel(_scope, label) { return state.drawers.find(row => row.label === label); },
    async drawers() { return state.drawers; },
    async insertDrawer(_scope, drawer) { state.drawers.push(drawer); },
    async session(scope, id) { return state.sessions.find(row => row.id === id && (!row.testScope ||
      (row.testScope.businessId === scope.businessId && row.testScope.branchId === scope.branchId))); },
    async current(_scope, actor) { return state.sessions.find(row => !row.closed && row.custodianId === actor); },
    async openForDrawer(_scope, drawer) { return state.sessions.find(row => !row.closed && row.drawerId === drawer); },
    async insertSession(_scope, session) { state.sessions.push(session); },
    async updateSession(_scope, next, expected) { const index = state.sessions.findIndex(row => row.id === next.id && row.revision === expected); if (index < 0) return false; state.sessions[index] = next; return true; },
    async policy() { return state.policy; }, async replacePolicy(_scope, change) { state.policy = change.next; return true; },
    async appendEvent(_scope, event) { state.events.push(event); },
    async retry(_scope, operation, key) { return state.retries.find(row => row.operation === operation && row.key === key); },
    async saveRetry(_scope, operation, key, data) { state.retries.push({ operation, key, ...structuredClone(data) }); },
  };
  const accessStore = { async run(work) { return work({ async findAccount(_business, selector) { return state.accounts.find(row => row.id === selector.id); },
    async saveAccount(updated) { const index = state.accounts.findIndex(row => row.id === updated.id); assert.ok(index >= 0); state.accounts[index] = updated; } }); } };
  const marks = [], runtime = { accessStore, drawerStore: store, drawers: new DrawerService(access, store) };
  const run = async (id, work) => { marks.push(['start', id]); await work(); marks.push(['end', id]); };
  let attempts = 0; const attempt = async work => { const result = await work(); attempts++; return result; };
  const contend = async (_target, _method, first, second) => {
    const outcomes = [];
    for (const work of [first, second]) {
      try { outcomes.push({ value: await work() }); } catch (error) { outcomes.push({ error }); }
    }
    return outcomes;
  };
  const seedForeign = async foreign => {
    state.drawers.push({ id: foreign.drawerId, label: 'Synthetic foreign drawer', testScope: foreign });
    state.sessions.push({ id: foreign.sessionId, drawerId: foreign.drawerId, custodianId: foreign.custodianId,
      testScope: foreign, closed: null });
  };
  return { fixture, proofs, runtime, other: runtime, run, attempt, contend, seedForeign, marks, attempts: () => attempts, state: () => state };
}

test('real drawer service executes cases in bounded order with independent write checkpoints', async () => {
  const f = setup(), result = await runDrawerCases(f);
  assert.deepEqual(f.marks, [['start', 'C01'], ['end', 'C01'], ['start', 'C04'], ['end', 'C04'], ['start', 'C05'], ['end', 'C05']]);
  assert.equal(f.attempts(), 24); // includes the independently certified foreign seed
  assert.equal(result.sessionA.status, 'closed'); assert.equal(result.sessionB.status, 'closed');
  assert.equal(result.sessionA.revision, 3); assert.equal(result.sessionB.revision, 1);
  assert.equal(f.state().accounts[2].status, 'active');
  assert.deepEqual(f.state().policy.replacementIds, []);
  assert.equal(f.state().events.filter(event => event.kind === 'movement').length, 2);
  assert.equal(f.state().events.filter(event => event.kind === 'close').length, 4);
  assert.equal(f.state().sessions.length, 5);
  assert.ok(f.state().retries.every(retry => f.fixture.operationKeys.slice(0, 20).includes(retry.key)));
});

test('case orchestration rejects a missing contender and a visible foreign session', async () => {
  const missing = setup(); missing.contend = async () => [{ value: {} }, {}];
  await assert.rejects(runDrawerCases(missing));
  const leaked = setup();
  const original = leaked.seedForeign;
  leaked.seedForeign = async foreign => {
    await original({ ...foreign, branchId: leaked.fixture.branches[0] });
  };
  await assert.rejects(runDrawerCases(leaked), /Missing expected rejection/);
});

test('case orchestration stops when checkpoint fails and does not start later cases', async () => {
  const f = setup(); let count = 0;
  f.attempt = async work => { const result = await work(); if (++count === 3) throw new Error('checkpoint failed'); return result; };
  await assert.rejects(runDrawerCases(f), /checkpoint failed/);
  assert.deepEqual(f.marks, [['start', 'C01']]);
});

test('case orchestration rejects duplicate operation keys before mutation', async () => {
  const f = setup(); f.fixture.operationKeys[1] = f.fixture.operationKeys[0];
  await assert.rejects(runDrawerCases(f)); assert.deepEqual(f.marks, []); assert.equal(f.attempts(), 0);
});
