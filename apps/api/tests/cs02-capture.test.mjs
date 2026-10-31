import test from 'node:test';
import assert from 'node:assert/strict';
import { captureWrites } from './cs02-capture.mjs';

test('captures only projected successful writes and restores original methods', async () => {
  const target = { async insert(row) { return row.id; } }, original = target.insert;
  const result = await captureWrites([{ target, method: 'insert', project: ([row], id) => ({ id, amount: row.amount }) }], async () => {
    const row = { id: 'synthetic', amount: '10', secret: 'not recorded' };
    await target.insert(row); row.amount = '20'; return 'done';
  });
  assert.deepEqual(result, { value: 'done', observed: [{ id: 'synthetic', amount: '10' }] });
  assert.equal(target.insert, original);
});
test('failed operation and duplicate hook never return a captured success and restore methods', async () => {
  const target = { async insert() {} }, original = target.insert, hook = { target, method: 'insert', project: () => ({}) };
  await assert.rejects(captureWrites([hook], async () => { await target.insert(); throw Error('rollback'); }), /rollback/);
  assert.equal(target.insert, original);
  await assert.rejects(captureWrites([hook, hook], async () => {}), /Duplicate/);
  assert.equal(target.insert, original);
});
