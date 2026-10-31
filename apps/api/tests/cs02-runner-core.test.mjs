import test from 'node:test';
import assert from 'node:assert/strict';
import { executeCases } from './cs02-runner-core.mjs';

const fixture = { businesses: ['b'], branches: ['x'], actors: ['a', 'b', 'c'], operationKeys: Array.from({ length: 48 }, (_, i) => `key-${i}`), runId: 'synthetic' };
function harness() {
  const stages = [];
  return { stages, runtime: { billing: { replacePolicy: async () => ({}) } }, other: {}, fixture, proofs: [{}, {}, {}],
    capture: async work => { try { return { outcome: { value: await work() }, expected: [], access: [] }; }
      catch (error) { return { outcome: { error }, expected: [], access: [] }; } },
    admit: async () => { stages.push('admit'); }, checkpoint: async () => { stages.push('checkpoint'); },
    contend: async () => {}, inject: async () => {}, seedForeign: async () => {}, seedLegacy: async () => {}, restart: async () => {},
    certifyCleanup: async () => { stages.push('certify'); return false; }, cleanup: async () => { stages.push('cleanup'); },
    record: (id, status) => { stages.push(`${id}:${status}`); } };
}

test('rejects incomplete safety callbacks before any mutation', async () => {
  const h = harness(); delete h.admit;
  await assert.rejects(executeCases(h), /Missing admit/); assert.deepEqual(h.stages, []);
});

test('failure does not make a case pass or allow uncertified cleanup', async () => {
  const h = harness(); h.runtime.drawers = { replacePolicy: async () => { throw new Error('synthetic failure'); } };
  await assert.rejects(executeCases(h), /synthetic failure/);
  assert.deepEqual(h.stages, ['admit', 'checkpoint', 'C01:running', 'admit', 'checkpoint', 'C01:failed', 'certify']);
});

test('cleanup runs only when ownership certification explicitly passes', async () => {
  const h = harness(); h.runtime.drawers = { replacePolicy: async () => { throw new Error('synthetic failure'); } };
  h.certifyCleanup = async () => { h.stages.push('certify'); return true; };
  await assert.rejects(executeCases(h), /synthetic failure/); assert.equal(h.stages.at(-1), 'cleanup');
});

test('C06 cannot pass without independently certified legacy replay and child access mutations', async () => {
  const h = harness();
  h.runtime.drawers = { get: async () => ({ id: 'drawer' }) };
  h.drawerCases = async ({ run }) => { for (const id of ['C01', 'C04', 'C05']) await run(id, async () => {}); };
  h.billingCases = async ({ run }) => {
    for (const id of ['C02', 'C03']) await run(id, async () => {});
    return { savedRequest: { sessionId: 'drawer' }, savedBill: { id: 'bill' } };
  };
  h.seedLegacy = async () => ({ request: {}, bill: {} });
  h.restart = async () => ({ legacyReplayVerified: true, accessMutationsCertified: false });
  await assert.rejects(executeCases(h), /Child access mutations not certified/);
  assert.ok(h.stages.includes('C06:failed')); assert.ok(!h.stages.includes('C06:passed'));
});
