import test from 'node:test';
import assert from 'node:assert/strict';
import { admitObservation, expectedBaseline } from './cs02-plan.mjs';
import { authorize, baseline, fingerprint, safeFailure, sourceCatalog } from './cs02-controls.mjs';

const env = { CS02_TEST_TARGET: 'YES', CS02_EXCLUSIVE: 'YES', CS02_SCHEMA: 'pre-0007', CS02_MODE: 'execute', CS02_APPLY_0007: 'YES', CS02_EXPECTED_TARGET: 'a'.repeat(64) };
test('catalog expectations match PostgreSQL identifier truncation', async () => {
  const table = (await sourceCatalog('post-0007')).find(item => item.name === 'cash_drawer_retries');
  assert.ok(table.constraints.some(item => item.name === 'cash_drawer_retries_business_id_branch_id_operation_retry_key_p'));
  assert.ok(table.indexes.some(item => item.name === 'cash_drawer_retries_business_id_branch_id_operation_retry_key_p'));
});
test('execution requires explicit target, reservation, stage, one migration, fingerprint and supported runtime', () => {
  authorize(env, 'v24.21.0');
  for (const key of Object.keys(env)) assert.throws(() => authorize({ ...env, [key]: undefined }, 'v24.21.0'));
  for (const version of ['v24.20.9', 'v22.21.0', 'v25.21.0', 'v24.21.0-rc']) assert.throws(() => authorize(env, version));
  assert.throws(() => authorize({ ...env, CS02_EXPECTED_TARGET: 'a'.repeat(63) }, 'v24.21.0'));
  assert.throws(() => authorize({ ...env, CS02_MODE: 'baseline' }, 'v24.21.0'));
  const { CS02_APPLY_0007, CS02_EXPECTED_TARGET, ...readOnly } = env;
  authorize({ ...readOnly, CS02_MODE: 'baseline' }, 'v24.21.0');
  const { CS02_APPLY_0007: omitted, ...post } = env;
  authorize({ ...post, CS02_SCHEMA: 'post-0007' }, 'v24.21.0');
  assert.throws(() => authorize({ ...env, CS02_SCHEMA: 'post-0007' }, 'v24.21.0'));
});

async function fixture(stage = 'pre-0007') {
  const catalog = await sourceCatalog(stage), expected = await expectedBaseline(stage), calls = [], changes = [{}, {}];
  const clients = [0, 1].map(index => ({
    async query(sql, parameters) {
      calls.push({ index, sql }); const change = changes[index];
      if (sql.startsWith('begin ') || sql === 'rollback') { if (sql === 'rollback' && change.rollbackFails) throw Error('private'); return { rows: [] }; }
      if (sql.startsWith('select current_database')) return { rows: [{ database: 'fixture', role: 'tester', address: '127.0.0.1', port: 5432, pid: change.pid ?? index + 1, readonly: change.readonly ?? 'on', ...change.identity }] };
      if (sql.startsWith('select hash')) return { rows: (change.history ?? expected.history).map(row => ({ hash: row.hash, created_at: row.createdAt })) };
      if (sql.startsWith('select tablename')) return { rows: catalog.map(table => ({ tablename: table.name })) };
      if (sql.startsWith('select c.relrowsecurity')) return { rows: [change.rls ?? { enabled: catalog.find(table => table.name === parameters[0]).rls, forced: false, policies: 0 }] };
      if (sql.startsWith('select a.attname')) return { rows: change.columns ?? catalog.find(table => table.name === parameters[0]).columns };
      if (sql.startsWith('select conname')) return { rows: change.constraints ?? catalog.find(table => `public.${table.name}` === parameters[0]).constraints };
      if (sql.startsWith('select idx.relname')) return { rows: change.indexes ?? catalog.find(table => table.name === parameters[0]).indexes };
      if (sql.startsWith('select (select count(*)')) return { rows: [{ triggers: 0, functions: 0 }] };
      if (sql.startsWith('select relname')) return { rows: [{ relname: 'kitchen_tickets_position_seq', relkind: 'S' }] };
      if (sql.startsWith('select count(*)')) return { rows: [{ n: String(change.count ?? 0) }] };
      throw Error('unexpected query');
    }, release() { calls.push({ index, sql: 'release' }); },
  }));
  return { clients, changes, calls, pool: index => ({ connect: async () => clients[index] }), expected,
    target: fingerprint({ database: 'fixture', role: 'tester', address: '127.0.0.1', port: 5432 }) };
}

