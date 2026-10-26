// Child entry is guarded before config, driver or application import.
import assert from 'node:assert/strict';
import { authorize } from './bp02-controls.mjs';
import { createHttp } from './bp02-runtime.mjs';
export async function checkHttp(http, runtime, input) {
  const read = await http.request(input.proof, 'GET', `/orders/${input.bill.orderId}/bill`);
  assert.equal(read.statusCode, 200); assert.deepEqual(read.json().data, input.bill);
  assert.equal(read.headers['cache-control'], 'no-store'); assert.equal(read.json().meta.requestId, read.headers['x-request-id']);
  const replay = await http.request(input.proof, 'POST', '/bills', input.request);
  assert.equal(replay.statusCode, 201); assert.deepEqual(replay.json().data, input.bill);
  assert.equal(replay.headers.location, `/api/v1/billing/orders/${input.bill.orderId}/bill`);
  for (const id of input.foreignIds) {
    const response = await http.request(input.proof, 'GET', `/orders/${id}/bill`);
    assert.equal(response.statusCode, 404); assert.equal(response.json().code, 'BILL_NOT_FOUND');
  }
  await assert.rejects(runtime.billing.replacePolicy(input.proof, input.retired), error => error.code === 'INVALID_BILLING_INPUT');
}
export async function childMain() {
  authorize(process.env, process.version); assert.equal(process.env.BP02_MODE, 'execute');
  let inputText = '';
  for await (const chunk of process.stdin) { inputText += chunk; assert.ok(Buffer.byteLength(inputText) <= 2097152); }
  const input = JSON.parse(inputText);
  const { Pool } = await import('pg');
  const { readConfiguration } = await import('../dist/billing-check/infrastructure/configuration.js');
  const { createRuntime } = await import('./bp02-runtime.mjs');
  const config = readConfiguration(process.env); assert.notEqual(config.environment, 'production');
  assert.equal(config.database.connectionString, config.migrationDatabase.connectionString);
  const pool = new Pool({ ...config.database, max: 1, connectionTimeoutMillis: 10000, query_timeout: 35000, options: '-c statement_timeout=30000 -c lock_timeout=20000' });
  let idleError = false, http;
  pool.on('error', () => { idleError = true; });
  try {
    const { identity, fingerprint } = await import('./bp02-controls.mjs');
    assert.equal(fingerprint(await identity(pool)), process.env.BP02_EXPECTED_TARGET);
    const runtime = await createRuntime(pool); http = await createHttp(runtime);
    await checkHttp(http, runtime, input);
  } finally { try { if (http) await http.app.close(); } finally { await pool.end(); } }
  assert.equal(idleError, false); console.log('BP02 restart passed');
}
if (process.argv[1] === new URL(import.meta.url).pathname) childMain().catch(() => { console.error('BP02 child failed'); process.exitCode = 1; });
