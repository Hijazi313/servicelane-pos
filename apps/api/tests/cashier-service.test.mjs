import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { DrawerService } from '../dist/cashier-check/modules/cashier-shifts/application/drawer.service.js';
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
function fixture() {
  const installation = { businessId: id(1), branchId: id(2), business: { currencyCode: 'PKR' } };
  let state = { drawers: [], sessions: [], policy: undefined, events: [], retries: [] };
  let actor = id(3), role = 'administrator', failEvent = false, active = true, eligible = true;
  const access = {
    async runCashierAuthorized(proof, required, work) {
      if (!active || (required === 'administrator' && role !== 'administrator')) throw Error('forbidden');
      const before = structuredClone(state);
      try { return await work({ actorId: actor, actorRole: role, installation, transaction: {}, staffEligible: async target => eligible && target === id(4) }); }
      catch (error) { state = before; throw error; }
    },
    async cashierReadContext() { return { actorId: actor, actorRole: role, installation }; },
  };
  const store = {
    async drawers() { return [...state.drawers].sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)); },
    async drawer(_s, key) { return state.drawers.find(d => d.id === key); },
    async drawerByLabel(_s, label) { return state.drawers.find(d => d.label === label); },
    async insertDrawer(_s, drawer) { state.drawers.push(drawer); },
    async session(_s, key) { return state.sessions.find(d => d.id === key); },
    async current(_s, target) { return state.sessions.find(d => !d.closed && d.custodianId === target); },
    async openForDrawer(_s, key) { return state.sessions.find(d => !d.closed && d.drawerId === key); },
    async insertSession(_s, session) { state.sessions.push(session); },
    async updateSession(_s, next, expected) { const index = state.sessions.findIndex(d => d.id === next.id && d.revision === expected); if (index < 0) return false; state.sessions[index] = next; return true; },
    async policy() { return state.policy; },
    async replacePolicy(_s, change) { state.policy = change.next; return true; },
    async appendEvent(_s, event) { if (failEvent) throw Error('failure'); state.events.push(event); },
    async retry(_s, operation, key) { return state.retries.find(r => r.operation === operation && r.key === key); },
    async saveRetry(_s, operation, key, data) { state.retries.push({ operation, key, ...structuredClone(data) }); },
  };
  return { service: new DrawerService(access, store), state: () => state,
    actor: (next, nextRole = 'staff') => { actor = next; role = nextRole; }, failEvent: flag => { failEvent = flag; },
    active: flag => { active = flag; }, eligible: flag => { eligible = flag; } };
}
const rejects = (promise, code) => assert.rejects(promise, error => error.code === code);
async function setup(f) {
  await f.service.replacePolicy({}, { selfClose: true, replacementClose: false, replacementStaffIds: [], expectedRevision: 0, note: 'Initial policy' });
  const drawer = await f.service.createDrawer({}, { label: 'Drawer A', retryKey: id(10) });
  const session = await f.service.open({}, drawer.id, { openingMinor: '1000', retryKey: id(11) });
  return { drawer, session };
}
test('retry, movements, handover and close preserve exact accountability', async () => {
  const f = fixture(); const { drawer, session } = await setup(f);
  assert.deepEqual(await f.service.listDrawers({}), [drawer]);
  assert.deepEqual(await f.service.open({}, drawer.id, { openingMinor: '1000', retryKey: id(11) }), session);
  await rejects(f.service.open({}, drawer.id, { openingMinor: '1001', retryKey: id(11) }), 'RETRY_CONFLICT');
  const movement = await f.service.move({}, session.id, { direction: 'out', amountMinor: '100', reason: 'Safe drop', expectedRevision: 0, retryKey: id(12) });
  await rejects(f.service.open({}, drawer.id, { openingMinor: '0', retryKey: id(17) }), 'DRAWER_BUSY');
  const pending = await f.service.beginHandover({}, session.id, { recipientStaffId: id(4), expectedRevision: 1, retryKey: id(13) });
  assert.equal(pending.pendingHandover.recipientStaffId, id(4));
  await rejects(f.service.move({}, session.id, { direction: 'in', amountMinor: '10', reason: 'Float', expectedRevision: 2, retryKey: id(14) }), 'HANDOVER_PENDING');
  f.actor(id(4));
  const accepted = await f.service.acceptHandover({}, session.id, pending.pendingHandover.id, { countedMinor: '800', varianceReason: 'Count difference', expectedRevision: 2, retryKey: id(15) });
  assert.equal(accepted.currentCustodianId, id(4));
  const closed = await f.service.close({}, session.id, { countedMinor: '800', varianceReason: 'Count difference', expectedRevision: 3, retryKey: id(16) });
  assert.equal(closed.closed.expectedMinor, '900'); assert.equal(closed.closed.varianceMinor, '-100');
  assert.equal(await f.service.current({}), null);
  assert.equal(f.state().events.find(e => e.kind === 'handover-accept').payload.initiatorId, id(3));
  f.actor(id(3));
  assert.deepEqual(await f.service.move({}, session.id, { direction: 'out', amountMinor: '100', reason: 'Safe drop', expectedRevision: 0, retryKey: id(12) }), movement);
  assert.equal(f.state().events.filter(e => e.kind === 'movement').length, 1);
  f.active(false);
  await assert.rejects(f.service.move({}, session.id, { direction: 'out', amountMinor: '100', reason: 'Safe drop', expectedRevision: 0, retryKey: id(12) }));
});
test('recipient eligibility and administrator-initiated handover retain actual acknowledgments', async () => {
  const f = fixture(); const { session } = await setup(f);
  f.eligible(false);
  await rejects(f.service.beginHandover({}, session.id, { recipientStaffId: id(4), expectedRevision: 0, retryKey: id(25) }), 'INVALID_RECIPIENT');
  f.eligible(true); f.actor(id(6), 'administrator');
  const pending = await f.service.beginHandover({}, session.id, { recipientStaffId: id(4), expectedRevision: 0, retryKey: id(25) });
  const started = f.state().events.find(e => e.kind === 'handover-start');
  assert.equal(started.actorId, id(6)); assert.equal(started.payload.outgoingAcknowledged, false);
  f.actor(id(4)); f.active(false);
  await assert.rejects(f.service.acceptHandover({}, session.id, pending.pendingHandover.id, { countedMinor: '1000', varianceReason: null, expectedRevision: 1, retryKey: id(26) }));
  assert.equal(f.state().sessions[0].custodianId, id(3));
  f.active(true);
  const accepted = await f.service.acceptHandover({}, session.id, pending.pendingHandover.id, { countedMinor: '1000', varianceReason: null, expectedRevision: 1, retryKey: id(26) });
  assert.equal(accepted.currentCustodianId, id(4));
  const event = f.state().events.find(e => e.kind === 'handover-accept');
  assert.equal(event.payload.reason, null); assert.equal(event.payload.varianceMinor, '0');
});
test('authorization, scope, state and failed event rollback are enforced in model', async () => {
  const f = fixture(); const { session } = await setup(f);
  f.actor(id(5)); await rejects(f.service.get({}, session.id), 'DRAWER_NOT_FOUND');
  await rejects(f.service.beginHandover({}, session.id, { recipientStaffId: id(4), expectedRevision: 0, retryKey: id(20) }), 'FORBIDDEN');
  f.eligible(false);
  await rejects(f.service.beginHandover({}, session.id, { recipientStaffId: id(4), expectedRevision: 0, retryKey: id(20) }), 'FORBIDDEN');
  f.actor(id(3), 'administrator'); f.failEvent(true);
  await assert.rejects(f.service.move({}, session.id, { direction: 'in', amountMinor: '5', reason: 'Float', expectedRevision: 0, retryKey: id(21) }));
  assert.equal(f.state().sessions[0].revision, 0); assert.equal(f.state().retries.some(r => r.key === id(21)), false);
});

test('drawer discovery is bounded and creation stops at the branch capacity', async () => {
  const f = fixture();
  for (let n = 0; n < 100; n++) f.state().drawers.push({ id: id(100 + n), label: `Drawer ${String(n).padStart(3, '0')}` });
  assert.equal((await f.service.listDrawers({})).length, 100);
  await rejects(f.service.createDrawer({}, { label: 'Overflow', retryKey: id(500) }), 'DRAWER_CAPACITY');
  assert.equal(f.state().drawers.length, 100);
});
