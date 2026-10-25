// Manual fresh process only; no provisioning, migration, listener or cleanup.
import { authorize } from './kt01-controls.mjs';
try { authorize(process.env, process.version); if (process.env.KT01_MODE !== 'execute') throw new Error(); }
catch { console.error('KT-01 restart requires separate execution permission'); process.exit(1); }
try {
  const { default: assert } = await import('node:assert/strict');
  let bytes = 0; const chunks = [];
  for await (const chunk of process.stdin) { bytes += chunk.length; if (bytes > 8 * 1024 * 1024) throw new Error(); chunks.push(chunk); }
  const { proof, expected, orderId, foreignTicketId } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  assert.equal(expected.length, 5);
  const { Pool } = await import('pg'); const { readConfiguration } = await import('../dist/orders-check/infrastructure/configuration.js');
  const { createRuntime, createHttp } = await import('./kt01-runtime.mjs'); const { runRestartProbe } = await import('./mn01-restart-operation.mjs');
  const config = readConfiguration(process.env);
  const pool = new Pool({ ...config.database, max: 1, connectionTimeoutMillis: 10000, options: '-c statement_timeout=15000 -c lock_timeout=10000' });
  await runRestartProbe(pool, async () => {
    const runtime = await createRuntime(pool), http = await createHttp(runtime);
    try {
      for (const ticket of expected) {
        const read = await http.request(proof, 'GET', '/' + ticket.id); assert.equal(read.statusCode, 200); assert.deepEqual(read.json(), ticket);
      }
      const retry = await http.request(proof, 'POST', '', { orderId }); assert.equal(retry.statusCode, 201); assert.deepEqual(retry.json(), expected[0]);
      let cursor, ids = [];
      do {
        const page = await http.request(proof, 'GET', '?limit=2' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
        assert.equal(page.statusCode, 200); const body = page.json(); ids.push(...body.tickets.map(row => row.id)); cursor = body.nextCursor;
        assert.ok(ids.length <= expected.length);
      } while (cursor);
      assert.deepEqual(ids, expected.map(ticket => ticket.id));
      assert.equal((await http.request(proof, 'GET', '/' + foreignTicketId)).statusCode, 404);
    } finally { await http.app.close(); }
  });
  console.log('KT01 restart passed');
} catch { console.error('KT01 restart failed; details suppressed'); process.exitCode = 1; }
