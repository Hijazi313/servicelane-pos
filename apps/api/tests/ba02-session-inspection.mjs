// Manual metadata-only diagnosis; never imported by automatic checks or acceptance writes.
import { writeFile } from 'node:fs/promises';
if (process.env.BA02_INSPECT_SESSIONS !== 'YES') throw new Error('Explicit session-inspection opt-in required');
const { Pool } = await import('pg');
const { readConfiguration } = await import('../dist/ba02-check/infrastructure/configuration.js');
const config = readConfiguration(process.env);
const pool = new Pool({ ...config.database, max: 1, application_name: 'ba02-readonly-session-inspection', connectionTimeoutMillis: 15000, query_timeout: 20000, options: '-c default_transaction_read_only=on -c statement_timeout=20000' });
const report = { inspectedAt: new Date().toISOString(), purpose: 'User-authorized read-only session metadata diagnosis; no acceptance writes or termination', tlsVerification: config.database.ssl.rejectUnauthorized, connectionMaximum: 1 };
pool.on('error', () => { report.idleConnectionError = true; });
let client;
try {
  client = await pool.connect();
  await client.query('begin read only');
  const { rows } = await client.query(`select application_name, state,
    usename = current_user as same_role_as_harness,
    case when left(usename,9)='supabase_' or usename in ('authenticator','pgbouncer','supavisor') then usename else 'unclassified' end as service_role,
    extract(epoch from (clock_timestamp() - backend_start))::bigint as connection_age_seconds,
    extract(epoch from (clock_timestamp() - xact_start))::bigint as transaction_age_seconds,
    extract(epoch from (clock_timestamp() - state_change))::bigint as state_age_seconds,
    wait_event_type, wait_event,
    backend_xid is not null as has_transaction_id,
    backend_xmin is not null as holds_snapshot
    from pg_stat_activity where datname=current_database()
      and backend_type='client backend' and pid <> pg_backend_pid()
    order by backend_start, pid`);
  report.sessions = rows.map((row, index) => ({ label: `session-${index + 1}`, ...row, application_name: row.application_name?.replace(/[\p{Cc}\p{Cs}]/gu, '').slice(0, 128) }));
  report.result = 'passed';
} catch (error) {
  report.result = 'failed';
  report.category = /^[A-Z0-9_]{2,40}$/.test(String(error.code)) ? error.code : 'connection-or-query-failure';
  process.exitCode = 1;
} finally {
  if (client) { await client.query('rollback').catch(() => {}); client.release(); }
  await pool.end();
  report.poolClosed = pool.ended && pool.totalCount === 0;
  await writeFile(new URL('./evidence/ba02-session-inspection.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
