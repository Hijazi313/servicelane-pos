// Offline-importable refusal, inspection and child controls; no config or driver imports.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sha256, counts, failure } from './or01-controls.mjs';
export { sha256, counts, failure };
export const tags = ['0000_business_bootstrap', '0001_staff_access', '0002_login_reservations', '0003_menu_catalogue', '0004_order_capture', '0005_kitchen_handoff'];
export function authorize(env, version) {
  if (!['baseline', 'execute'].includes(env.KT01_MODE) || env.KT01_TEST_TARGET !== 'YES' || env.KT01_EXCLUSIVE !== 'YES'
    || !/^v24\./.test(version) || Number(version.split('.')[1]) < 21
    || (env.KT01_MODE === 'execute' && !/^[a-f0-9]{64}$/.test(env.KT01_EXPECTED_TARGET ?? ''))) throw new Error('Explicit KT-01 target and execution permission required');
}
export async function history(client, root, count) {
  const journal = JSON.parse(await readFile(`${root}/apps/api/migrations/meta/_journal.json`, 'utf8'));
  assert.deepEqual(journal.entries.map(entry => entry.tag), tags);
  const rows = (await client.query('select hash,created_at from drizzle.__drizzle_migrations order by created_at')).rows;
  assert.equal(rows.length, count);
  for (const [i, row] of rows.entries()) {
    assert.equal(row.hash, sha256(await readFile(`${root}/apps/api/migrations/${tags[i]}.sql`)));
    assert.equal(String(row.created_at), String(journal.entries[i].when));
  }
  return rows.map((row, i) => ({ tag: tags[i], hash: row.hash, timestamp: String(row.created_at) }));
}
export async function shape(client, root, version) {
  const snapshot = JSON.parse(await readFile(`${root}/apps/api/migrations/meta/${version}_snapshot.json`, 'utf8'));
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
  const unexpected = (await client.query("select (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal)::int as triggers,(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public')::int as functions")).rows[0];
  assert.deepEqual(unexpected, { triggers: 0, functions: 0 });
  const objects = (await client.query("select relname,relkind from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind not in ('r','i') order by relname")).rows;
  assert.deepEqual(objects, version === '0005' ? [{ relname: 'kitchen_tickets_position_seq', relkind: 'S' }] : []);
  if (version === '0005') {
    const row = (await client.query("select pg_get_expr(d.adbin,d.adrelid) as value from pg_attrdef d join pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum where d.adrelid='public.kitchen_tickets'::regclass and a.attname='position'")).rows[0];
    assert.equal(row.value, "nextval('kitchen_tickets_position_seq'::regclass)");
  }
  return tables.map(table => table.name).sort();
}
export async function baseline(one, two, root, expectedTarget) {
  const clients = [];
  try {
    for (const pool of [one, two]) {
      const client = await pool.connect(); clients.push(client);
      await client.query('begin isolation level repeatable read read only');
    }
    const identities = [];
    for (const client of clients) identities.push((await client.query("select current_database() as database,current_user as role,inet_server_addr()::text as address,inet_server_port() as port,pg_backend_pid() as pid,current_setting('transaction_read_only') as readonly,current_setting('server_version') as version")).rows[0]);
    const [a, b] = identities;
    for (const key of ['database', 'role', 'address', 'port']) assert.equal(a[key], b[key]);
    assert.notEqual(a.pid, b.pid); assert.equal(a.readonly, 'on'); assert.equal(b.readonly, 'on');
    const targetFingerprint = sha256(JSON.stringify([a.database, a.role, a.address, a.port]));
    if (expectedTarget) assert.equal(targetFingerprint, expectedTarget);
    const tables = await shape(clients[0], root, '0004');
    const before = await counts(clients[0], tables);
    assert.ok(Object.values(before).every(count => count === 0));
    return { targetFingerprint, serverVersion: a.version, tables, before, history: await history(clients[0], root, 5) };
  } finally {
    const errors = [];
    for (const client of clients) { try { await client.query('rollback'); } catch (error) { errors.push(error); } finally { client.release(); } }
    if (errors.length) throw errors[0];
  }
}
export async function runChild(spawn, executable, path, env, input, timeoutMs = 30000) {
  const child = spawn(executable, [path], { env, stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '', overflow = false, timedOut = false;
  child.stdout.on('data', chunk => { if (output.length + chunk.length <= 256) output += chunk; else { overflow = true; child.kill('SIGKILL'); } });
  child.stderr.resume();
  const done = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', code => code === 0 ? resolve() : reject(new Error('Fresh process failed'))); });
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
  child.stdin.on('error', () => {}); child.stdin.end(JSON.stringify(input));
  try { await done; assert.equal(timedOut, false); assert.equal(overflow, false); assert.equal(output.trim(), 'KT01 restart passed'); }
  finally { clearTimeout(timer); }
}