test('both read-only connections independently inspect source-derived structure and emptiness', async () => {
  for (const stage of ['pre-0007', 'post-0007']) {
    const f = await fixture(stage), result = await baseline(f.pool(0), f.pool(1), stage, f.target);
    assert.equal(admitObservation(f.expected, result, f.target), true);
    assert.equal(result.catalogVerified, true);
    assert.equal(result.tables.length, stage === 'pre-0007' ? 20 : 26);
    for (const index of [0, 1]) {
      assert.equal(f.calls.filter(call => call.index === index && call.sql.startsWith('select count(*)')).length, result.tables.length);
      assert.equal(f.calls.filter(call => call.index === index && call.sql.startsWith('select idx.relname')).length, result.tables.length);
      assert.equal(f.calls.filter(call => call.index === index && call.sql === 'rollback').length, 1);
      assert.equal(f.calls.filter(call => call.index === index && call.sql === 'release').length, 1);
    }
    assert.ok(f.calls.every(call => /^(begin .*read only|select |rollback|release)/.test(call.sql)));
    assert.ok(!JSON.stringify(result).includes('fixture')); // identity is not retained
  }
});

test('target, read-only, migration history, column and index drift or data fail closed and release connections', async () => {
  for (const change of [{ identity: { database: 'other' } }, { pid: 1 }, { readonly: 'off' }, { history: [] },
    { columns: [] }, { constraints: [] }, { indexes: [] }, { count: 1 }, { rls: { enabled: true, forced: false, policies: 0 } }]) {
    const f = await fixture(); Object.assign(f.changes[1], change);
    await assert.rejects(baseline(f.pool(0), f.pool(1), 'pre-0007', f.target));
    assert.equal(f.calls.filter(call => call.sql === 'rollback').length, 2);
    assert.equal(f.calls.filter(call => call.sql === 'release').length, 2);
    assert.ok(f.calls.every(call => /^(begin .*read only|select |rollback|release)/.test(call.sql)));
  }
  const f = await fixture(); f.changes[1].indexes = [{ name: 'fake', unique: false, valid: true, partial: false, keys: [] }];
  await assert.rejects(baseline(f.pool(0), f.pool(1), 'pre-0007', f.target));
  const changed = await fixture(), first = (await sourceCatalog('pre-0007'))[0];
  assert.ok(first.indexes.length);
  changed.changes[1].indexes = first.indexes.map((item, index) => index === 0 ? { ...item, valid: false } : item);
  await assert.rejects(baseline(changed.pool(0), changed.pool(1), 'pre-0007', changed.target));
});

test('malformed stage and fingerprint refuse before connection; cleanup failures are sanitized', async () => {
  const f = await fixture();
  await assert.rejects(baseline(f.pool(0), f.pool(1), 'wrong'));
  await assert.rejects(baseline(f.pool(0), f.pool(1), 'pre-0007', 'invalid'));
  assert.equal(f.calls.length, 0);
  f.changes[0].rollbackFails = true;
  await assert.rejects(baseline(f.pool(0), f.pool(1), 'pre-0007'), { message: 'CS02_BASELINE_RELEASE_FAILED' });
  assert.equal(f.calls.filter(call => call.sql === 'release').length, 2);
  assert.deepEqual(safeFailure(Object.assign(new Error('private'), { code: '23505' }), 'baseline'), { stage: 'baseline', category: 'operation', sqlstate: '23505' });
  assert.doesNotMatch(JSON.stringify(safeFailure(new Error('sensitive connection string'), 'baseline')), /sensitive/);
});
