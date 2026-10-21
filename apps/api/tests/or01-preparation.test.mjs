// Focused offline controls/fixture validation. Never loads configuration or connects.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';
import { authorize, failure, runChild, baseline } from './or01-controls.mjs';
const allowed = { OR01_ACCEPT_STAGING: 'YES', OR01_TARGET: 'current-staging', OR01_EXCLUSIVE: 'YES' };
test('manual parent and child refuse before loading configuration without every acknowledgement', () => {
  for (const key of Object.keys(allowed)) {
    const env = { ...allowed }; delete env[key]; assert.throws(() => authorize(env, 'v24.21.0'));
    for (const file of ['or01-acceptance.mjs', 'or01-restart.mjs']) {
      const result = spawnSync(process.execPath, [resolve(import.meta.dirname, file)], { env: { ...process.env, DATABASE_URL: 'invalid-sentinel', ...env, [key]: '' }, encoding: 'utf8' });
      assert.notEqual(result.status, 0); assert.doesNotMatch(result.stderr, /DATABASE_URL|invalid-sentinel|ECONN|postgres/i);
    }
  }
  for (const version of ['v22.21.0', 'v24.20.0', 'v25.0.0']) assert.throws(() => authorize(allowed, version));
  assert.doesNotThrow(() => authorize(allowed, 'v24.21.0'));
});
test('failure reports retain stage/SQLSTATE without assertion operands or driver secrets', () => {
  const secret = new Error('postgres://private password SyntheticGuest'); secret.code = '23505';
  const result = failure({ cause: secret }, 'case'); assert.deepEqual(result, { stage: 'case', category: 'operation-failed', sqlstate: '23505' });
  assert.doesNotMatch(JSON.stringify(result), /private|password|Synthetic/);
  assert.equal(failure(new assert.AssertionError({ message: 'private' }), 'shape').category, 'assertion-failed');
});
function childFactory({ marker = 'OR01 restart passed\n', code = 0, hang = false }) {
  const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = { resume() {} };
  child.stdin = new EventEmitter(); child.stdin.end = () => { if (!hang) queueMicrotask(() => { child.stdout.emit('data', Buffer.from(marker)); child.emit('close', code); }); };
  child.kill = signal => { child.killedWith = signal; queueMicrotask(() => child.emit('close', null)); };
  return child;
}
test('fresh-process control requires success marker and close, rejects failure and kills/reaps timeout', async () => {
  const invoke = child => runChild(() => child, 'node', 'probe', {}, {}, 15);
  await invoke(childFactory({}));
  await assert.rejects(invoke(childFactory({ code: 1 })));
  await assert.rejects(invoke(childFactory({ marker: 'wrong' })));
  const hanging = childFactory({ hang: true }); await assert.rejects(invoke(hanging)); assert.equal(hanging.killedWith, 'SIGKILL');
});
test('new real-adapter API composition initializes and closes without database access', async () => {
  const { createRuntime, createHttp } = await import('./or01-runtime.mjs');
  let connections = 0;
  const runtime = await createRuntime({ query() { connections++; throw new Error('Unexpected database query'); }, connect() { connections++; throw new Error('Unexpected connection'); } });
  const http = await createHttp(runtime); await http.app.close(); assert.equal(connections, 0);
});
test('case setup, exact money, rejection/reuse and post-insert rollback execute offline', async () => {
  const { fixture } = await import('./orders-fixture.mjs');
  const { MenuService } = await import('../dist/orders-check/modules/menu/application/menu.service.js');
  const { MenuOrderResolver } = await import('../dist/orders-check/modules/menu/public.js');
  const { runCases } = await import('./or01-cases.mjs');
  const h = fixture(), ledger = { businessId: h.installation.businessId, branchId: h.installation.branchId, accountId: h.state().account.id };
  const menu = new MenuService({ read: async () => structuredClone(h.state().catalogue), save: async (_business, row) => { const rows = h.state().catalogue; const index = rows.findIndex(existing => existing.id === row.id); if (index < 0) rows.push(structuredClone(row)); else rows[index] = structuredClone(row); } });
  h.service.menu = new MenuOrderResolver(menu);
  const stop = new Error('Stop after rollback orchestration; no SQL execution');
  let recorded, ledgerWrites = 0; const passed = [];
  await assert.rejects(runCases({ one: { query: async (text, args) => ({ rows: text.includes('access_sessions') ? [structuredClone(h.state().session)] : h.state().orders.filter(row => row.key === args[2]).map(row => ({ id: row.order.snapshot.id, ...structuredClone(row.order) })) }) }, orders: h.service, store: h.store, proof: h.proof, menu, resolver: h.service.menu, ledger, tag: 'or01.offline', business: { resolveInstallationContext: async () => h.installation }, saveLedger: async () => { ledgerWrites++; }, run: work => h.access.runAuthorized(h.proof, 'administrator', work), record: (id, result) => { if (result.status === 'passed') { passed.push(id); if (id === 'P01') recorded = result; if (id === 'R02') throw stop; } } }), error => error === stop);
  assert.equal(recorded.oracleTotalMinor, '8768'); assert.equal(recorded.highTotalMinor, '399999999600');
  assert.deepEqual(passed, ['P01', 'R01', 'R02']); assert.equal(ledger.offeringIds.length, 6); assert.equal(ledgerWrites, 6);
  assert.ok(h.state().catalogue.slice(1).every(row => row.name.startsWith('or01.offline.')));
});

test('baseline rejects a different target in read-only transactions and releases both clients', async () => {
  const statements = [], releases = [];
  const pool = pid => ({ connect: async () => ({ query: async sql => {
    statements.push(sql);
    if (sql.startsWith('select current_database')) return { rows: [{ database: 'synthetic', role: 'synthetic', address: '127.0.0.1', port: 5432, pid, readonly: 'on', version: '17' }] };
    return { rows: [] };
  }, release: () => releases.push(pid) }) });
  const report = {};
  await assert.rejects(baseline(pool(1), pool(2), resolve(import.meta.dirname, '../../..'), report));
  assert.equal(report.gate, undefined); assert.deepEqual(releases, [1, 2]);
  assert.equal(statements.filter(sql => sql === 'begin isolation level repeatable read read only').length, 2);
  assert.equal(statements.filter(sql => sql === 'rollback').length, 2);
  assert.ok(statements.every(sql => /^(begin isolation level repeatable read read only|select |rollback)/.test(sql)));
});
