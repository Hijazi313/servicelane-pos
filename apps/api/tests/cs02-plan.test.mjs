import test from 'node:test';
import assert from 'node:assert/strict';
import { admitObservation, expectedBaseline } from './cs02-plan.mjs';

test('manifest derives the exact pre- and post-0007 history and schema from tracked migration sources', async () => {
  const before = await expectedBaseline('pre-0007'), after = await expectedBaseline('post-0007');
  assert.equal(before.history.length, 7); assert.equal(after.history.length, 8);
  assert.equal(before.tables.length, 20); assert.equal(after.tables.length, 26);
  assert.deepEqual(after.history.slice(0, 7), before.history);
  assert.deepEqual(after.tables.filter(table => !before.tables.includes(table)), ['cash_drawer_events', 'cash_drawer_policies', 'cash_drawer_policy_history', 'cash_drawer_retries', 'cash_drawer_sessions', 'cash_drawers']);
});
test('admission rejects changed target, history, schema, data or missing read-only catalog proof', async () => {
  const expected = await expectedBaseline('pre-0007'), fingerprint = 'a'.repeat(64);
  const valid = { stage: expected.stage, fingerprint, history: expected.history, readOnly: true, distinctBackends: true,
    counts: Object.fromEntries(expected.tables.map(table => [table, 0])), catalogVerified: true };
  assert.equal(admitObservation(expected, valid, fingerprint), true);
  for (const change of [{ fingerprint: 'b'.repeat(64) }, { stage: 'post-0007' }, { readOnly: false },
    { distinctBackends: false }, { history: [] }, { counts: {} }, { counts: { ...valid.counts, branches: 1 } }, { catalogVerified: false }]) {
    assert.throws(() => admitObservation(expected, { ...valid, ...change }, fingerprint));
  }
  assert.throws(() => admitObservation(expected, valid, ''));
});
