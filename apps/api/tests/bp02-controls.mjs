// Manual verification controls. Safe to import offline: no config/driver imports.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { expectedBaseline } from './bp02-plan.mjs';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function authorize(env, version) {
  assert.match(version, /^v24\./); assert.ok(Number(version.split('.')[1]) >= 21);
  assert.equal(env.BP02_TEST_TARGET, 'YES'); assert.equal(env.BP02_EXCLUSIVE, 'YES');
  assert.equal(env.BP02_SCHEMA, 'pre-0006');
  assert.ok(['baseline', 'execute'].includes(env.BP02_MODE));
  if (env.BP02_MODE === 'execute') {
    assert.equal(env.BP02_APPLY_0006, 'YES');
    assert.match(env.BP02_EXPECTED_TARGET ?? '', /^[a-f0-9]{64}$/);
  }
}
export async function history(client, stage) {
  const expected = await expectedBaseline(stage);
  const rows = (await client.query('select hash,created_at from drizzle.__drizzle_migrations order by created_at')).rows;
  assert.deepEqual(rows.map(row => ({ hash: row.hash, createdAt: Number(row.created_at) })), expected.history);
  return expected.history;
}
export async function shape(client, stage) {
  const version = stage === 'pre-0006' ? '0005' : '0006';
  const snapshot = JSON.parse(await readFile(new URL(`../migrations/meta/${version}_snapshot.json`, import.meta.url), 'utf8'));
  const tables = Object.values(snapshot.tables);
  assert.deepEqual((await client.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(row => row.tablename), tables.map(table => table.name).sort());
  for (const table of tables) {
    const columns = (await client.query("select a.attname as name,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull as not_null from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=$1 and a.attnum>0 and not a.attisdropped order by a.attname", [table.name])).rows;
    assert.deepEqual(columns, Object.values(table.columns).map(column => ({ name: column.name, type: column.type.replace(/^varchar/, 'character varying').replace(/^bigserial$/, 'bigint'), not_null: column.notNull })).sort((a, b) => a.name.localeCompare(b.name)));
    const names = (await client.query('select conname from pg_constraint where conrelid=to_regclass($1) order by conname', ['public.' + table.name])).rows.map(row => row.conname);
    const expected = [...Object.keys(table.foreignKeys), ...Object.keys(table.compositePrimaryKeys), ...Object.keys(table.uniqueConstraints), ...Object.keys(table.checkConstraints)];
    if (Object.values(table.columns).some(column => column.primaryKey)) expected.push(table.name + '_pkey');
    assert.deepEqual(names, expected.sort());
  }
  assert.deepEqual((await client.query("select relname,relkind from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind not in ('r','i') order by relname")).rows, [{ relname: 'kitchen_tickets_position_seq', relkind: 'S' }]);
  assert.equal((await client.query("select pg_get_expr(d.adbin,d.adrelid) as value from pg_attrdef d join pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum where d.adrelid='public.kitchen_tickets'::regclass and a.attname='position'")).rows[0].value, "nextval('kitchen_tickets_position_seq'::regclass)");
  const unexpected = (await client.query("select (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal)::int as triggers,(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public')::int as functions")).rows[0];
  assert.deepEqual(unexpected, { triggers: 0, functions: 0 });
  if (stage === 'post-0006') assert.equal((await client.query("select column_default from information_schema.columns where table_schema='public' and table_name='branches' and column_name='display_revision'")).rows[0].column_default, '0');
  return tables.map(table => table.name).sort();
}
export async function counts(client, tables) {
  const result = {};
  for (const table of tables) { assert.match(table, /^[a-z_]+$/); result[table] = Number((await client.query(`select count(*) as n from public."${table}"`)).rows[0].n); }
  return result;
}
export async function identity(client) {
  return (await client.query("select current_database() as database,current_user as role,inet_server_addr()::text as address,inet_server_port() as port,pg_backend_pid() as pid,current_setting('transaction_read_only') as readonly")).rows[0];
}
export const fingerprint = row => sha256(JSON.stringify([row.database, row.role, row.address, row.port]));
export async function baseline(one, two, stage, expectedTarget) {
  const clients = [];
  try {
    for (const pool of [one, two]) { const client = await pool.connect(); clients.push(client); await client.query('begin isolation level repeatable read read only'); }
    const a = await identity(clients[0]), b = await identity(clients[1]);
    assert.equal(fingerprint(a), fingerprint(b)); assert.notEqual(a.pid, b.pid);
    assert.equal(a.readonly, 'on'); assert.equal(b.readonly, 'on');
    const target = fingerprint(a); if (expectedTarget) assert.equal(target, expectedTarget);
    const installed = await history(clients[0], stage), tables = await shape(clients[0], stage), before = await counts(clients[0], tables);
    assert.ok(Object.values(before).every(value => value === 0));
    return { target, stage, history: installed, tables, counts: before };
  } finally {
    const errors = [];
    for (const client of clients) { try { await client.query('rollback'); } catch (error) { errors.push(error); } finally { client.release(); } }
    if (errors.length) throw errors[0];
  }
}
// Barrier wraps a real persistence write while its caller still owns Access's transaction.
export async function contend(store, method, first, second, observe) {
  const original = store[method]; let enteredResolve, releaseResolve, firstResult, secondResult;
  const entered = new Promise(resolve => { enteredResolve = resolve; });
  const release = new Promise(resolve => { releaseResolve = resolve; });
  const capture = work => Promise.resolve().then(work).then(value => ({ value }), error => ({ error }));
  store[method] = async function (...args) { const result = await original.apply(this, args); enteredResolve(args.at(-1)); await release; return result; };
  let timer;
  try {
    firstResult = capture(first);
    const context = await Promise.race([entered, firstResult.then(() => { throw new Error('BP02_BARRIER_MISSING'); }), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('BP02_BARRIER_TIMEOUT')), 10000); })]);
    clearTimeout(timer);
    secondResult = capture(second);
    await observe(context);
  } finally {
    clearTimeout(timer); releaseResolve();
    store[method] = original;
    // Always join both attempts, including observer/barrier failure, before cleanup.
    await Promise.all([firstResult, secondResult]);
  }
  return [await firstResult, await secondResult];
}
export async function injected(store, method, work) {
  const original = store[method];
  store[method] = async function (...args) { await original.apply(this, args); throw new Error('BP02_INJECTED'); };
  try { await assert.rejects(work, error => error.message === 'BP02_INJECTED'); }
  finally { store[method] = original; }
}
export function safeFailure(error, stage) {
  const sqlstate = [error, error?.cause, error?.cause?.cause].map(item => item?.code).find(code => typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code));
  return { stage, category: error instanceof assert.AssertionError ? 'assertion' : 'operation', ...(sqlstate ? { sqlstate } : {}) };
}
