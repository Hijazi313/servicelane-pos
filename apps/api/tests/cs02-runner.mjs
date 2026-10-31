// Supervised CS02 execution. Importing this file performs no I/O or connection.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { authorize, baseline, fingerprint, sha256, safeFailure } from './cs02-controls.mjs';
import { syntheticFixtures, setup } from './cs02-fixtures.mjs';
import { createRuntime } from './cs02-runtime.mjs';
import { captureOwnedWrites, admitOwnedWrites, admitAccessMutations } from './cs02-owned-write.mjs';
import { checkpoint, cleanup, ownedState } from './cs02-ledger.mjs';
import { executeCases } from './cs02-runner-core.mjs';
import { contend as coordinate } from './cs02-contention.mjs';
import { runChild } from './cs02-child.mjs';
import { seedLegacy } from './cs02-legacy.mjs';

export async function main() {
  authorize(process.env, process.version); assert.equal(process.env.CS02_MODE, 'execute');
  const root = resolve(import.meta.dirname, '../../..'), f = syntheticFixtures(), tag = `cs02.${f.runId}`;
  const evidence = resolve(root, 'apps/api/tests/evidence'), ledgerPath = `${evidence}/${tag}.ledger.json`, reportPath = `${evidence}/${tag}.json`;
  const ledger = { tag, fixture: f, setupAttempted: false, setupCommitted: false }, report = {
    tag, runtime: process.version, results: {}, migration: 'not-run', cleanup: 'not-required', startedAt: new Date().toISOString() };
  let created = false, p, q, options, post, stage = 'source', idleError = false, certified = false;
  const saveLedger = async () => { await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + '\n', { mode: 0o600, flag: created ? 'w' : 'wx' }); created = true; };
  const watch = pool => { pool.on('error', () => { idleError = true; }); return pool; };
  let failed = false;
  try {
    const { Pool } = await import('pg');
    const { readConfiguration } = await import('../dist/cs02-check/infrastructure/configuration.js');
    const config = readConfiguration(process.env);
    assert.notEqual(config.environment, 'production'); assert.equal(config.database.connectionString, config.migrationDatabase.connectionString);
    report.tlsVerified = config.database.ssl.rejectUnauthorized;
    options = { ...config.database, max: 1, connectionTimeoutMillis: 10000, query_timeout: 35000,
      options: '-c statement_timeout=30000 -c lock_timeout=20000' };
    p = watch(new Pool({ ...options, application_name: `${tag}.holder` }));
    q = watch(new Pool({ ...options, application_name: `${tag}.contender` }));
    stage = 'baseline'; const pre = await baseline(p, q, process.env.CS02_SCHEMA, process.env.CS02_EXPECTED_TARGET);
    ledger.target = pre.fingerprint; ledger.baselineHash = sha256(JSON.stringify(pre)); assert.equal(idleError, false);
    if (process.env.CS02_SCHEMA === 'pre-0007') {
      stage = 'migration'; ledger.migrationAttempted = true; await saveLedger();
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const { migrate } = await import('drizzle-orm/node-postgres/migrator');
      await migrate(drizzle({ client: p }), { migrationsFolder: resolve(root, 'apps/api/migrations') });
      report.migration = 'applied-0007';
      post = await baseline(p, q, 'post-0007', ledger.target);
    } else { report.migration = 'already-applied'; post = pre; }
    assert.equal(idleError, false);
    const runtime = await createRuntime(p, `${tag}.holder`), other = await createRuntime(q, `${tag}.contender`);
    stage = 'fixtures'; const proofs = await setup(runtime, ledger, saveLedger, post.tables);
    const certify = async () => { assert.equal(idleError, false); await checkpoint(p, ledger, post.tables, saveLedger); };
    await certify();
    const capture = work => captureOwnedWrites([runtime, other], work);
    const admit = async (expected, access) => { await admitOwnedWrites(p, ledger, expected); await admitAccessMutations(p, ledger, access); };
    const { transactionDatabase } = await import('../dist/cs02-check/infrastructure/database/transaction.js');
    const { sql } = await import('drizzle-orm');
    const observe = async context => {
      const tx = transactionDatabase(context), pid = (await tx.execute(sql`select pg_backend_pid() as pid`)).rows[0].pid;
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        await tx.execute(sql`select pg_stat_clear_snapshot()`);
        const blocked = (await tx.execute(sql`select exists(select 1 from pg_stat_activity a join pg_locks l on a.pid=l.pid where a.application_name=${tag + '.contender'} and l.locktype='advisory' and l.classid=20261012 and l.objid=2 and not l.granted and ${pid}::int=any(pg_blocking_pids(a.pid))) as blocked`)).rows[0].blocked;
        if (blocked) return;
        await new Promise(resolveWait => setTimeout(resolveWait, 25));
      }
      throw new Error('CS02_CONTENTION_NOT_OBSERVED');
    };
    const contend = (target, method, first, second) => coordinate({ target, method, first, second, observe });
    const inject = async (target, method, work) => {
      const original = target[method]; let reached = false;
      target[method] = async function (...args) { await original.apply(this, args); reached = true; throw new Error('CS02_INJECTED'); };
      try { await assert.rejects(work, error => error.message === 'CS02_INJECTED'); assert.equal(reached, true); }
      finally { target[method] = original; }
    };
    const seedForeign = async foreign => {
      assert.equal(foreign.businessId, f.businesses[0]); assert.equal(foreign.branchId, f.branches[1]);
      assert.equal(foreign.drawerId, f.operationKeys[40]); assert.equal(foreign.sessionId, f.operationKeys[41]);
      assert.equal(foreign.custodianId, f.actors[0]);
      const { openDrawer } = await import('../dist/cs02-check/modules/cashier-shifts/domain/drawer-session.js');
      const sc = { businessId: foreign.businessId, branchId: foreign.branchId };
      const session = openDrawer({ id: foreign.sessionId, drawerId: foreign.drawerId, actorId: foreign.custodianId,
        currencyCode: 'PKR', scale: 2, openingMinor: '0', openedAt: '2026-10-29T00:00:00.000Z' });
      await runtime.accessStore.run(async unit => {
        await runtime.drawerStore.insertDrawer(sc, { id: foreign.drawerId, label: `Synthetic foreign ${f.runId}` }, unit.context);
        await runtime.drawerStore.insertSession(sc, session, unit.context);
      });
    };
    const verifyTarget = async client => {
      const rows = (await client.query('select current_database() as database,current_user as role,inet_server_addr()::text as address,pg_catalog.inet_server_port() as port')).rows;
      assert.equal(rows.length, 1); return fingerprint(rows[0]);
    };
    const certifyCleanup = async () => {
      if (!ledger.setupCommitted || !ledger.state || !post || idleError) return false;
      try {
        const client = await p.connect();
        try { await client.query('begin read only'); assert.equal(await verifyTarget(client), ledger.target);
          assert.deepEqual(await ownedState(client, ledger, post.tables), ledger.state); certified = true; return true;
        } finally { try { await client.query('rollback'); } finally { client.release(); } }
      } catch { return false; }
    };
    const cleanupOwned = async () => {
      await cleanup(p, ledger, post.tables, verifyTarget);
      await baseline(p, q, 'post-0007', ledger.target);
      assert.equal(idleError, false);
      report.cleanup = 'passed';
    };
    stage = 'cases';
    await executeCases({ runtime, other, fixture: f, proofs, capture, admit, checkpoint: certify, contend, inject, seedForeign,
      seedLegacy: () => seedLegacy(runtime, f, proofs[0]),
      restart: async input => {
        // Child access-touch admission is mandatory. Refuse before spawning until the
        // private IPC implementation provides independently reconstructed writes.
        const child = await runChild(spawn, process.execPath, resolve(root, 'apps/api/tests/cs02-restart.mjs'), process.env, input);
        if (!Array.isArray(child.access)) throw new Error('CS02_CHILD_ACCESS_EVIDENCE_MISSING');
        await admitAccessMutations(p, ledger, child.access);
        await certify();
        return { legacyReplayVerified: true, accessMutationsCertified: true };
      }, certifyCleanup, cleanup: cleanupOwned, record: (id, status) => { report.results[id] = status; } });
    assert.equal(certified, true); assert.equal(report.cleanup, 'passed');
  } catch (error) {
    failed = true; report.failure = safeFailure(error, stage);
    if (ledger.migrationAttempted && !post) report.migration = 'uncertain-stop';
    if (ledger.setupAttempted && report.cleanup !== 'passed') report.cleanup = 'not-certified-retain-ledger';
  } finally {
    for (const pool of [p, q]) if (pool) try { await pool.end(); } catch { failed = true; report.poolCloseFailed = true; }
    if (idleError) { failed = true; report.idleError = true; }
    report.finishedAt = new Date().toISOString(); report.result = failed ? 'failed' : 'passed';
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    console.log(JSON.stringify({ report: reportPath, result: report.result, cleanup: report.cleanup }));
    if (failed) process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('CS02 runner refused or failed'); process.exitCode = 1; });
}
