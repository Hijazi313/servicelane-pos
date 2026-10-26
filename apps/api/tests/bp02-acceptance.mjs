// Manual only. No automatic test-suite registration; refuses before configuration/driver imports.
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { authorize, baseline, shape, history, counts, identity, fingerprint, sha256, safeFailure } from './bp02-controls.mjs';
import { syntheticFixtures, cases } from './bp02-plan.mjs';
try { authorize(process.env, process.version); } catch { console.error('BP02 requires separate target/reservation/run authorization'); process.exit(1); }
const root = resolve(import.meta.dirname, '../../..'), fixture = syntheticFixtures(), tag = `bp02.${fixture.runId}`;
const reportPath = `${root}/apps/api/tests/evidence/${tag}.json`, ledgerPath = `${root}/apps/api/tests/evidence/${tag}.ledger.json`;
const report = { tag, mode: process.env.BP02_MODE, runtime: process.version, startedAt: new Date().toISOString(), source: [],
  results: cases.map(id => ({ id, status: 'not-run' })), migration: 'not-run', cleanup: 'not-required' };
const ledger = { tag, fixture, setupAttempted: false, setupCommitted: false };
let ledgerCreated = false;
const saveLedger = async () => { await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + '\n', { mode: 0o600, flag: ledgerCreated ? 'w' : 'wx' }); ledgerCreated = true; };
let one, two, runtime, options, stage = 'source', idleError = false, postVerified = false, failed = false;
const closed = new Set();
const close = async pool => { if (pool && !closed.has(pool)) { await pool.end(); closed.add(pool); } };
const watch = pool => { pool.on('error', () => { idleError = true; }); return pool; };
const record = (id, status) => { report.results.find(row => row.id === id).status = status; };
async function hashTree(directory) {
  for (const entry of await readdir(`${root}/${directory}`, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await hashTree(path);
    else if (/\.(ts|js|mjs|sql|json)$/.test(entry.name)) report.source.push({ path, hash: sha256(await readFile(`${root}/${path}`)) });
  }
}
try {
  await hashTree('apps/api/src'); await hashTree('apps/api/dist/billing-check'); await hashTree('apps/api/migrations');
  for (const name of ['acceptance', 'controls', 'plan', 'runtime', 'fixtures', 'cases', 'restart', 'child']) {
    const path = `apps/api/tests/bp02-${name}.mjs`; report.source.push({ path, hash: sha256(await readFile(`${root}/${path}`)) });
  }
  ledger.sourceHash = sha256(JSON.stringify(report.source));
  const { Pool } = await import('pg');
  const { readConfiguration } = await import('../dist/billing-check/infrastructure/configuration.js');
  const config = readConfiguration(process.env); assert.notEqual(config.environment, 'production');
  assert.equal(config.database.connectionString, config.migrationDatabase.connectionString);
  report.tlsVerified = config.database.ssl.rejectUnauthorized;
  options = { ...config.database, max: 1, connectionTimeoutMillis: 10000, query_timeout: 35000, options: '-c statement_timeout=30000 -c lock_timeout=20000' };
  one = watch(new Pool({ ...options, application_name: tag + '.holder' })); two = watch(new Pool({ ...options, application_name: tag + '.contender' }));
  stage = 'baseline'; report.baseline = await baseline(one, two, 'pre-0006', process.env.BP02_EXPECTED_TARGET);
  ledger.target = report.baseline.target; ledger.baselineHash = sha256(JSON.stringify(report.baseline));
  assert.equal(idleError, false);
  if (report.mode === 'execute') {
    // Baseline has just proven the only pending entry is 0006. Drizzle retains existing history.
    stage = 'migration'; ledger.migrationAttempted = true; await saveLedger();
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    await migrate(drizzle({ client: one }), { migrationsFolder: `${root}/apps/api/migrations` });
    report.migration = 'applied-0006';
    report.postMigration = await baseline(one, two, 'post-0006', ledger.target); postVerified = true;
    const tables = report.postMigration.tables;
    const { createRuntime } = await import('./bp02-runtime.mjs');
    const { setup, checkpoint } = await import('./bp02-fixtures.mjs');
    const { runCases } = await import('./bp02-cases.mjs');
    const { transactionDatabase } = await import('../dist/billing-check/infrastructure/database/transaction.js');
    const { sql } = await import('drizzle-orm');
    runtime = await createRuntime(one);
    const certify = async () => { assert.equal(idleError, false); await checkpoint(one, ledger, tables, saveLedger); };
    stage = 'fixtures'; const proofs = await setup(runtime, ledger, saveLedger, tables); await certify();
    const other = await createRuntime(two, tag + '.contender');
    const observe = async context => {
      const tx = transactionDatabase(context), pid = (await tx.execute(sql`select pg_backend_pid() as pid`)).rows[0].pid, deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        await tx.execute(sql`select pg_stat_clear_snapshot()`);
        const blocked = (await tx.execute(sql`select exists(select 1 from pg_stat_activity a join pg_locks l on a.pid=l.pid where a.application_name=${tag + '.contender'} and l.locktype='advisory' and l.classid=20261012 and l.objid=2 and not l.granted and ${pid}::int=any(pg_blocking_pids(a.pid))) as blocked`)).rows[0].blocked;
        if (blocked) { (report.contention ??= []).push({ case: report.results.find(row => row.status === 'running')?.id, observed: true }); return; }
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      throw new Error('BP02_CONTENTION_NOT_OBSERVED');
    };
    stage = 'cases';
    const restart = await runCases({ runtime, other, one, proofs, ledger, tables, observe, record, checkpoint: certify });
    stage = 'fresh-process'; record('B07', 'running'); await close(two); await close(one);
    const { runChild } = await import('./bp02-child.mjs');
    report.child = await runChild(spawn, process.execPath, `${root}/apps/api/tests/bp02-restart.mjs`, process.env, restart);
    one = watch(new Pool({ ...options, application_name: tag + '.readback' })); runtime = await createRuntime(one);
    assert.deepEqual(await runtime.billing.get(proofs[0], restart.bill.orderId), restart.bill);
    await certify(); record('B07', 'passed');
  }
} catch (error) {
  failed = true; report.failure = safeFailure(error, stage);
  const running = report.results.find(row => row.status === 'running'); if (running) running.status = 'failed';
} finally {
  if (ledger.setupAttempted && postVerified) {
    try {
      if (!one || closed.has(one)) { const { Pool } = await import('pg'); one = watch(new Pool(options)); }
      assert.equal(fingerprint(await identity(one)), ledger.target);
      const { cleanup } = await import('./bp02-fixtures.mjs');
      await cleanup(one, ledger, report.postMigration.tables);
      report.finalHistory = await history(one, 'post-0006');
      report.finalCounts = await counts(one, await shape(one, 'post-0006'));
      assert.ok(Object.values(report.finalCounts).every(count => count === 0)); report.cleanup = 'passed';
    } catch (error) { failed = true; report.cleanup = 'failed-retain-ledger'; report.cleanupFailure = safeFailure(error, 'cleanup'); }
  } else if (ledger.migrationAttempted && !postVerified) { report.migration = 'uncertain-stop'; failed = true; }
  for (const pool of [one, two]) try { await close(pool); } catch { report.poolCloseFailed = true; failed = true; }
  if (idleError) { report.idleError = true; failed = true; }
  if (report.mode === 'execute' && (!report.results.every(row => row.status === 'passed') || report.cleanup !== 'passed')) failed = true;
  report.result = failed ? 'failed' : report.mode === 'baseline' ? 'baseline-passed' : 'passed'; report.finishedAt = new Date().toISOString();
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ report: reportPath, result: report.result, cleanup: report.cleanup }));
  if (failed) process.exitCode = 1;
}
