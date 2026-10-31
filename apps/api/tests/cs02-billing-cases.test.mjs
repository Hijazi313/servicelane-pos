import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticFixtures } from './cs02-fixtures.mjs';
import { runBillingCases } from './cs02-billing-cases.mjs';

function harness() {
  const fixture = syntheticFixtures(), proofs = [{ actor: fixture.actors[0] }, { actor: fixture.actors[1] }];
  let drawers = new Map(), bills = new Map(), events = [], sequence = 0;
  const stats = { cases: [], injected: [], contention: [], attempts: 0 };
  const error = code => Object.assign(new Error(code), { code });
  const store = {
    async insert(_scope, record) { bills.set(record.bill.orderId, structuredClone(record)); },
    async forOrder(_scope, id) { return bills.get(id); },
  };
  const drawerStore = {
    async updateSession(_scope, next) { drawers.set(next.id, structuredClone(next)); return true; },
    async appendEvent(_scope, event) { events.push(event); },
  };
  const drawerApi = {
    async createDrawer(_proof, input) { return { id: `drawer-${++sequence}`, label: input.label }; },
    async open(_proof, drawerId) { const s = { id: `session-${++sequence}`, drawerId, revision: 0, status: 'open', sales: 0, pendingHandover: null }; drawers.set(s.id, s); return structuredClone(s); },
    async get(_proof, id) { return structuredClone(drawers.get(id)); },
    async close(_proof, id, input) {
      const s = drawers.get(id); if (input.expectedRevision !== s.revision) throw error('STALE_DRAWER');
      const next = { ...s, status: 'closed', revision: s.revision + 1, closed: { expectedMinor: String(1000 + s.sales), varianceMinor: '0' } };
      await drawerStore.updateSession({}, next); await drawerStore.appendEvent({}, { kind: 'close' }); return structuredClone(next);
    },
    async beginHandover(_proof, id, input) {
      const s = drawers.get(id); if (input.expectedRevision !== s.revision) throw error('STALE_DRAWER');
      const next = { ...s, revision: s.revision + 1, pendingHandover: { id: `handover-${++sequence}` } };
      await drawerStore.updateSession({}, next); await drawerStore.appendEvent({}, { kind: 'handover-start' }); return structuredClone(next);
    },
    async cancelHandover(_proof, id, _handoverId, input) {
      const s = drawers.get(id); assert.equal(input.expectedRevision, s.revision);
      const next = { ...s, revision: s.revision + 1, pendingHandover: null };
      await drawerStore.updateSession({}, next); await drawerStore.appendEvent({}, { kind: 'handover-cancel' }); return structuredClone(next);
    },
  };
  const billing = {
    async assess(_proof, input) { return { currencyCode: 'PKR', scale: 2, payableMinor: '10000', billingPolicy: { revision: 1 }, businessDisplay: { revision: 0 } }; },
    async settle(_proof, request) {
      const prior = bills.get(request.orderId); if (prior) return structuredClone(prior.bill);
      const s = drawers.get(request.sessionId); if (s.status !== 'open' || s.pendingHandover) throw error('CASH_DRAWER_CONFLICT');
      const saved = structuredClone({ drawers: [...drawers], bills: [...bills], events });
      try {
        await drawerStore.updateSession({}, { ...s, revision: s.revision + 1, sales: s.sales + 10000 });
        await drawerStore.appendEvent({}, { kind: 'cash-sale' });
        const bill = { id: `bill-${++sequence}`, orderId: request.orderId, payment: { amountMinor: '10000' } };
        await store.insert({}, { bill, request }); return bill;
      } catch (e) { drawers = new Map(saved.drawers); bills = new Map(saved.bills); events = saved.events; throw e; }
    },
  };
  const runtime = { drawers: drawerApi, billing, drawerStore, store }, other = { drawers: drawerApi, billing };
  const attempt = async work => { stats.attempts++; return work(); };
  const run = async (id, work) => { stats.cases.push(id); await work(); };
  const inject = async (target, method, work) => {
    const original = target[method]; let invoked = false;
    target[method] = async function (...args) { const result = await original.apply(this, args); invoked = true; throw error('INJECTED'); };
    try { await assert.rejects(work, code => code.code === 'INJECTED'); assert.ok(invoked); stats.injected.push(method); }
    finally { target[method] = original; }
  };
  const contend = async (target, method, first, second) => {
    stats.contention.push(method); const result = [];
    for (const work of [first, second]) { try { result.push({ value: await work() }); } catch (e) { result.push({ error: e }); } }
    return result;
  };
  return { fixture, proofs, runtime, other, attempt, run, inject, contend, stats };
}

test('orchestration covers three injected write points and four race directions', async () => {
  const h = harness(); const result = await runBillingCases(h);
  assert.deepEqual(h.stats.cases, ['C02', 'C03']);
  assert.deepEqual(h.stats.injected, ['updateSession', 'appendEvent', 'insert']);
  assert.deepEqual(h.stats.contention, ['updateSession', 'updateSession', 'updateSession', 'updateSession']);
  assert.ok(h.stats.attempts > 20); assert.equal(result.savedBill.orderId, result.savedRequest.orderId);
});
test('orchestration refuses to mark a case successful when a contending outcome is missing', async () => {
  const h = harness(); h.contend = async () => [{ value: {} }, {}];
  await assert.rejects(runBillingCases(h), /Expected STALE_DRAWER/);
});
