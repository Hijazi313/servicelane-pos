import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { runChild } from './cs02-child.mjs';
function spawn(marker) {
  return () => {
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    child.stdin = new EventEmitter(); child.stdin.end = () => { if (marker) setImmediate(() => { child.stdout.emit('data', marker); child.emit('close', 0); }); };
    child.kill = () => { setImmediate(() => child.emit('close', null)); return true; }; return child;
  };
}
test('child requires exact success marker and kills and joins a timed-out process', async () => {
  assert.deepEqual(await runChild(spawn(JSON.stringify({ marker: 'CS02 restart passed', access: [{ type: 'session', value: { digest: 'synthetic' } }] })), 'node', 'restart', {}, {}, 50), { exit: 0, marker: 'CS02 restart passed', access: [{ type: 'session', value: { digest: 'synthetic' } }] });
  await assert.rejects(runChild(spawn('wrong'), 'node', 'restart', {}, {}, 50), /CS02_CHILD_FAILED/);
  await assert.rejects(runChild(spawn(), 'node', 'restart', {}, {}, 10), /CS02_CHILD_TIMEOUT/);
});
