import test from 'node:test';
import assert from 'node:assert/strict';
import { contend } from './cs02-contention.mjs';

test('holds the first operation and passes its transaction to the contention observer', async () => {
  const events = [], target = { async write() { events.push('write'); return 1; } }, original = target.write;
  let releaseSecond;
  const blocked = new Promise(resolve => { releaseSecond = resolve; });
  const transaction = { id: 'synthetic transaction' };
  const result = await contend({ target, method: 'write', first: () => target.write(transaction),
    second: async () => { events.push('contender'); await blocked; return 2; },
    observe: async context => { assert.equal(context, transaction); await Promise.resolve(); assert.deepEqual(events, ['contender']); releaseSecond(); } });
  assert.deepEqual(result, [{ value: 1 }, { value: 2 }]);
  assert.deepEqual(events, ['contender', 'write']); assert.equal(target.write, original);
});

test('releases the holder and restores its method when observation fails', async () => {
  const target = { async write() { return 1; } }, original = target.write;
  await assert.rejects(contend({ target, method: 'write', first: () => target.write(),
    second: async () => new Promise(resolve => setTimeout(resolve, 2)), observe: async () => { throw new Error('not observed'); } }), /not observed/);
  assert.equal(target.write, original);
});
