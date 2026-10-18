import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { spawnSync } from 'node:child_process';
import { runRestartProbe } from './mn01-restart-operation.mjs';

const operationUrl = new URL('./mn01-restart-operation.mjs', import.meta.url).href;

test('restart failure signal: successful work and shutdown are required before success', async () => {
  const pool = new EventEmitter();
  const observations = [];
  pool.end = async () => { observations.push('pool closed'); };
  await runRestartProbe(pool, async () => {
    observations.push('GET passed');
    observations.push('POST passed');
  });
  observations.push('success');
  assert.deepEqual(observations, ['GET passed', 'POST passed', 'pool closed', 'success']);
});

for (const stage of ['requests', 'shutdown']) {
  test(`restart failure signal: idle error during ${stage} fails process despite successful requests`, () => {
    // Exercise the same lifecycle awaited by the real child, with no pg/config imports.
    const code = `
      import {EventEmitter} from 'node:events';
      import {runRestartProbe} from ${JSON.stringify(operationUrl)};
      const pool=new EventEmitter();
      const idleError=()=>pool.emit('error',new Error('SYNTHETIC_PRIVATE_DRIVER_DETAIL'));
      pool.end=async()=>{${stage === 'shutdown' ? 'idleError();' : ''}console.log('pool closed');};
      await runRestartProbe(pool,async()=>{
        ${stage === 'requests' ? 'idleError();' : ''}
        await Promise.resolve();
        console.log('GET and POST passed');
      });
      console.log('MN01 restart passed');
    `;
    const env = { ...process.env };
    for (const key of ['DATABASE_URL', 'MIGRATION_DATABASE_URL', 'MN01_ACCEPT_STAGING', 'MN01_TARGET']) delete env[key];
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { env, encoding: 'utf8', timeout: 5000 });
    assert.ifError(result.error);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /GET and POST passed/);
    assert.match(result.stdout, /pool closed/);
    assert.doesNotMatch(result.stdout, /MN01 restart passed/);
    assert.match(result.stderr, /Acceptance database connection failed/);
    assert.doesNotMatch(result.stderr, /SYNTHETIC_PRIVATE_DRIVER_DETAIL/);
  });
}

test('restart failure signal: work failures still close the pool and do not become success', async () => {
  const pool = new EventEmitter();
  let closed = false;
  pool.end = async () => { closed = true; };
  const failure = new Error('synthetic request failure');
  await assert.rejects(runRestartProbe(pool, async () => { throw failure; }), error => error === failure);
  assert.equal(closed, true);
});
