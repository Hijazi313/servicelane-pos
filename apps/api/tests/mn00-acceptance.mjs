// Manual opt-in only; never imported by automatic tests. No migration or provisioning CLI.
import assert from 'node:assert/strict';
import { createHash, randomUUID, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
if (process.env.MN00_ACCEPT_STAGING !== 'YES') throw new Error('Explicit MN-00 execution authorization required');
if (!/^v24\./.test(process.version) || Number(process.version.split('.')[1]) < 21) throw new Error('Supported Node 24 >=24.21.0 required');
const { Pool } = await import('pg');
const { drizzle } = await import('drizzle-orm/node-postgres');
const { sql } = await import('drizzle-orm');
const { readConfiguration } = await import('../dist/ba02-check/infrastructure/configuration.js');
const { inTransaction, transactionDatabase } = await import('../dist/ba02-check/infrastructure/database/transaction.js');
const { BusinessService } = await import('../dist/ba02-check/modules/business/public.js');
const { AccessService } = await import('../dist/ba02-check/modules/authentication/public.js');
const { PostgresAccessStore } = await import('../dist/ba02-check/modules/authentication/infrastructure/access-store.js');
const { digest, token } = await import('../dist/ba02-check/modules/authentication/application/access-policy.js');
const { hashInitialPassword } = await import('../dist/ba02-check/modules/authentication/infrastructure/password-hash.js');
const root = resolve(import.meta.dirname, '../../..');
const hash = data => createHash('sha256').update(data).digest('hex');
const config = readConfiguration(process.env);
const tag = `mn00.${randomUUID()}`;
const reportPath = resolve(root, 'apps/api/tests/evidence', `${tag}.json`);
const ledgerPath = resolve(root, 'apps/api/tests/evidence', `${tag}.ledger.json`);
const tables = ['access_limits','access_prelogins','access_security_events','access_sessions','branches','businesses','installation_binding','staff_accounts','staff_branch_grants','staff_credentials'].sort();
const report = { tag, startedAt: new Date().toISOString(), authorizationDate: '2026-10-18', runtime: process.version, gate: 'unrun', results: [], cleanup: 'not required', maximumConnections: 2, tlsVerified: config.database.ssl.rejectUnauthorized, source: [] };
const ledger = { tag, accountId: randomUUID(), sessionDigests: [], setupAttempted: false };
const saveLedger = () => writeFile(ledgerPath, JSON.stringify(ledger, null, 2)+'\n', { mode: 0o600 });
const sourcePaths = [
  'apps/api/src/modules/authentication/application/access.service.ts',
  'apps/api/src/modules/authentication/application/authorized-operation.ts',
  'apps/api/src/modules/authentication/application/access-policy.ts',
  'apps/api/src/modules/authentication/infrastructure/access-store.ts',
  'apps/api/src/modules/authentication/infrastructure/schema.ts',
  'apps/api/src/modules/authentication/infrastructure/access-schema.ts',
  'apps/api/src/modules/business/infrastructure/business.service.ts',
  'apps/api/src/infrastructure/database/transaction.ts',
  'apps/api/tests/mn00-acceptance.mjs',
];
for (const path of sourcePaths) report.source.push({ path, sha256: hash(await readFile(resolve(root,path))) });
const options = { ...config.database, max: 1, application_name: 'mn00-bounded-acceptance', connectionTimeoutMillis: 15000, query_timeout: 35000, options: '-c statement_timeout=30000 -c lock_timeout=20000' };
const one = new Pool(options), two = new Pool(options);
for (const pool of [one,two]) pool.on('error', () => { report.idleConnectionError = true; });
const database = { db: drizzle({ client: one }) };
const business = new BusinessService(database);
const store = new PostgresAccessStore(database); // No Nest lifecycle/cleanup timer.
const otherDatabase = drizzle({ client: two });
// Identify the waiting backend inside its actual transaction; hosted transaction
// poolers may change backend PIDs after the read-only gate.
const otherStore = new PostgresAccessStore({ db: {
  transaction: work => otherDatabase.transaction(async tx => {
    await tx.execute(sql`select set_config('application_name', ${tag + '.revoker'}, true)`);
    return work(tx);
  }),
} });
const access = new AccessService(store, business, {}); // No login/credential work in checks.
let stage = 'gate', setupCommitted = false;
const counts = async connection => {
  const result = {};
  for (const table of tables) result[table] = Number((await connection.query(`select count(*) as n from public.${table}`)).rows[0].n);
  return result;
};
const failure401 = promise => assert.rejects(promise, error => error.status === 401);
const proofA = { session: token(), csrf: token() }, proofB = { session: token(), csrf: token() }, proofC = { session: token(), csrf: token() };
ledger.sessionDigests = [proofA, proofB, proofC].map(p => digest(p.session));
const record = id => report.results.push({ id, result: 'passed' });
try {
  assert.equal(config.database.connectionString, config.migrationDatabase.connectionString);
  // Both pools connect read-only first. No application data is printed or modified by the gate.
  const clients = [];
  try {
    clients.push(await one.connect()); clients.push(await two.connect());
    const [a,b] = clients;
    for (const client of [a,b]) await client.query('begin isolation level repeatable read read only');
    const identityQuery = "select current_database() as database,current_user as role,inet_server_addr()::text as address,inet_server_port() as port,pg_backend_pid() as pid,current_setting('transaction_read_only') as readonly,current_setting('server_version') as version";
    const [left,right] = await Promise.all([a.query(identityQuery),b.query(identityQuery)]);
    const l=left.rows[0],r=right.rows[0];
    for (const key of ['database','role','address','port']) assert.equal(l[key],r[key]);
    assert.equal(l.readonly,'on'); assert.equal(r.readonly,'on'); assert.notEqual(l.pid,r.pid);
    report.targetFingerprint = hash(JSON.stringify([l.database,l.role,l.address,l.port]));
    report.serverVersion = l.version;
    const actual = (await a.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(row => row.tablename);
    assert.deepEqual(actual,tables);
    report.baseline = await counts(a); assert.ok(Object.values(report.baseline).every(n => n===0));
    const journal = JSON.parse(await readFile(resolve(root,'apps/api/migrations/meta/_journal.json'),'utf8'));
    const history = (await a.query('select hash,created_at from drizzle.__drizzle_migrations order by created_at')).rows;
    assert.equal(history.length,journal.entries.length);
    for (const [i,entry] of journal.entries.entries()) {
      assert.equal(history[i].hash,hash(await readFile(resolve(root,`apps/api/migrations/${entry.tag}.sql`))));
      assert.equal(String(history[i].created_at),String(entry.when));
    }
    const columns = (await a.query("select column_name from information_schema.columns where table_schema='public' and table_name='access_limits'")).rows.map(row=>row.column_name);
    assert.ok(columns.includes('pending_ids'));
    report.gate='passed'; report.migrationCount=history.length;
    report.secondBackendPid=r.pid;
  } finally {
    for (const client of clients) { try { await client.query('rollback'); } finally { client.release(); } }
  }
  stage='fixture';
  await mkdir(resolve(root,'apps/api/tests/evidence'), { recursive: true });
  await saveLedger();
  const credentialHash = await hashInitialPassword(randomBytes(24).toString('base64url'));
  ledger.setupAttempted=true; await saveLedger();
  await store.run(async unit => {
    for (const table of tables) {
      const checked = await transactionDatabase(unit.context).execute(sql.raw(`select count(*) as n from public.${table}`));
      assert.equal(Number(checked.rows[0].n), 0, 'Application baseline changed before fixture setup');
    }
    const context=await business.createInitialBusiness({business:{name:tag,currencyCode:'PKR',timezone:'Asia/Karachi'},branch:{name:tag}},unit.context);
    ledger.businessId=context.businessId; ledger.branchId=context.branchId; await saveLedger();
    await unit.saveAccount({id:ledger.accountId,businessId:ledger.businessId,username:tag,displayName:tag,status:'active',role:'administrator',passwordChangeRequired:false,passwordHash:credentialHash,branchIds:[ledger.branchId]});
    const now = new Date(Date.now()-5000);
    for (const proof of [proofA,proofB,proofC]) await unit.saveSession({digest:digest(proof.session),businessId:ledger.businessId,accountId:ledger.accountId,csrfToken:proof.csrf,createdAt:now,lastActivityAt:now,revokedAt:null});
  });
  setupCommitted=true;
  stage='V01';
  await otherStore.run(async unit => {
    const session=await unit.getSession(digest(proofA.session)); await unit.saveSession({...session,revokedAt:new Date()});
  });
  let invoked=false;
  await failure401(access.runAuthorized(proofA,'administrator',async()=>{invoked=true;}));
  assert.equal(invoked,false); record('V01');
  stage='V02';
  let revocation, committedXid;
  await access.runAuthorized(proofB,'administrator',async scope=>{
    const tx=transactionDatabase(scope.transaction);
    const firstPid=(await tx.execute(sql`select pg_backend_pid() as pid`)).rows[0].pid;
    revocation=otherStore.run(async unit=>{
      const session=await unit.getSession(digest(proofB.session));
      await unit.saveSession({...session,revokedAt:new Date()});
    });
    // Attach rejection immediately; awaiting settlement happens after callback commits.
    revocation.catch(()=>{});
    stage='V02-observe-contention';
    const deadline=Date.now()+10000; let observed=false;
    while (Date.now()<deadline) {
      await tx.execute(sql`select pg_stat_clear_snapshot()`);
      const observation=await tx.execute(sql`select exists (
        select 1 from pg_locks l join pg_stat_activity a on a.pid=l.pid
        where l.locktype='advisory' and not l.granted
          and l.classid=20261012::oid and l.objid=2::oid
          and a.application_name=${tag + '.revoker'}
          and ${firstPid}::int = any(pg_blocking_pids(l.pid))
      ) as blocked`);
      if (observation.rows[0].blocked) {observed=true;break;}
      await new Promise(resolve=>setImmediate(resolve));
    }
    assert.ok(observed,'Expected backend blocking relation was not observed');
    report.lockContentionObserved=true;
    stage='V02-write-probe';
    stage='V02-create-probe';
    await tx.execute(sql`create temporary table mn00_probe (marker text primary key) on commit drop`);
    stage='V02-insert-probe';
    await tx.execute(sql`insert into mn00_probe(marker) values ('V02-committed')`);
    assert.equal(Number((await tx.execute(sql`select count(*) as n from mn00_probe`)).rows[0].n),1);
    stage='V02-capture-xid';
    committedXid=(await tx.execute(sql`select pg_current_xact_id()::text as xid`)).rows[0].xid;
  });
  await revocation;
  stage='V02-check-commit';
  report.callbackTransactionStatus=(await one.query('select pg_xact_status($1::xid8) as status',[committedXid])).rows[0].status;
  assert.equal(report.callbackTransactionStatus,'committed');
  await failure401(access.runAuthorized(proofB,'administrator',async()=>{throw new Error('must not execute');}));
  record('V02');
  stage='V03';
  const before=(await one.query('select last_activity_at from public.access_sessions where digest=$1',[digest(proofC.session)])).rows[0].last_activity_at;
  const conflict=new Error('synthetic consumer conflict'); let scope, abortedXid;
  await assert.rejects(access.runAuthorized(proofC,'administrator',async value=>{
    scope=value; const tx=transactionDatabase(scope.transaction);
    await tx.execute(sql`create temporary table mn00_probe (marker text primary key) on commit drop`);
    await tx.execute(sql`insert into mn00_probe(marker) values ('V03-rollback')`);
    assert.equal(Number((await tx.execute(sql`select count(*) as n from mn00_probe`)).rows[0].n),1);
    abortedXid=(await tx.execute(sql`select pg_current_xact_id()::text as xid`)).rows[0].xid;
    throw conflict;
  }),error=>error===conflict);
  report.failedCallbackTransactionStatus=(await one.query('select pg_xact_status($1::xid8) as status',[abortedXid])).rows[0].status;
  assert.equal(report.failedCallbackTransactionStatus,'aborted');
  const after=(await one.query('select last_activity_at from public.access_sessions where digest=$1',[digest(proofC.session)])).rows[0].last_activity_at;
  assert.equal(after.getTime(),before.getTime());
  assert.throws(()=>transactionDatabase(scope.transaction),/Inactive transaction context/);
  record('V03');
} catch(error) {
  const sqlstate=[error,error?.cause,error?.cause?.cause].map(value=>value?.code).find(value=>typeof value==='string' && /^[0-9A-Z]{5}$/.test(value));
  report.failure={stage, ...(sqlstate?{sqlstate}:{}),category:error instanceof assert.AssertionError ? 'assertion-failed' : 'sanitized-operation-failure', ...(typeof error?.code==='string' && /^[0-9A-Z]{5}$/.test(error.code) ? {sqlstate:error.code} : {})};
  process.exitCode=1;
} finally {
  if (ledger.setupAttempted) {
    try {
      // Cleanup is ID/tag-owned, transactional and serialized with all harness work.
      await inTransaction(database.db,async context=>{
        const tx=transactionDatabase(context);
        await tx.execute(sql`select pg_advisory_xact_lock(20261012,2)`);
        const businessRow=ledger.businessId ? (await tx.execute(sql`select name from public.businesses where id=${ledger.businessId}::uuid`)).rows : [];
        if (businessRow.length) {
          assert.equal(businessRow[0].name,tag);
          const account=(await tx.execute(sql`select business_id,display_name from public.staff_accounts where id=${ledger.accountId}::uuid`)).rows;
          assert.equal(account.length,1); assert.equal(account[0].business_id,ledger.businessId); assert.equal(account[0].display_name,tag);
          const branch=(await tx.execute(sql`select name,business_id from public.branches where id=${ledger.branchId}::uuid`)).rows;
          assert.equal(branch.length,1); assert.equal(branch[0].name,tag); assert.equal(branch[0].business_id,ledger.businessId);
          await tx.execute(sql`delete from public.access_sessions where account_id=${ledger.accountId}::uuid and business_id=${ledger.businessId}::uuid and digest in (${sql.join(ledger.sessionDigests.map(value=>sql`${value}`),sql`,`)})`);
          await tx.execute(sql`delete from public.staff_branch_grants where account_id=${ledger.accountId}::uuid and business_id=${ledger.businessId}::uuid and branch_id=${ledger.branchId}::uuid`);
          await tx.execute(sql`delete from public.staff_credentials where account_id=${ledger.accountId}::uuid`);
          await tx.execute(sql`delete from public.staff_accounts where id=${ledger.accountId}::uuid and business_id=${ledger.businessId}::uuid`);
          await tx.execute(sql`delete from public.installation_binding where singleton=1 and business_id=${ledger.businessId}::uuid and branch_id=${ledger.branchId}::uuid`);
          await tx.execute(sql`delete from public.branches where id=${ledger.branchId}::uuid and business_id=${ledger.businessId}::uuid`);
          await tx.execute(sql`delete from public.businesses where id=${ledger.businessId}::uuid and name=${tag}`);
        } else assert.equal(setupCommitted,false);
      });
      await one.query('drop table if exists pg_temp.mn00_probe');
      report.afterCleanup=await counts(one);
      assert.ok(Object.values(report.afterCleanup).every(n=>n===0));
      report.cleanup='passed';
    } catch {report.cleanup='failed; ledger retained for ownership review';process.exitCode=1;}
  }
  await Promise.all([one.end(),two.end()]);
  report.finishedAt=new Date().toISOString();
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({report:reportPath,gate:report.gate,results:report.results,cleanup:report.cleanup,...(report.failure?{failure:report.failure}:{})}));
}
