// Manual fresh process only; no provisioning, migration, listener or cleanup.
import { authorize } from './kt01-controls.mjs';
try { authorize(process.env, process.version); if (process.env.KT01_MODE !== 'execute') throw new Error(); }
catch { console.error('KT-01 restart requires separate execution permission'); process.exit(1); }
const progress = step => process.stderr.write(`KT01_STEP:${step}\n`);
progress('input');
try {
  const { default: assert } = await import('node:assert/strict');
  let bytes = 0; const chunks = [];
  for await (const chunk of process.stdin) { bytes += chunk.length; if (bytes > 8 * 1024 * 1024) throw new Error(); chunks.push(chunk); }
  const { proof, expected, orderId, foreignTicketId } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  assert.equal(expected.length, 5);
  progress('configuration');
  const { verifyRestartHttp } = await import('./kt01-restart-checks.mjs');
  const { Pool } = await import('pg'); const { readConfiguration } = await import('../dist/orders-check/infrastructure/configuration.js');
  const { createRuntime, createHttp } = await import('./kt01-runtime.mjs'); const { runRestartProbe } = await import('./mn01-restart-operation.mjs');
  const config = readConfiguration(process.env);
  const pool = new Pool({ ...config.database, max: 1, connectionTimeoutMillis: 10000, options: '-c statement_timeout=15000 -c lock_timeout=10000' });
  await runRestartProbe(pool, async () => {
    progress('runtime');
    const runtime = await createRuntime(pool);
    progress('http-init');
    const http = await createHttp(runtime);
    let checked = false;
    try {
      await verifyRestartHttp(http, { proof, expected, orderId, foreignTicketId }, progress);
      checked = true;
    } finally { if (checked) progress('http-close'); await http.app.close(); }
    progress('pool-close');
  });
  progress('complete');
  console.log('KT01 restart passed');
} catch { console.error('KT01 restart failed; details suppressed'); process.exitCode = 1; }
