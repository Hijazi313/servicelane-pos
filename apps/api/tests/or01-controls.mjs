// Offline-importable controls. No configuration, database imports or connections.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function authorize(env, version) {
  assert.equal(env.OR01_ACCEPT_STAGING, 'YES', 'Separate OR-01 write authorization required');
  assert.equal(env.OR01_TARGET, 'current-staging', 'Explicit staging target required');
  assert.equal(env.OR01_EXCLUSIVE, 'YES', 'Exclusive staging reservation required');
  assert.match(version, /^v24\./, 'Supported Node 24 required');
  assert.ok(Number(version.split('.')[1]) >= 21, 'Node >=24.21 required');
}
export function failure(error, stage) {
  const sqlstate = [error, error?.cause, error?.cause?.cause].map(e => e?.code).find(c => typeof c === 'string' && /^[0-9A-Z]{5}$/.test(c));
  return { stage, category: error instanceof assert.AssertionError ? 'assertion-failed' : 'operation-failed', ...(sqlstate ? { sqlstate } : {}) };
}
export async function shape(client, root, version) {
  const snapshot = JSON.parse(await readFile(`${root}/apps/api/migrations/meta/${version}_snapshot.json`, 'utf8'));
  const tables = Object.values(snapshot.tables);
  const actual = (await client.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(r => r.tablename);
  assert.deepEqual(actual, tables.map(t => t.name).sort());
  for (const table of tables) {
    const columns = (await client.query("select a.attname as name,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull as not_null from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=$1 and a.attnum>0 and not a.attisdropped order by a.attname", [table.name])).rows;
    assert.deepEqual(columns, Object.values(table.columns).map(c => ({ name: c.name, type: c.type.replace(/^varchar/, 'character varying'), not_null: c.notNull })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const names = (await client.query('select conname from pg_constraint where conrelid=to_regclass($1) order by conname', ['public.' + table.name])).rows.map(r => r.conname);
    const expected = [...Object.keys(table.foreignKeys), ...Object.keys(table.compositePrimaryKeys), ...Object.keys(table.uniqueConstraints), ...Object.keys(table.checkConstraints)];
    if (Object.values(table.columns).some(c => c.primaryKey)) expected.push(table.name + '_pkey');
    assert.deepEqual(names, expected.sort());
  }
  return tables.map(t => t.name).sort();
}
export async function counts(client, tables) {
  const result = {};
  for (const table of tables) {
    assert.match(table, /^[a-z_]+$/);
    result[table] = Number((await client.query(`select count(*) as n from public."${table}"`)).rows[0].n);
  }
  return result;
}
export async function history(client, root, expectedCount) {
  const journal = JSON.parse(await readFile(`${root}/apps/api/migrations/meta/_journal.json`, 'utf8'));
  assert.deepEqual(journal.entries.map(e => e.tag), ['0000_business_bootstrap', '0001_staff_access', '0002_login_reservations', '0003_menu_catalogue', '0004_order_capture']);
  const rows = (await client.query('select hash,created_at from drizzle.__drizzle_migrations order by created_at')).rows;
  assert.equal(rows.length, expectedCount);
  for (const [i, entry] of journal.entries.slice(0, expectedCount).entries()) {
    assert.equal(rows[i].hash, sha256(await readFile(`${root}/apps/api/migrations/${entry.tag}.sql`)));
    assert.equal(String(rows[i].created_at), String(entry.when));
  }
  return rows.map((row, i) => ({ tag: journal.entries[i].tag, hash: row.hash, timestamp: String(row.created_at) }));
}
export async function baseline(one, two, root, report) {
  const clients = [];
  try {
    for (const pool of [one, two]) {
      const client = await pool.connect(); clients.push(client);
      await client.query('begin isolation level repeatable read read only');
    }
    const identities = [];
    for (const c of clients) identities.push((await c.query("select current_database() as database,current_user as role,inet_server_addr()::text as address,inet_server_port() as port,pg_backend_pid() as pid,current_setting('transaction_read_only') as readonly,current_setting('server_version') as version")).rows[0]);
    const [a, b] = identities;
    for (const key of ['database', 'role', 'address', 'port']) assert.equal(a[key], b[key]);
    assert.notEqual(a.pid, b.pid); assert.equal(a.readonly, 'on'); assert.equal(b.readonly, 'on');
    const reviewed = JSON.parse(await readFile(`${root}/apps/api/tests/evidence/or01-readonly.2026-10-21.json`, 'utf8'));
    report.targetFingerprint = sha256(JSON.stringify([a.database, a.role, a.address, a.port]));
    assert.equal(report.targetFingerprint, reviewed.targetFingerprint);
    report.serverVersion = a.version;
    report.baseline = await counts(clients[0], await shape(clients[0], root, '0003'));
    assert.ok(Object.values(report.baseline).every(n => n === 0));
    report.historyBefore = await history(clients[0], root, 4);
    const unexpected = (await clients[0].query("select (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal)::int as triggers,(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public')::int as functions,(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind not in ('r','i'))::int as other_objects")).rows[0];
    assert.deepEqual(unexpected, { triggers: 0, functions: 0, other_objects: 0 });
    report.gate = 'passed';
  } finally {
    const errors = [];
    for (const c of clients) { try { await c.query('rollback'); } catch (e) { errors.push(e); } finally { c.release(); } }
    if (errors.length) throw errors[0];
  }
}
export async function runChild(spawn, executable, path, env, input, timeoutMs = 30000) {
  const child = spawn(executable, [path], { env, stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '', overflow = false, timedOut = false;
  child.stdout.on('data', chunk => { if (output.length + chunk.length <= 256) output += chunk; else { overflow = true; child.kill('SIGKILL'); } });
  child.stderr.resume();
  const done = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', code => code === 0 ? resolve() : reject(new Error('Restart probe failed'))); });
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
  child.stdin.on('error', () => {});
  child.stdin.end(JSON.stringify(input));
  try { await done; assert.equal(timedOut, false); assert.equal(overflow, false); assert.equal(output.trim(), 'OR01 restart passed'); }
  finally { clearTimeout(timer); }
}
