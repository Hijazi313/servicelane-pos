import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedBaseline, admitObservation, syntheticFixtures, cleanupAdmission, cases } from './bp02-plan.mjs';

test('BP02 exact source-derived migration plans have six/16 and seven/20 entries/tables', async () => {
  const pre = await expectedBaseline('pre-0006'), post = await expectedBaseline('post-0006');
  assert.equal(pre.history.length, 6); assert.equal(pre.tables.length, 16);
  assert.equal(post.history.length, 7); assert.equal(post.tables.length, 20);
  assert.deepEqual(post.history.slice(0, 6), pre.history);
  assert.deepEqual(post.tables.filter(name => !pre.tables.includes(name)), ['billing_policies', 'billing_policy_history', 'billing_settlements', 'business_display_history']);
  await assert.rejects(expectedBaseline('automatic'));
});
test('BP02 baseline refuses identity, history, schema/count and observer failures', async () => {
  const plan = await expectedBaseline('pre-0006'), fingerprint = 'a'.repeat(64);
  const observation = { stage: plan.stage, fingerprint, readOnly: true, distinctBackends: true,
    history: plan.history, counts: Object.fromEntries(plan.tables.map(table => [table, 0])), catalogVerified: true };
  assert.equal(admitObservation(plan, observation, fingerprint), true);
  const variants = [ { fingerprint: 'b'.repeat(64) }, { readOnly: false }, { distinctBackends: false }, { stage: 'post-0006' },
    { history: plan.history.slice(1) }, { history: [...plan.history, plan.history[0]] },
    { history: plan.history.map((row, i) => i ? row : { ...row, hash: '0'.repeat(64) }) },
    { counts: { ...observation.counts, billing_settlements: 0 } }, { counts: { ...observation.counts, orders: 1 } }, { catalogVerified: false } ];
  for (const variant of variants) assert.throws(() => admitObservation(plan, { ...observation, ...variant }, fingerprint));
  assert.throws(() => admitObservation(plan, observation));
});
test('BP02 synthetic fixture identities are disjoint and exact money oracle is independent', () => {
  const fixture = syntheticFixtures();
  const ids = [fixture.runId, ...fixture.businesses, ...fixture.branches, ...fixture.actors, ...fixture.orders, ...fixture.retryKeys, fixture.chargeId, fixture.taxId];
  assert.equal(new Set(ids).size, ids.length);
  const base = BigInt(fixture.merchandiseMinor), charge = BigInt(fixture.optionalChargeMinor);
  assert.equal(String(base + base / 10n), fixture.oracle.unselectedPayableMinor);
  assert.equal(String(base + charge + (base + charge) / 10n), fixture.oracle.selectedPayableMinor);
  assert.equal(cases.length, 7);
});
test('BP02 cleanup refuses changed ownership, unknown/missing rows and wrong target', () => {
  const row = { table: 'billing_settlements', key: 'synthetic-id', digest: 'c'.repeat(64) };
  const ledger = { runId: 'synthetic-run', target: 'target-fingerprint', baselineHash: 'baseline-hash', rows: [row] };
  const observation = { target: ledger.target, baselineHash: ledger.baselineHash, rows: [row] };
  assert.equal(cleanupAdmission(ledger, observation), true);
  for (const change of [{ target: 'other' }, { baselineHash: 'other' }, { rows: [] }, { rows: [row, row] },
    { rows: [{ ...row, digest: 'd'.repeat(64) }] }, { rows: [{ ...row, key: 'foreign' }] }]) {
    assert.throws(() => cleanupAdmission(ledger, { ...observation, ...change }));
  }
  assert.throws(() => cleanupAdmission({ ...ledger, rows: [row, row] }, observation));
  assert.throws(() => cleanupAdmission({ ...ledger, rows: [row, { ...row, key: 'second' }] }, { ...observation, rows: [row, row] }));
});
