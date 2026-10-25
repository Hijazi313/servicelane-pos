// Manual only. Refuses before configuration/application/driver imports; never a suite entry.
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { authorize, baseline, shape, history, counts, failure, sha256, runChild } from './kt01-controls.mjs';
try { authorize(process.env, process.version); } catch { console.error('KT-01 requires separate target/reservation authorization'); process.exit(1); }
const root = resolve(import.meta.dirname, '../../..'), tag = `kt01.${randomUUID()}`;
const reportPath = `${root}/apps/api/tests/evidence/${tag}.json`, ledgerPath = `${root}/apps/api/tests/evidence/${tag}.ledger.json`;
const report = { tag, mode: process.env.KT01_MODE, runtime: process.version, startedAt: new Date().toISOString(), source: [], results: ['K01', 'K02', 'K03', 'K04', 'D01'].map(id => ({ id, status: 'not-run' })), migration: 'not-run', cleanup: 'not-required' };
const ledger = { tag, accountIds: [randomUUID(), randomUUID()], extraBranchId: randomUUID(), offeringIds: [], orderIds: [], setupAttempted: false, setupCommitted: false };
let ledgerCreated = false;
const saveLedger = async () => { await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + '\n', { mode: 0o600, flag: ledgerCreated ? 'w' : 'wx' }); ledgerCreated = true; };
let one, two, runtime, options, stage = 'preflight', idleError = false;
const closed = new Set();
const close = async pool => { if (pool && !closed.has(pool)) { await pool.end(); closed.add(pool); } };
async function hashFiles(directory) {
  for (const entry of await readdir(`${root}/${directory}`, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await hashFiles(path);
    else if (/\.(ts|js|mjs|sql|json)$/.test(entry.name)) report.source.push({ path, sha256: sha256(await readFile(`${root}/${path}`)) });
  }
}
try {
  // Includes the complete freshly compiled source dependency tree; no env files or proofs.
  await hashFiles('apps/api/src'); await hashFiles('apps/api/dist/orders-check'); await hashFiles('apps/api/migrations');
  for (const name of ['kt01-acceptance', 'kt01-controls', 'kt01-cleanup', 'kt01-runtime', 'kt01-cases', 'kt01-restart', 'or01-runtime', 'or01-controls', 'mn01-restart-operation']) {
    const path = `apps/api/tests/${name}.mjs`; report.source.push({ path, sha256: sha256(await readFile(`${root}/${path}`)) });
  }
  const { Pool } = await import('pg');
  const { readConfiguration } = await import('../dist/orders-check/infrastructure/configuration.js');
  const config = readConfiguration(process.env);
  assert.notEqual(config.environment, 'production');
  assert.equal(config.database.connectionString, config.migrationDatabase.connectionString);
  report.tlsVerified = config.database.ssl.rejectUnauthorized;
  options = { ...config.database, max: 1, connectionTimeoutMillis: 10000, query_timeout: 35000, options: '-c statement_timeout=30000 -c lock_timeout=20000' };
  one = new Pool({ ...options, application_name: tag + '.holder' }); two = new Pool({ ...options, application_name: tag + '.contender' });
  for (const pool of [one, two]) pool.on('error', () => { idleError = true; });
  stage = 'baseline'; report.baseline = await baseline(one, two, root, process.env.KT01_EXPECTED_TARGET);
  assert.equal(idleError, false);
  if (process.env.KT01_MODE === 'execute') {
    const { createRuntime } = await import('./kt01-runtime.mjs');
    const { runCases } = await import('./kt01-cases.mjs');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    const { sql } = await import('drizzle-orm');
    const { inTransaction, transactionDatabase } = await import('../dist/orders-check/infrastructure/database/transaction.js');
    const { PostgresAccessStore } = await import('../dist/orders-check/modules/authentication/infrastructure/access-store.js');
    const { token, digest } = await import('../dist/orders-check/modules/authentication/application/access-policy.js');
    const { hashInitialPassword } = await import('../dist/orders-check/modules/authentication/infrastructure/password-hash.js');
    runtime = await createRuntime(one);
    stage = 'migration'; await migrate(runtime.database.db, { migrationsFolder: `${root}/apps/api/migrations` });
    report.historyAfter = await history(one, root, 6); const tables = await shape(one, root, '0005');
    assert.ok(Object.values(await counts(one, tables)).every(count => count === 0)); report.migration = 'passed'; assert.equal(idleError, false);
    const proof = { session: token(), csrf: token() }, otherProof = { session: token(), csrf: token() };
    ledger.sessionDigests = [proof, otherProof].map(value => digest(value.session));
    stage = 'fixtures'; await saveLedger();
    const passwordHash = await hashInitialPassword(randomBytes(24).toString('base64url'));
    ledger.setupAttempted = true; await saveLedger();
    await new PostgresAccessStore(runtime.database).run(async unit => {
      const tx = transactionDatabase(unit.context); await tx.execute(sql`select pg_advisory_xact_lock(20261012,1)`);
      for (const table of tables) assert.equal(Number((await tx.execute(sql.raw(`select count(*) as n from public.${table}`))).rows[0].n), 0);
      const context = await runtime.business.createInitialBusiness({ business: { name: tag, currencyCode: 'PKR', timezone: 'Asia/Karachi' }, branch: { name: tag } }, unit.context);
      ledger.businessId = context.businessId; ledger.branchId = context.branchId; await saveLedger();
      await tx.execute(sql`insert into branches(id,business_id,name) values(${ledger.extraBranchId}::uuid,${ledger.businessId}::uuid,${tag + '.extra'})`);
      for (let index = 0; index < 2; index++) {
        await unit.saveAccount({ id: ledger.accountIds[index], businessId: ledger.businessId, username: tag + '-' + index, displayName: tag + '-' + index,
          role: index === 0 ? 'administrator' : 'staff', status: 'active', passwordChangeRequired: false, passwordHash, branchIds: [ledger.branchId] });
        const value = [proof, otherProof][index], now = new Date(Date.now() - 5000);
        await unit.saveSession({ digest: digest(value.session), businessId: ledger.businessId, accountId: ledger.accountIds[index], csrfToken: value.csrf, createdAt: now, lastActivityAt: now, revokedAt: null });
      }
    });
    ledger.setupCommitted = true; await saveLedger();
    const other = await createRuntime(two);
    const observe = async context => {
      const tx = transactionDatabase(context), pid = (await tx.execute(sql`select pg_backend_pid() as pid`)).rows[0].pid, deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        await tx.execute(sql`select pg_stat_clear_snapshot()`);
        const seen = await tx.execute(sql`select exists(select 1 from pg_stat_activity a join pg_locks l on a.pid=l.pid where a.application_name=${tag + '.contender'} and l.locktype='advisory' and not l.granted and ${pid}::int=any(pg_blocking_pids(a.pid))) as blocked`);
        if (seen.rows[0].blocked) return { observedAdvisoryWait: true };
        await new Promise(done => setImmediate(done));
      }
      throw new Error('Required contention not observed');
    };
    stage = 'cases';
    const restart = await runCases({ runtime, other, one, proof, otherProof, ledger, tag, sql, transactionDatabase, saveLedger, observe,
      record: (id, details) => { assert.equal(idleError, false); report.results[report.results.findIndex(row => row.id === id)] = { id, ...details }; } });
    stage = 'fresh-process'; await close(two); await close(one);
    await runChild(spawn, process.execPath, `${root}/apps/api/tests/kt01-restart.mjs`, process.env, { proof, ...restart });
    one = new Pool({ ...options, application_name: tag + '.readback' }); one.on('error', () => { idleError = true; }); runtime = await createRuntime(one);
    for (const expected of restart.expected) assert.deepEqual(await runtime.kitchen.get(proof, expected.id), expected);
    report.results[4] = { id: 'D01', status: 'passed', freshApiProcesses: 1, parentPoolsClosed: true, parentReconnected: true };
  }
} catch (error) { report.failure = failure(error, stage); process.exitCode = 1; }
finally {
  // Barriers/contenders and any child are settled by their helpers before cleanup.
  if (ledger.setupAttempted && report.migration === 'passed') {
    try {
      if (!one || closed.has(one)) {
        const { Pool } = await import('pg'); const { createRuntime } = await import('./kt01-runtime.mjs');
        one = new Pool({ ...options, application_name: tag + '.cleanup' }); one.on('error', () => { idleError = true; }); runtime = await createRuntime(one);
      }
      const { cleanup } = await import('./kt01-cleanup.mjs');
      await cleanup(runtime.database.db, ledger, tag);
      report.afterCleanup = await counts(one, await shape(one, root, '0005'));
      assert.ok(Object.values(report.afterCleanup).every(count => count === 0));
      report.historyFinal = await history(one, root, 6); report.cleanup = 'passed';
    } catch (error) { report.cleanup = 'failed-retain-ledger'; report.cleanupFailure = failure(error, 'cleanup'); process.exitCode = 1; }
  }
  for (const pool of [one, two]) try { await close(pool); } catch { report.poolCloseFailed = true; process.exitCode = 1; }
  if (idleError) { report.idleConnectionError = true; process.exitCode = 1; }
  report.result = process.exitCode ? 'failed' : report.mode === 'baseline' ? 'baseline-passed' : 'passed'; report.finishedAt = new Date().toISOString();
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ report: reportPath, result: report.result, cleanup: report.cleanup }));
}
