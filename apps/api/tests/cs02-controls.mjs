// Offline-importable preparation controls. No environment, database driver or runner imports.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { expectedBaseline } from './cs02-plan.mjs';

export const sha256 = value => createHash('sha256').update(value).digest('hex');

// Caller must invoke this before loading configuration or opening a connection.
export function authorize(env, version) {
  const node = /^v24\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(node && Number(node[1]) >= 21, 'Unsupported Node runtime');
  assert.equal(env.CS02_TEST_TARGET, 'YES');
  assert.equal(env.CS02_EXCLUSIVE, 'YES');
  assert.equal(env.CS02_SCHEMA, 'pre-0007');
  assert.ok(['baseline', 'execute'].includes(env.CS02_MODE));
  if (env.CS02_MODE === 'execute') {
    assert.equal(env.CS02_APPLY_0007, 'YES');
    assert.match(env.CS02_EXPECTED_TARGET ?? '', /^[a-f0-9]{64}$/);
  } else {
    assert.equal(env.CS02_APPLY_0007, undefined);
  }
}

export async function sourceCatalog(stage) {
  if (stage !== 'pre-0007' && stage !== 'post-0007') throw new Error('Unknown stage');
  const version = stage === 'pre-0007' ? '0006' : '0007';
  const snapshot = JSON.parse(await readFile(new URL(`../migrations/meta/${version}_snapshot.json`, import.meta.url), 'utf8'));
  return Object.values(snapshot.tables).map(table => {
    const constraints = [
      ...Object.keys(table.foreignKeys).map(name => ({ name, type: 'f' })),
      ...Object.keys(table.compositePrimaryKeys).map(name => ({ name, type: 'p' })),
      ...Object.keys(table.uniqueConstraints).map(name => ({ name, type: 'u' })),
      ...Object.keys(table.checkConstraints).map(name => ({ name, type: 'c' })),
    ];
    if (Object.values(table.columns).some(column => column.primaryKey)) constraints.push({ name: `${table.name}_pkey`, type: 'p' });
    const indexes = Object.values(table.indexes).map(index => ({ name: index.name, unique: index.isUnique,
      valid: true, partial: Boolean(index.where), keys: index.columns.map(column => column.isExpression ? null : column.expression) }));
    for (const constraint of Object.values(table.compositePrimaryKeys)) indexes.push({ name: constraint.name, unique: true, valid: true, partial: false, keys: constraint.columns });
    for (const constraint of Object.values(table.uniqueConstraints)) indexes.push({ name: constraint.name, unique: true, valid: true, partial: false, keys: constraint.columns });
    const primary = Object.values(table.columns).filter(column => column.primaryKey);
    if (primary.length) indexes.push({ name: `${table.name}_pkey`, unique: true, valid: true, partial: false, keys: primary.map(column => column.name) });
    return {
      name: table.name,
      rls: table.isRLSEnabled,
      columns: Object.values(table.columns).map(column => ({ name: column.name,
        type: column.type.replace(/^varchar/, 'character varying').replace(/^bigserial$/, 'bigint'), not_null: column.notNull,
        default_expected: Object.hasOwn(column, 'default') || column.type === 'bigserial' })).sort((a, b) => a.name.localeCompare(b.name)),
      constraints: constraints.sort((a, b) => a.name.localeCompare(b.name)),
      indexes: indexes.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}
export async function history(client, stage) {
  const expected = await expectedBaseline(stage);
  const rows = (await client.query('select hash,created_at from drizzle.__drizzle_migrations order by created_at')).rows;
  assert.deepEqual(rows.map(row => ({ hash: row.hash, createdAt: Number(row.created_at) })), expected.history);
  return expected.history;
}
export async function shape(client, stage) {
  const tables = await sourceCatalog(stage);
  assert.deepEqual((await client.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(row => row.tablename), tables.map(table => table.name));
  for (const table of tables) {
    const rls = (await client.query("select c.relrowsecurity as enabled,c.relforcerowsecurity as forced,(select count(*)::int from pg_policy p where p.polrelid=c.oid) as policies from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=$1", [table.name])).rows;
    assert.deepEqual(rls, [{ enabled: table.rls, forced: false, policies: 0 }]);
    const columns = (await client.query("select a.attname as name,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull as not_null,(d.oid is not null) as default_expected from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where n.nspname='public' and c.relname=$1 and a.attnum>0 and not a.attisdropped order by a.attname", [table.name])).rows;
    assert.deepEqual(columns, table.columns);
    const constraints = (await client.query("select conname as name,contype as type from pg_constraint where conrelid=to_regclass($1) order by conname", [`public.${table.name}`])).rows;
    assert.deepEqual(constraints, table.constraints);
    const indexes = (await client.query("select idx.relname as name,i.indisunique as \"unique\",i.indisvalid as valid,(i.indpred is not null) as partial,array(select a.attname::text from unnest(i.indkey) with ordinality k(attnum,ord) left join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.attnum where k.ord<=i.indnkeyatts order by k.ord) as keys from pg_index i join pg_class t on t.oid=i.indrelid join pg_namespace n on n.oid=t.relnamespace join pg_class idx on idx.oid=i.indexrelid where n.nspname='public' and t.relname=$1 order by idx.relname", [table.name])).rows;
    assert.deepEqual(indexes, table.indexes);
  }
  const extra = (await client.query("select (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal)::int as triggers,(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public')::int as functions")).rows[0];
  assert.deepEqual(extra, { triggers: 0, functions: 0 });
  const relations = (await client.query("select relname,relkind from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind not in ('r','i') order by relname")).rows;
  assert.deepEqual(relations, [{ relname: 'kitchen_tickets_position_seq', relkind: 'S' }]);
  return tables.map(table => table.name);
}
export async function counts(client, tables) {
  const result = {};
  for (const table of tables) {
    assert.match(table, /^[a-z_][a-z0-9_]*$/);
    const rows = (await client.query(`select count(*) as n from public."${table}"`)).rows;
    assert.equal(rows.length, 1);
    assert.match(String(rows[0].n), /^(0|[1-9][0-9]*)$/);
    const value = Number(rows[0].n); assert.ok(Number.isSafeInteger(value)); result[table] = value;
  }
  return result;
}
export async function identity(client) {
  const rows = (await client.query("select current_database() as database,current_user as role,inet_server_addr()::text as address,inet_server_port() as port,pg_backend_pid() as pid,current_setting('transaction_read_only') as readonly")).rows;
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.ok(typeof row.database === 'string' && row.database.length > 0 && typeof row.role === 'string' && row.role.length > 0);
  assert.ok(typeof row.address === 'string' && row.address.length > 0 && Number.isInteger(row.port) && row.port > 0);
  assert.ok(Number.isInteger(row.pid) && row.pid > 0); assert.equal(row.readonly, 'on');
  return row;
}
export const fingerprint = row => sha256(JSON.stringify([row.database, row.role, row.address, row.port]));

// catalogVerified denotes this bounded names/columns/index-attributes gate only.
// It does not establish CHECK/FK/index expression semantics or default expressions.
export async function baseline(one, two, stage, expectedTarget) {
  await expectedBaseline(stage); // reject invalid stage before connecting
  if (expectedTarget !== undefined) assert.match(expectedTarget, /^[a-f0-9]{64}$/);
  const clients = [];
  try {
    for (const pool of [one, two]) {
      const client = await pool.connect(); clients.push(client);
      await client.query('begin isolation level repeatable read read only');
    }
    const a = await identity(clients[0]), b = await identity(clients[1]);
    const target = fingerprint(a); assert.equal(target, fingerprint(b)); assert.notEqual(a.pid, b.pid);
    if (expectedTarget !== undefined) assert.equal(target, expectedTarget);
    const observations = [];
    for (const client of clients) {
      const installed = await history(client, stage), tables = await shape(client, stage), before = await counts(client, tables);
      assert.ok(Object.values(before).every(value => value === 0));
      observations.push({ history: installed, tables, counts: before });
    }
    assert.deepEqual(observations[0], observations[1]);
    return { stage, fingerprint: target, readOnly: true, distinctBackends: true, ...observations[0],
      structureVerified: true, catalogVerified: true };
  } finally {
    let releaseFailed = false;
    for (const client of clients) {
      try { await client.query('rollback'); } catch { releaseFailed = true; }
      try { client.release(); } catch { releaseFailed = true; }
    }
    if (releaseFailed) throw new Error('CS02_BASELINE_RELEASE_FAILED');
  }
}
export function safeFailure(error, stage) {
  const sqlstate = [error, error?.cause, error?.cause?.cause].map(item => item?.code).find(code => typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code));
  return { stage, category: error instanceof assert.AssertionError ? 'assertion' : 'operation', ...(sqlstate ? { sqlstate } : {}) };
}
