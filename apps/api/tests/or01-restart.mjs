// Separate API process: no provisioning, listener, migrations or fixture cleanup.
if (process.env.OR01_ACCEPT_STAGING !== 'YES' || process.env.OR01_TARGET !== 'current-staging' || process.env.OR01_EXCLUSIVE !== 'YES') {
  console.error('Explicit OR-01 staging execution authorization required');
  process.exitCode = 1;
} else if (!/^v24\./.test(process.version) || Number(process.version.split('.')[1]) < 21) {
  console.error('Supported Node 24 >=24.21.0 required');
  process.exitCode = 1;
} else {
  try {
    const { default: assert } = await import('node:assert/strict');
    let bytes = 0;
    const chunks = [];
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > 2 * 1024 * 1024) throw new Error('Restart input capacity exceeded');
      chunks.push(chunk);
    }
    const { proof, body, snapshot, policy } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    assert.equal(typeof snapshot.id, 'string');
    const { Pool } = await import('pg');
    const { readConfiguration } = await import('../dist/orders-check/infrastructure/configuration.js');
    const { createRuntime, createHttp } = await import('./or01-runtime.mjs');
    const { runRestartProbe } = await import('./mn01-restart-operation.mjs');
    const config = readConfiguration(process.env);
    const pool = new Pool({ ...config.database, max: 1, connectionTimeoutMillis: 10000, options: '-c statement_timeout=15000 -c lock_timeout=10000' });
    await runRestartProbe(pool, async () => {
      const runtime = await createRuntime(pool);
      const http = await createHttp(runtime);
      try {
        const read = await http.request(proof, 'GET', '/' + encodeURIComponent(snapshot.id));
        assert.equal(read.statusCode, 200);
        assert.deepEqual(read.json(), snapshot);
        const retry = await http.request(proof, 'POST', '', body);
        assert.equal(retry.statusCode, 201);
        assert.deepEqual(retry.json(), snapshot);
        const limits = await http.request(proof, 'GET', '/capture-policy');
        assert.equal(limits.statusCode, 200);
        assert.deepEqual(limits.json(), policy);
      } finally {
        await http.app.close();
      }
    });
    console.log('OR01 restart passed');
  } catch {
    // Assertions and driver exceptions can contain credentials or synthetic PII.
    console.error('OR01 restart failed; details suppressed');
    process.exitCode = 1;
  }
}
