// Manual opt-in database WRITE harness. Never included in automatic test commands.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
if (process.env.BA03_ACCEPT_STAGING !== 'YES' || process.argv[2] !== '--single-target') throw new Error('Explicit staging-write opt-in and lifecycle mode required');
const { Pool } = await import('pg');
const { drizzle } = await import('drizzle-orm/node-postgres');
const { Module } = await import('@nestjs/common');
const { NestFactory, Reflector, APP_GUARD, APP_FILTER } = await import('@nestjs/core');
const { FastifyAdapter } = await import('@nestjs/platform-fastify');
const { readConfiguration } = await import('../dist/ba02-check/infrastructure/configuration.js');
const { BusinessService } = await import('../dist/ba02-check/modules/business/public.js');
const { PostgresAccessStore } = await import('../dist/ba02-check/modules/authentication/infrastructure/access-store.js');
const { AccessService } = await import('../dist/ba02-check/modules/authentication/application/access.service.js');
const { NodePasswordHasher } = await import('../dist/ba02-check/modules/authentication/infrastructure/password-hasher.js');
const { AccessController } = await import('../dist/ba02-check/modules/authentication/http/access.controller.js');
const { AccessBoundaryGuard, AccessExceptionFilter } = await import('../dist/ba02-check/modules/authentication/http/boundary.js');
const { AccessHttpConfiguration } = await import('../dist/ba02-check/modules/authentication/http/configuration.js');
const exec = promisify(execFile);
const root = resolve(import.meta.dirname, '../../..');
const digest = value => createHash('sha256').update(value).digest('hex');
const tag = `ba03-${randomUUID()}`;
const temp = await mkdtemp(join(tmpdir(), 'ba03-owned-'));
const ledgerPath = join(temp, 'ownership.json');
const ledger = { tag, business: null, branch: null, accounts: [], sessions: [], prelogins: [], limits: [], events: [], cliStarted: false };
const saveLedger = () => writeFile(ledgerPath, JSON.stringify(ledger), { mode: 0o600 });
await saveLedger();
const config = readConfiguration(process.env);
const pool = new Pool({ ...config.database, max: 1, application_name: tag, connectionTimeoutMillis: 15000, query_timeout: 20000, options: '-c statement_timeout=20000 -c lock_timeout=5000' });
pool.on('error', () => {});
const tables = ['access_limits','access_prelogins','access_security_events','access_sessions','branches','businesses','installation_binding','staff_accounts','staff_branch_grants','staff_credentials'];
const report = { startedAt: new Date().toISOString(), runTag: tag, results: [], cleanup: { result: 'not run' }, configuredConnectionCeiling: 6, remaining: 'Single-database subset; BB-AC03 and two-installation AA-AC05 remain pending. No BA-03 closeout.' };
let stage = 'entry';
let app;
let ownsBootstrap = false;
let attributionFailed = false;
let failPersistence = false;
let extraBranch;
let restoreGrant;
let restoreBinding = false;
const record = (id, check, result = 'passed') => report.results.push({ id, check, result });
const counts = async (connection = pool) => { const result={}; for(const name of tables) result[name]=Number((await connection.query(`select count(*) as n from public.${name}`)).rows[0].n); return result; };
const secrets = [randomBytes(24).toString('base64url'), randomBytes(24).toString('base64url'), randomBytes(24).toString('base64url')];
const ownedEvent = async (event, now) => {
  const rows = (await pool.query('select id from public.access_security_events where action=$1 and occurred_at=$2 and actor_id is not distinct from $3::uuid and target_id is not distinct from $4::uuid', [event.action, now, event.actorId ?? null, event.targetId ?? null])).rows;
  // Serial requests only in this mode; each tracked event is unique at its exact timestamp/action/targets.
  if (rows.length !== 1 || ledger.events.includes(rows[0].id)) { attributionFailed = true; throw new Error('Event attribution failed'); }
  ledger.events.push(rows[0].id); await saveLedger();
};
const db = { db: drizzle({ client: pool }) };
const business = new BusinessService(db);
const actualStore = new PostgresAccessStore(db); // Not registered in Nest lifecycle: no automatic timer in this mode.
const trackedStore = {
  run: async work => {
    if (failPersistence) throw new Error('Synthetic persistence failure');
    const events = [];
    try {
      const result = await actualStore.run(unit => work(new Proxy(unit, { get(target, key) {
        if (key === 'event') return async (event, now) => { await target.event(event, now); events.push([event, now]); };
        if (['saveAccount', 'saveSession', 'savePrelogin', 'saveLimit'].includes(key)) return async row => {
          if (key === 'saveAccount' && !ledger.accounts.includes(row.id)) {
            assert.equal(row.businessId, ledger.business); assert.ok(row.username.startsWith('ba03.')); ledger.accounts.push(row.id);
          }
          if (key === 'saveSession' && !ledger.sessions.includes(row.digest)) { assert.equal(row.businessId, ledger.business); ledger.sessions.push(row.digest); }
          if (key === 'savePrelogin' && !ledger.prelogins.includes(row.digest)) ledger.prelogins.push(row.digest);
          if (key === 'saveLimit' && !ledger.limits.some(item => item.kind === row.kind && item.key === row.key)) ledger.limits.push({ kind: row.kind, key: row.key });
          await saveLedger(); return target[key](row);
        };
        const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
      } })));
      for (const [event, now] of events) await ownedEvent(event, now);
      return result;
    } catch (error) { throw error; }
  }
};
const service = new AccessService(trackedStore, business, new NodePasswordHasher());
try {
  // Run the reviewed read-only gate again immediately before any fixture creation.
  stage = 'preflight';
  await exec(process.execPath, ['--env-file=.env', resolve(root,'apps/api/tests/ba03-preflight.mjs'), '--preflight-migrated'], { cwd: root, env: process.env, timeout: 90000 });
  const preflight = JSON.parse(await readFile(resolve(root,'apps/api/tests/evidence/ba03-preflight.json'), 'utf8'));
  assert.equal(preflight.preflight.result, 'passed'); report.candidate = preflight.candidate; report.runtime = preflight.runtime; report.tls = preflight.tls;
  assert.ok(Object.values(await counts()).every(value => value === 0));
  stage = 'bootstrap';
  const fixture = join(temp, 'installation.json');
  await writeFile(fixture, JSON.stringify({ business: { name: tag, currencyCode: 'PKR', timezone: 'Asia/Karachi' }, branch: { name: tag, address: 'Synthetic acceptance fixture' }, administrator: { username: 'ba03.owner', displayName: tag } }), { mode: 0o600 });
  ledger.cliStarted = true; await saveLedger();
  // Password travels only through protected process environment to PTY helper; helper strips it before CLI spawn.
  const cli = await exec('python3', [resolve(root,'apps/api/tests/acceptance-terminal.py'), process.execPath, resolve(root,'apps/api/dist/ba02-check/operator/provision-installation.js'), fixture], { env: { ...process.env, BA01_TEST_PASSWORD: secrets[0] }, timeout: 50000, maxBuffer: 16384 });
  assert.ok(!secrets.some(secret => cli.stdout.includes(secret) || cli.stderr.includes(secret)));
  const ids = JSON.parse(cli.stdout.split(/\r?\n/).find(line => line.startsWith('{')));
  ledger.business = ids.businessId; ledger.branch = ids.branchId; ledger.accounts.push(ids.accountId); await saveLedger(); ownsBootstrap = true;
  assert.equal((await pool.query('select name from public.businesses where id=$1', [ledger.business])).rows[0].name, tag);
  record('BA03-V01','Actual hidden-terminal setup creates synthetic business, branch and restricted administrator');
  class AcceptanceModule {}
  Module({ controllers: [AccessController], providers: [
    { provide: AccessService, useValue: service },
    { provide: AccessHttpConfiguration, useValue: new AccessHttpConfiguration('https://pos.test','pos.test',['127.0.0.1']) },
    { provide: APP_GUARD, useFactory: (reflector, configuration, access) => new AccessBoundaryGuard(reflector, configuration, access), inject: [Reflector, AccessHttpConfiguration, AccessService] },
    { provide: APP_FILTER, useClass: AccessExceptionFilter },
  ] })(AcceptanceModule);
  app = await NestFactory.create(AcceptanceModule, new FastifyAdapter({ trustProxy:['127.0.0.1'], bodyLimit:16384 }), { logger:false, abortOnError:false });
  await app.init(); await app.getHttpAdapter().getInstance().ready();
  const request = async (method, url, jar = {}, payload, overrides = {}) => {
    const headers = { host:'pos.test', origin:'https://pos.test', 'x-forwarded-proto':'https', ...(jar.cookie ? {cookie:jar.cookie} : {}), ...(jar.csrf ? {'x-csrf-token':jar.csrf} : {}), ...overrides };
    for (const key of Object.keys(headers)) if (headers[key] === undefined) delete headers[key];
    const response = await app.inject({ method, url:`/api/v1${url}`, headers, ...(payload === undefined ? {} : {payload}) });
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.ok(!secrets.some(secret => response.body.includes(secret))); assert.ok(!response.body.includes('$argon2'));
    return response;
  };
  const status = (response, expected) => { assert.equal(response.statusCode, expected); return response; };
  const absorb = response => {
    const cookies = [response.headers['set-cookie']].flat().filter(Boolean);
    for (const cookie of cookies) assert.ok(cookie.includes('; Secure; HttpOnly; SameSite=Strict') && !cookie.includes('Domain='));
    const cookie = cookies.filter(item => !item.includes('Max-Age=0')).map(item => item.split(';')[0]).join('; ');
    const body = response.json();
    assert.ok(!body.sessionToken); return {cookie,csrf:body.csrfToken,account:body.account};
  };
  const bootstrap = async () => absorb(status(await request('GET','/auth/csrf'),200));
  const login = async (username, password, expected = 200) => { const pre = await bootstrap(); const response = status(await request('POST','/auth/login',pre,{username,password}),expected); return expected === 200 ? absorb(response) : response; };
  stage = 'initial-password';
  let admin = await login('ba03.owner',secrets[0]);
  status(await request('GET','/context',admin),403);
  const before = (await pool.query('select password_hash from public.staff_credentials where account_id=$1',[ids.accountId])).rows[0].password_hash;
  status(await request('POST','/auth/password',admin,{currentPassword:secrets[0],newPassword:secrets[0]}),400);
  assert.equal((await pool.query('select password_hash from public.staff_credentials where account_id=$1',[ids.accountId])).rows[0].password_hash,before);
  assert.equal((await pool.query('select revoked_at from public.access_sessions where digest=$1',[digest(admin.cookie.split('=')[1])])).rows[0].revoked_at,null);
  const restricted = admin;
  admin = absorb(status(await request('POST','/auth/password',admin,{currentPassword:secrets[0],newPassword:secrets[1]}),200));
  assert.notEqual(admin.cookie,restricted.cookie);
  status(await request('GET','/context',restricted),401);
  status(await request('GET','/context',admin),200);
  record('BA03-V01','Initial restriction, unchanged-password rejection without credential/session mutation and valid rotation');
  stage = 'same-business-ungranted-branch';
  const staff = status(await request('POST','/staff',admin,{username:'ba03.staff',role:'staff',branchId:ledger.branch,password:secrets[0]}),201).json();
  let user = await login('ba03.staff',secrets[0]);
  user = absorb(status(await request('POST','/auth/password',user,{currentPassword:secrets[0],newPassword:secrets[1]}),200));
  status(await request('GET','/context',user),200);
  extraBranch = randomUUID(); ledger.extraBranch=extraBranch; await saveLedger();
  await pool.query('insert into public.branches(id,business_id,name) values($1,$2,$3)',[extraBranch,ledger.business,tag]);
  const beforeAccounts = JSON.stringify((await pool.query('select * from public.staff_accounts order by id')).rows);
  status(await request('POST','/staff',admin,{username:'ba03.denied',role:'staff',branchId:extraBranch,password:secrets[0]}),404);
  status(await request('PATCH',`/staff/${staff.id}`,admin,{branchId:extraBranch}),404);
  assert.equal(JSON.stringify((await pool.query('select * from public.staff_accounts order by id')).rows),beforeAccounts);
  assert.equal((await pool.query('select count(*)::int as n from public.staff_branch_grants where branch_id=$1',[extraBranch])).rows[0].n,0);
  restoreGrant=staff.id; ledger.restoreGrant=staff.id; await saveLedger();
  assert.equal((await pool.query('delete from public.staff_branch_grants where account_id=$1 and business_id=$2 and branch_id=$3',[staff.id,ledger.business,ledger.branch])).rowCount,1);
  try {
    status(await request('GET','/context',user),403);
    await login('ba03.staff',secrets[1],401);
  } finally {
    await pool.query('insert into public.staff_branch_grants(business_id,account_id,branch_id) values($1,$2,$3)',[ledger.business,staff.id,ledger.branch]);
    restoreGrant=undefined; ledger.restoreGrant=null; await saveLedger();
  }
  status(await request('GET','/context',user),200);
  record('BA03-V03','Actual same-business ungranted branch create/patch denied; removed staff grant denies context/login; exact grant restored');
  stage='missing-binding';
  restoreBinding=true;ledger.restoreBinding=true;await saveLedger();
  assert.equal((await pool.query('delete from public.installation_binding where business_id=$1 and branch_id=$2',[ledger.business,ledger.branch])).rowCount,1);
  const unavailable = response => {
    status(response,503);
    assert.deepEqual(response.json(),{statusCode:503,message:'Service unavailable'});
  };
  try {
    unavailable(await request('GET','/context',admin));
    unavailable(await request('GET','/auth/me',admin));
    unavailable(await request('PATCH',`/staff/${staff.id}`,admin,{displayName:'Must not write'}));
  } finally {
    await pool.query('insert into public.installation_binding(singleton,business_id,branch_id) values(1,$1,$2)',[ledger.business,ledger.branch]);
    restoreBinding=false;ledger.restoreBinding=false;await saveLedger();
  }
  status(await request('GET','/context',admin),200);
  const client=await pool.connect();
  try {
    await client.query('begin');
    await assert.rejects(client.query('update public.installation_binding set branch_id=$1 where business_id=$2',[randomUUID(),ledger.business]),error=>error.code==='23503');
  } finally {await client.query('rollback');client.release();}
  status(await request('GET','/context',admin),200);
  assert.equal(JSON.stringify((await pool.query('select * from public.staff_accounts order by id')).rows),beforeAccounts);
  record('BA03-V04','Missing binding yields sanitized unavailable; exact restoration succeeds; inconsistent branch binding rejected by actual FK and rolled back');
  stage='persistence-fault';
  const pre=await bootstrap();
  failPersistence=true;
  try {
    unavailable(await request('GET','/context',admin));
    unavailable(await request('POST','/auth/login',pre,{username:'ba03.owner',password:secrets[1]}));
    unavailable(await request('PATCH',`/staff/${staff.id}`,admin,{displayName:'Must not write'}));
  } finally {failPersistence=false;}
  status(await request('GET','/context',admin),200);
  assert.equal(JSON.stringify((await pool.query('select * from public.staff_accounts order by id')).rows),beforeAccounts);
  record('BA03-V05','Injected AccessStore persistence failure denies context/login/mutation with sanitized 503; restored positive control; not physical outage evidence');
  stage='local-boundary-controls';
  for(const path of ['/context','/auth/me','/staff']) status(await request('GET',path),401);
  status(await request('GET','/staff',user),403);
  status(await request('PATCH',`/staff/${randomUUID()}`,admin,{displayName:'Denied'}),404);
  status(await request('PATCH',`/staff/${staff.id}`,admin,{branchId:randomUUID()}),404);
  status(await request('POST','/staff',admin,{username:'ba03.invalid',role:'staff',branchId:ledger.branch,password:secrets[0],businessId:randomUUID()}),400);
  record('BA03-V02','Local malformed/foreign-UUID negatives only; no second database or cross-installation claim');
  report.result='passed single-target subset; two-installation acceptance pending';
} catch (error) {
  report.result = 'failed'; report.failure = { stage, subprocessExit: typeof error.code === 'number' ? error.code : undefined, terminalTimeout: /terminal timeout|timed out/.test(String(error.stderr ?? '')), operatorRejected: /Provisioning failed/.test(String(error.stdout ?? '')), terminalInputRejected: /terminal|TTY/.test(String(error.stdout ?? '')), category: error.name === 'AssertionError' ? 'acceptance-assertion' : /^[A-Z0-9_]{2,40}$/.test(String(error.code)) ? error.code : 'sanitized-operation-failure' };
  record(stage === 'preflight' ? 'entry' : 'BA03', stage, 'failed');
  process.exitCode = 1;
} finally {
  failPersistence=false;
  await app?.close();
  stage = 'cleanup';
  if (ownsBootstrap && !attributionFailed && !restoreBinding && !restoreGrant) {
    const client = await pool.connect();
    try {
      await client.query('begin');
      const existing = await client.query('select name from public.businesses where id=$1 for update',[ledger.business]);
      assert.equal(existing.rows[0]?.name,tag);
      const actual = await counts(client);
      const allowed = {businesses:1,branches:extraBranch ? 2 : 1,installation_binding:1,staff_accounts:ledger.accounts.length,staff_credentials:ledger.accounts.length,staff_branch_grants:ledger.accounts.length,access_sessions:ledger.sessions.length,access_prelogins:ledger.prelogins.length,access_limits:ledger.limits.length,access_security_events:ledger.events.length};
      assert.ok(tables.every(name=>actual[name]<=allowed[name]));
      // Verify every extant key against the ownership ledger before deleting any row.
      for (const [table,column,keys] of [['access_sessions','digest',ledger.sessions],['access_prelogins','digest',ledger.prelogins],['access_security_events','id',ledger.events],['staff_accounts','id',ledger.accounts]]) {
        const rows = (await client.query(`select ${column} as key from public.${table}`)).rows;
        assert.ok(rows.every(row=>keys.includes(row.key)));
      }
      const branches=(await client.query('select id,business_id,name from public.branches')).rows;
      assert.ok(branches.every(row=>[ledger.branch,extraBranch].includes(row.id)&&row.business_id===ledger.business&&row.name===tag));
      const grants=(await client.query('select * from public.staff_branch_grants')).rows;
      assert.ok(grants.every(row=>ledger.accounts.includes(row.account_id)&&row.business_id===ledger.business&&row.branch_id===ledger.branch));
      const limits = (await client.query('select kind,key from public.access_limits')).rows;
      assert.ok(limits.every(row=>ledger.limits.some(item=>item.kind===row.kind&&item.key===row.key)));
      assert.equal((await client.query('select count(*)::int as n from public.staff_accounts where business_id<>$1',[ledger.business])).rows[0].n,0);
      await client.query('delete from public.access_sessions where digest=any($1::text[])',[ledger.sessions]);
      await client.query('delete from public.access_prelogins where digest=any($1::text[])',[ledger.prelogins]);
      for (const item of ledger.limits) await client.query('delete from public.access_limits where kind=$1 and key=$2',[item.kind,item.key]);
      await client.query('delete from public.access_security_events where id=any($1::uuid[])',[ledger.events]);
      await client.query('delete from public.staff_branch_grants where account_id=any($1::uuid[]) and business_id=$2',[ledger.accounts,ledger.business]);
      await client.query('delete from public.staff_credentials where account_id=any($1::uuid[])',[ledger.accounts]);
      await client.query('delete from public.staff_accounts where id=any($1::uuid[]) and business_id=$2',[ledger.accounts,ledger.business]);
      await client.query('delete from public.installation_binding where business_id=$1 and branch_id=$2',[ledger.business,ledger.branch]);
      await client.query('delete from public.branches where id=any($1::uuid[]) and business_id=$2',[[ledger.branch,...(extraBranch ? [extraBranch] : [])],ledger.business]);
      await client.query('delete from public.businesses where id=$1 and name=$2',[ledger.business,tag]);
      await client.query('commit');
      report.cleanup = {result:'passed',counts:await counts(client),migrationCount:Number((await client.query('select count(*) as n from drizzle.__drizzle_migrations')).rows[0].n)};
      assert.ok(Object.values(report.cleanup.counts).every(value=>value===0)); assert.equal(report.cleanup.migrationCount,3);
    } catch (error) {
      await client.query('rollback').catch(()=>{}); report.cleanup={result:'failed',category:'ownership-or-cleanup-failure'}; process.exitCode=1;
    } finally {client.release();}
  } else report.cleanup = { result: ledger.cliStarted ? 'manual review required' : 'not required', reason: 'No attributed bootstrap or unsafe attribution; no destructive cleanup attempted' };
  await pool.end(); report.poolClosed=pool.ended && pool.totalCount===0;
  report.finishedAt=new Date().toISOString();
  await writeFile(resolve(root,'apps/api/tests/evidence/ba03-single-target.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({result:report.result,failure:report.failure,checks:report.results,cleanup:report.cleanup,poolClosed:report.poolClosed}));
}
