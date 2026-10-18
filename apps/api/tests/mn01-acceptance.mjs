// Manual, separately authorized database acceptance. Never imported by automatic tests.
import assert from 'node:assert/strict';
import { createHash, randomUUID, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
if (process.env.MN01_ACCEPT_STAGING !== 'YES') throw new Error('Explicit MN-01 execution authorization required');
if (!/^v24\./.test(process.version) || Number(process.version.split('.')[1]) < 21) throw new Error('Supported Node 24 >=24.21.0 required');
if (process.env.MN01_TARGET !== 'existing-env-disposable') throw new Error('Explicit disposable target acknowledgement required');
const { Pool } = await import('pg');
const { drizzle } = await import('drizzle-orm/node-postgres');
const { sql } = await import('drizzle-orm');
const { migrate } = await import('drizzle-orm/node-postgres/migrator');
const { PostgresMenuStore } = await import('../dist/menu-check/modules/menu/infrastructure/menu-store.js');
const { MenuService } = await import('../dist/menu-check/modules/menu/application/menu.service.js');
const { readConfiguration } = await import('../dist/menu-check/infrastructure/configuration.js');
const { inTransaction, transactionDatabase } = await import('../dist/menu-check/infrastructure/database/transaction.js');
const { BusinessService } = await import('../dist/menu-check/modules/business/public.js');
const { AccessService } = await import('../dist/menu-check/modules/authentication/public.js');
const { PostgresAccessStore } = await import('../dist/menu-check/modules/authentication/infrastructure/access-store.js');
const { digest, token } = await import('../dist/menu-check/modules/authentication/application/access-policy.js');
const { hashInitialPassword } = await import('../dist/menu-check/modules/authentication/infrastructure/password-hash.js');
const root = resolve(import.meta.dirname, '../../..');
const hash = data => createHash('sha256').update(data).digest('hex');
const config = readConfiguration(process.env);
const tag = `mn01.${randomUUID()}`;
const reportPath = resolve(root, 'apps/api/tests/evidence', `${tag}.json`);
const ledgerPath = resolve(root, 'apps/api/tests/evidence', `${tag}.ledger.json`);
const tables = ['access_limits','access_prelogins','access_security_events','access_sessions','branches','businesses','installation_binding','staff_accounts','staff_branch_grants','staff_credentials'].sort();
const menuTables = ['menu_offerings','menu_references','menu_variants'];
const report = { tag, startedAt: new Date().toISOString(), authorization: 'manual opt-in; operator must retain separate execution approval', runtime: process.version, gate: 'unrun', results: [], cleanup: 'not required', maximumConnections: 2, tlsVerified: config.database.ssl.rejectUnauthorized, source: [] };
const ledger = { tag, accountId: randomUUID(), sessionDigests: [], setupAttempted: false };
const saveLedger = () => writeFile(ledgerPath, JSON.stringify(ledger, null, 2)+'\n', { mode: 0o600 });
const sourcePaths = [
  'apps/api/tests/mn01-acceptance.mjs', 'apps/api/tests/mn01-restart.mjs',
  'apps/api/migrations/meta/_journal.json',
  ...['0000_business_bootstrap','0001_staff_access','0002_login_reservations','0003_menu_catalogue'].map(x=>`apps/api/migrations/${x}.sql`),
  ...['modules/menu/application/menu.service','modules/menu/infrastructure/menu-store','modules/menu/domain/catalogue',
      'modules/authentication/application/access.service','modules/authentication/infrastructure/access-store',
      'modules/business/infrastructure/business.service','infrastructure/database/transaction'].flatMap(x=>[
        `apps/api/src/${x}.ts`, `apps/api/dist/menu-check/${x}.js`]),
];
for (const path of sourcePaths) report.source.push({ path, sha256: hash(await readFile(resolve(root,path))) });
const options = { ...config.database, max: 1, application_name: 'mn01-bounded-acceptance', connectionTimeoutMillis: 15000, query_timeout: 35000, options: '-c statement_timeout=30000 -c lock_timeout=20000' };
const one = new Pool(options), two = new Pool(options);
for (const pool of [one,two]) pool.on('error', () => { report.idleConnectionError = true; });
const database = { db: drizzle({ client: one }) };
const business = new BusinessService(database);
const store = new PostgresAccessStore(database); // No Nest lifecycle/cleanup timer.
const menu = new MenuService(new PostgresMenuStore(database));
const otherDatabase = drizzle({ client: two });
const otherMenu = new MenuService(new PostgresMenuStore({ db: otherDatabase }));
const access = new AccessService(store, business, {}); // No login/credential work in checks.
let stage = 'gate', setupCommitted = false, secondClosed = false;
const counts = async connection => {
  const result = {};
  for (const table of (report.migration === 'passed' ? [...tables,...menuTables] : tables)) result[table] = Number((await connection.query(`select count(*) as n from public.${table}`)).rows[0].n);
  return result;
};
// Structural gate supplements migration hashes; it is not a full schema-drift auditor.
async function checkShape(client,version) {
  const snapshot=JSON.parse(await readFile(resolve(root,`apps/api/migrations/meta/${version}_snapshot.json`),'utf8'));
  for (const table of Object.values(snapshot.tables)) {
    const columns=(await client.query("select a.attname as name,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull as not_null from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=$1 and a.attnum>0 and not a.attisdropped order by a.attname",[table.name])).rows;
    const normalize=type=>type.replace(/^varchar/, 'character varying');
    assert.deepEqual(columns,Object.values(table.columns).map(c=>({name:c.name,type:normalize(c.type),not_null:c.notNull})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0));
    const actual=(await client.query("select conname from pg_constraint where conrelid=to_regclass($1) order by conname",['public.'+table.name])).rows.map(r=>r.conname);
    const expected=[...Object.keys(table.foreignKeys),...Object.keys(table.compositePrimaryKeys),...Object.keys(table.uniqueConstraints),...Object.keys(table.checkConstraints)];
    if(Object.values(table.columns).some(c=>c.primaryKey)) expected.push(table.name+'_pkey');
    assert.deepEqual(actual,expected.sort());
  }
}
const proofB = { session: token(), csrf: token() }, proofC = { session: token(), csrf: token() };
ledger.sessionDigests = [proofB, proofC].map(p => digest(p.session));
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
    const acceptedTarget=JSON.parse(await readFile(resolve(root,'apps/api/tests/evidence/mn00.062f6e66-871f-4d22-b040-376c2ac0659d.json'),'utf8'));
    assert.equal(report.targetFingerprint,acceptedTarget.targetFingerprint,'Target differs from reviewed MN-00 target');
    report.serverVersion = l.version;
    const actual = (await a.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(row => row.tablename);
    assert.deepEqual(actual,tables);
    report.baseline = await counts(a); assert.ok(Object.values(report.baseline).every(n => n===0));
    const journal = JSON.parse(await readFile(resolve(root,'apps/api/migrations/meta/_journal.json'),'utf8'));
    const history = (await a.query('select hash,created_at from drizzle.__drizzle_migrations order by created_at')).rows;
    assert.deepEqual(journal.entries.map(e=>e.tag), ['0000_business_bootstrap','0001_staff_access','0002_login_reservations','0003_menu_catalogue']);
    assert.equal(history.length,3);
    for (const [i,entry] of journal.entries.slice(0,3).entries()) {
      assert.equal(history[i].hash,hash(await readFile(resolve(root,`apps/api/migrations/${entry.tag}.sql`))));
      assert.equal(String(history[i].created_at),String(entry.when));
    }
    await checkShape(a,'0002');
    report.gate='passed'; report.migrationCount=history.length;
    report.secondBackendPid=r.pid;
  } finally {
    for (const client of clients) { try { await client.query('rollback'); } finally { client.release(); } }
  }
  stage='migration';
  await migrate(database.db,{migrationsFolder:resolve(root,'apps/api/migrations')});
  report.migration='passed';
  const postHistory=(await one.query('select hash,created_at from drizzle.__drizzle_migrations order by created_at')).rows;
  assert.equal(postHistory.length,4);
  const journal=JSON.parse(await readFile(resolve(root,'apps/api/migrations/meta/_journal.json'),'utf8'));
  assert.equal(postHistory[3].hash,hash(await readFile(resolve(root,'apps/api/migrations/0003_menu_catalogue.sql'))));
  assert.equal(String(postHistory[3].created_at),String(journal.entries[3].when));
  assert.deepEqual((await one.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(r=>r.tablename),[...tables,...menuTables].sort());
  assert.ok(Object.values(await counts(one)).every(n=>n===0));
  await checkShape(one,'0003');
  record('M01');
  stage='fixture';
  await mkdir(resolve(root,'apps/api/tests/evidence'), { recursive: true });
  await saveLedger();
  const credentialHash = await hashInitialPassword(randomBytes(24).toString('base64url'));
  ledger.setupAttempted=true; await saveLedger();
  await store.run(async unit => {
    for (const table of [...tables,...menuTables]) {
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
  const run = work => access.runAuthorized(proofC,'administrator',work);
  const edit = row => { const {id,revision,currencyCode,scale,...input}=structuredClone(row); return input; };
  const itemInput = name => ({kind:'item',name,active:true,sized:false,variants:[{name:'Default',price:'100.00',active:true}],addOnGroups:[]});
  const comboInput = variantId => ({kind:'combo',name:tag+'.combo',active:true,basePrice:'650.00',components:[{variantId,quantity:1}],choiceGroups:[{name:'Choice',minimum:1,maximum:1,options:[{name:'Option',variantId,quantity:1,surcharge:'30.00',active:true}]}]});
  let context;
  const first = await run(async scope => { context=scope.installation; return menu.save(scope,{definition:itemInput(tag+'.item')}); });
  const second = await run(scope=>menu.save(scope,{definition:itemInput(tag+'.other')}));
  const meal = await run(scope=>menu.save(scope,{definition:comboInput(first.variants[0].id)}));
  ledger.offeringIds=[first.id,second.id,meal.id]; await saveLedger();
  assert.deepEqual(await menu.get(context,first.id,true),first);
  assert.equal((await one.query('select count(*)::int as n from menu_variants where business_id=$1',[ledger.businessId])).rows[0].n,2);
  assert.equal((await one.query('select count(*)::int as n from menu_references where business_id=$1',[ledger.businessId])).rows[0].n,1);
  // Exercise all three installed ownership FKs in transactions that must abort.
  for (const query of [
    sql`insert into menu_variants values (${ledger.businessId}::uuid,${randomUUID()}::uuid,${randomUUID()}::uuid)`,
    sql`insert into menu_references values (${ledger.businessId}::uuid,${randomUUID()}::uuid,${first.variants[0].id}::uuid)`,
    sql`insert into menu_references values (${ledger.businessId}::uuid,${meal.id}::uuid,${randomUUID()}::uuid)`,
  ]) await assert.rejects(inTransaction(database.db,tx=>transactionDatabase(tx).execute(query)),error=>(error.cause?.code??error.code)==='23503');
  record('P01');
  stage='rollback';
  const persistentState=async()=>{
    const out={};
    for(const table of menuTables) out[table]=(await one.query(`select row_to_json(t) as row from public.${table} t where business_id=$1 order by row_to_json(t)::text`,[ledger.businessId])).rows;
    out.activity=(await one.query('select last_activity_at from access_sessions where digest=$1',[digest(proofC.session)])).rows;
    return out;
  };
  const actualStore=new PostgresMenuStore(database), fault=new Error('owned acceptance fault');
  const failingMenu=new MenuService({read:(...args)=>actualStore.read(...args),save:async(...args)=>{await actualStore.save(...args);throw fault;}});
  for(const row of [first,meal]) {
    const before=await persistentState(), input=edit(row);
    if(row.kind==='item') {input.sized=true;input.variants.push({name:'New',price:'200.00',active:true});}
    else input.components=[{variantId:second.variants[0].id,quantity:1}];
    await assert.rejects(run(scope=>failingMenu.save(scope,{definition:input,expectedRevision:row.revision},row.id)),error=>error===fault);
    assert.deepEqual(await persistentState(),before);
  }
  record('R01');
  // Name the contender inside its own transaction, before MN-00 takes its lock.
  const contenderDb={transaction:work=>otherDatabase.transaction(async tx=>{
    await tx.execute(sql`select set_config('application_name',${tag+'.contender'},true)`); return work(tx);
  })};
  const contenderAccess=new AccessService(new PostgresAccessStore({db:contenderDb}),business,{});
  async function ordered(left,right,whileHeld) {
    let outcome;
    try {
      const result=await run(async scope=>{
        const value=await left(scope), tx=transactionDatabase(scope.transaction);
        const pid=(await tx.execute(sql`select pg_backend_pid() as pid`)).rows[0].pid;
        outcome=contenderAccess.runAuthorized(proofB,'administrator',right).then(value=>({value}),error=>({error}));
        const deadline=Date.now()+10000; let blocked=false;
        while(Date.now()<deadline) {
          await tx.execute(sql`select pg_stat_clear_snapshot()`);
          const result=await tx.execute(sql`select exists(select 1 from pg_stat_activity a join pg_locks l on a.pid=l.pid where a.application_name=${tag+'.contender'} and l.locktype='advisory' and not l.granted and ${pid}::int=any(pg_blocking_pids(a.pid))) as blocked`);
          if(result.rows[0].blocked){blocked=true;break;}
          await new Promise(resolve=>setImmediate(resolve));
        }
        assert.ok(blocked,'Contender must actually wait on first transaction');
        if(whileHeld) await whileHeld(scope);
        return value;
      });
      return [result,await outcome];
    } finally { if(outcome){await outcome;} }
  }
  stage='edit-concurrency';
  const [winner,loser]=await ordered(
    scope=>menu.save(scope,{definition:{...edit(first),name:tag+'.winner'},expectedRevision:1},first.id),
    scope=>otherMenu.save(scope,{definition:{...edit(first),name:tag+'.loser'},expectedRevision:1},first.id));
  assert.equal(winner.revision,2); assert.equal(loser.error?.status,409);
  assert.equal((await menu.get(context,first.id,true)).name,tag+'.winner'); record('C01');
  const [a,b]=await ordered(
    scope=>menu.save(scope,{definition:edit(winner),expectedRevision:2},first.id),
    scope=>otherMenu.save(scope,{definition:edit(second),expectedRevision:1},second.id));
  assert.equal(a.revision,3); assert.equal(b.value?.revision,2); record('C02');
  stage='dependency-concurrency';
  const [saved,deactivated]=await ordered(
    scope=>menu.save(scope,{definition:edit(meal),expectedRevision:1},meal.id),
    scope=>otherMenu.deactivate(scope,first.id,{expectedRevision:3}));
  assert.equal(saved.revision,2); assert.equal(deactivated.value?.active,false);
  assert.ok(!(await menu.list(context)).some(row=>row.id===meal.id));
  await assert.rejects(run(scope=>menu.resolve(scope,{offeringId:meal.id,choices:[{groupId:meal.choiceGroups[0].id,optionIds:[meal.choiceGroups[0].options[0].id]}]})),error=>error.status===409);
  // Reactivate only this synthetic dependency to exercise the reverse ordering.
  const inactive=await menu.get(context,first.id,true);
  const active=await run(scope=>menu.save(scope,{definition:{...edit(inactive),active:true},expectedRevision:inactive.revision},first.id));
  const [off,denied]=await ordered(
    scope=>menu.deactivate(scope,first.id,{expectedRevision:active.revision}),
    scope=>otherMenu.save(scope,{definition:edit(saved),expectedRevision:2},meal.id));
  assert.equal(off.active,false); assert.equal(denied.error?.status,409);
  assert.deepEqual(await menu.get(context,meal.id,true),saved); record('C03');
  await run(scope=>menu.save(scope,{definition:{...edit(off),active:true},expectedRevision:off.revision},first.id));
  stage='coherent-reads';
  const selection={offeringId:meal.id,choices:[{groupId:meal.choiceGroups[0].id,optionIds:[meal.choiceGroups[0].options[0].id]}]};
  const changed=edit(saved); changed.basePrice='700.00'; changed.choiceGroups[0].options[0].surcharge='45.00';
  // GET-style reads do not take the write lock. Start the SELECT while update is uncommitted.
  await run(async scope=>{
    await menu.save(scope,{definition:changed,expectedRevision:2},meal.id);
    const snapshot=await otherMenu.list(context,true);
    assert.deepEqual(snapshot.find(row=>row.id===meal.id),saved);
  });
  const {resolveSelection}=await import('../dist/menu-check/modules/menu/domain/catalogue.js');
  assert.equal(resolveSelection(selection,await menu.list(context,true)).total,'745.00');
  const newer=await menu.get(context,meal.id,true), changedAgain=edit(newer);
  changedAgain.basePrice='800.00'; changedAgain.choiceGroups[0].options[0].surcharge='55.00';
  const [,resolution]=await ordered(
    scope=>menu.save(scope,{definition:changedAgain,expectedRevision:3},meal.id),
    scope=>otherMenu.resolve(scope,selection));
  assert.equal(resolution.value?.total,'855.00'); record('C04');
  stage='restart';
  await two.end(); secondClosed=true;
  const expected=await menu.list(context,true);
  const {spawn}=await import('node:child_process');
  for(let restart=0;restart<2;restart++) {
    const child=spawn(process.execPath,[resolve(root,'apps/api/tests/mn01-restart.mjs')],{env:process.env,stdio:['pipe','pipe','pipe']});
    let output=''; child.stdout.on('data',chunk=>{output+=chunk;});
    child.stderr.resume(); // Never publish raw driver/framework diagnostics.
    const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Restart probe failed')));});
    const timeout=setTimeout(()=>child.kill('SIGTERM'),30000);
    child.stdin.on('error',()=>{});
    child.stdin.end(JSON.stringify({proof:proofC,expected,selection,expectedTotal:'855.00'}));
    try {await done;assert.equal(output.trim(),'MN01 restart passed');} finally {clearTimeout(timeout);}
  }
  report.restartProcesses=2;
  assert.deepEqual(await menu.list(context,true),expected); record('P02');
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
          const owned=await tx.execute(sql`select definition->>'name' as name from menu_offerings where business_id=${ledger.businessId}::uuid`);
          assert.ok(owned.rows.every(row=>row.name.startsWith(tag+'.')));
          for (const table of ['menu_references','menu_variants','menu_offerings']) {
            await tx.execute(sql.raw(`delete from public.${table} where business_id='${ledger.businessId}'::uuid`));
          }
          await tx.execute(sql`delete from public.access_sessions where account_id=${ledger.accountId}::uuid and business_id=${ledger.businessId}::uuid and digest in (${sql.join(ledger.sessionDigests.map(value=>sql`${value}`),sql`,`)})`);
          await tx.execute(sql`delete from public.staff_branch_grants where account_id=${ledger.accountId}::uuid and business_id=${ledger.businessId}::uuid and branch_id=${ledger.branchId}::uuid`);
          await tx.execute(sql`delete from public.staff_credentials where account_id=${ledger.accountId}::uuid`);
          await tx.execute(sql`delete from public.staff_accounts where id=${ledger.accountId}::uuid and business_id=${ledger.businessId}::uuid`);
          await tx.execute(sql`delete from public.installation_binding where singleton=1 and business_id=${ledger.businessId}::uuid and branch_id=${ledger.branchId}::uuid`);
          await tx.execute(sql`delete from public.branches where id=${ledger.branchId}::uuid and business_id=${ledger.businessId}::uuid`);
          await tx.execute(sql`delete from public.businesses where id=${ledger.businessId}::uuid and name=${tag}`);
        } else assert.equal(setupCommitted,false);
      });
      report.afterCleanup=await counts(one);
      assert.ok(Object.values(report.afterCleanup).every(n=>n===0));
      await checkShape(one,'0003');
      assert.equal(Number((await one.query('select count(*)::int as n from drizzle.__drizzle_migrations')).rows[0].n),4);
      report.cleanup='passed';
    } catch {report.cleanup='failed; ledger retained for ownership review';process.exitCode=1;}
  }
  await Promise.all([one.end(),...(secondClosed?[]:[two.end()])]);
  if(report.idleConnectionError) process.exitCode=1;
  report.finishedAt=new Date().toISOString();
  await mkdir(resolve(root,'apps/api/tests/evidence'), { recursive: true });
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({report:reportPath,gate:report.gate,results:report.results,cleanup:report.cleanup,...(report.failure?{failure:report.failure}:{})}));
}
