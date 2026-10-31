// Fresh-process verification; no configuration or connections at import time.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { authorize, identity, fingerprint } from './cs02-controls.mjs';

export async function checkHttp(http, input) {
  const bill = await http.request(input.proof, 'GET', `/billing/orders/${input.bill.orderId}/bill`);
  assert.equal(bill.statusCode, 200); assert.deepEqual(bill.json().data, input.bill);
  assert.equal(bill.headers['cache-control'], 'no-store');
  const replay = await http.request(input.proof, 'POST', '/billing/bills', input.request);
  assert.equal(replay.statusCode, 201); assert.deepEqual(replay.json().data, input.bill);
  assert.equal(replay.headers.location, `/api/v1/billing/orders/${input.bill.orderId}/bill`);
  const drawer = await http.request(input.proof, 'GET', `/cash-drawer-sessions/${input.session.id}`);
  assert.equal(drawer.statusCode, 200); assert.deepEqual(drawer.json().data, input.session);
  assert.equal(drawer.headers['cache-control'], 'no-store');
  assert.ok(input.legacy && input.legacy.bill && input.legacy.request, 'Legacy retry fixture required');
  const legacy = await http.request(input.proof, 'POST', '/billing/bills', input.legacy.request);
  assert.equal(legacy.statusCode, 201); assert.deepEqual(legacy.json().data, input.legacy.bill);
  assert.equal(legacy.headers.location, `/api/v1/billing/orders/${input.legacy.bill.orderId}/bill`);
}

// Captured values travel only over the private child stdout pipe to the parent;
// they must never be written to reports or logs. Only committed calls are returned.
export function captureSessionWrites(accessStore) {
  const original = accessStore.run, committed = [];
  accessStore.run = async function (work) {
    const pending = [];
    const result = await original.call(this, async unit => {
      const save = unit.saveSession.bind(unit);
      unit.saveSession = async session => { await save(session); pending.push(structuredClone(session)); };
      return work(unit);
    });
    committed.push(...pending.map(value => ({ type: 'session', value })));
    return result;
  };
  return committed;
}

export async function childMain() {
  authorize(process.env, process.version);
  assert.equal(process.env.CS02_MODE, 'execute');
  let raw = '';
  for await (const chunk of process.stdin) { raw += chunk; assert.ok(Buffer.byteLength(raw) <= 2097152); }
  const input = JSON.parse(raw);
  const { Pool } = await import('pg');
  const { readConfiguration } = await import('../dist/cs02-check/infrastructure/configuration.js');
  const { createRuntime, createHttp } = await import('./cs02-runtime.mjs');
  const config = readConfiguration(process.env);
  assert.notEqual(config.environment, 'production');
  assert.equal(config.database.connectionString, config.migrationDatabase.connectionString);
  const pool = new Pool({ ...config.database, max: 1, connectionTimeoutMillis: 10000,
    query_timeout: 35000, options: '-c statement_timeout=30000 -c lock_timeout=20000' });
  let idleError = false, http;
  pool.on('error', () => { idleError = true; });
  try {
    const client = await pool.connect();
    try {
      await client.query('begin read only');
      assert.equal(fingerprint(await identity(client)), process.env.CS02_EXPECTED_TARGET);
      await client.query('rollback');
    } finally { client.release(); }
    const runtime = await createRuntime(pool);
    const access = captureSessionWrites(runtime.accessStore);
    http = await createHttp(runtime);
    await checkHttp(http, input);
    assert.ok(access.length > 0, 'Expected committed session touches');
    console.log(JSON.stringify({ marker: 'CS02 restart passed', access }));
  } finally { try { if (http) await http.app.close(); } finally { await pool.end(); } }
  assert.equal(idleError, false);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  childMain().catch(() => { console.error('CS02 child failed'); process.exitCode = 1; });
}
