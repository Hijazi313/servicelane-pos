// Orchestration only. This module has no environment or database side effects on import.
// An execution entry point must supply guarded baseline, ownership and cleanup callbacks.
import assert from 'node:assert/strict';
import { runDrawerCases } from './cs02-drawer-cases.mjs';
import { runBillingCases } from './cs02-billing-cases.mjs';
import { billingPolicy } from './cs02-fixtures.mjs';

const ids = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06'];

/**
 * A case is marked passed only after every committed transaction inside it has been
 * independently admitted and the full ledger checkpoint has succeeded. A failure
 * never authorizes cleanup by itself: only certifyCleanup may prove safe ownership.
 * All callbacks are explicit so an incomplete integration cannot accidentally execute.
 */
export async function executeCases({ runtime, other, fixture, proofs, capture, admit, checkpoint,
  contend, inject, seedForeign, seedLegacy, restart, certifyCleanup, cleanup, record,
  drawerCases = runDrawerCases, billingCases = runBillingCases }) {
  for (const [name, value] of Object.entries({ capture, admit, checkpoint, contend, inject,
    seedForeign, seedLegacy, restart, certifyCleanup, cleanup, record })) assert.equal(typeof value, 'function', `Missing ${name}`);
  assert.equal(proofs.length, 3);
  const completed = new Set();
  async function run(id, work) {
    assert.ok(ids.includes(id) && !completed.has(id));
    record(id, 'running');
    let captured;
    try {
      captured = await capture(work);
      assert.ok(captured && captured.outcome && Array.isArray(captured.expected) && Array.isArray(captured.access), 'Incomplete transaction capture');
      await admit(captured.expected, captured.access);
      await checkpoint();
      if (captured.outcome.error) throw captured.outcome.error;
      completed.add(id); record(id, 'passed');
      return captured.outcome.value;
    } catch (error) { record(id, 'failed'); throw error; }
  }
  const attempt = work => work();
  try {
    // Billing policy is an independently captured, certified setup mutation.
    const policy = await capture(() => runtime.billing.replacePolicy(proofs[0], billingPolicy(fixture)));
    assert.ok(policy && policy.outcome && Array.isArray(policy.expected) && Array.isArray(policy.access));
    await admit(policy.expected, policy.access); await checkpoint();
    if (policy.outcome.error) throw policy.outcome.error;
    await drawerCases({ runtime, other, fixture, proofs, run, attempt, contend, seedForeign });
    const saved = await billingCases({ runtime, other, fixture, proofs, run, attempt, contend, inject });
    const legacyCapture = await capture(() => seedLegacy());
    assert.ok(legacyCapture && legacyCapture.outcome && Array.isArray(legacyCapture.expected) && Array.isArray(legacyCapture.access));
    await admit(legacyCapture.expected, legacyCapture.access); await checkpoint();
    if (legacyCapture.outcome.error) throw legacyCapture.outcome.error;
    const legacy = legacyCapture.outcome.value;
    assert.ok(legacy?.request && legacy?.bill, 'Missing legacy replay fixture');
    record('C06', 'running');
    try {
      // Certify the parent read before the child updates the same session, otherwise
      // its captured timestamp is stale when independently checked after the child.
      const read = await capture(() => runtime.drawers.get(proofs[0], saved.savedRequest.sessionId));
      assert.ok(read && read.outcome && Array.isArray(read.expected) && Array.isArray(read.access));
      await admit(read.expected, read.access); await checkpoint();
      if (read.outcome.error) throw read.outcome.error;
      const result = await restart({ proof: proofs[0], request: saved.savedRequest, bill: saved.savedBill, session: read.outcome.value, legacy });
      assert.equal(result?.legacyReplayVerified, true, 'Legacy replay not verified');
      assert.equal(result?.accessMutationsCertified, true, 'Child access mutations not certified');
      completed.add('C06'); record('C06', 'passed');
    } catch (error) { record('C06', 'failed'); throw error; }
    assert.deepEqual([...completed].sort(), [...ids].sort(), 'Missing acceptance case');
  } finally {
    // Both calls are deliberately required even after failure; neither is allowed
    // to infer ownership from an assertion failure or an incomplete observation.
    if (await certifyCleanup()) await cleanup();
  }
}
