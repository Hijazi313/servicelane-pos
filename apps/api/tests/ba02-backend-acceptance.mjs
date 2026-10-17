// Manual opt-in database WRITE harness. Never included in automatic test commands.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
if (process.env.BA02_ACCEPT_STAGING !== 'YES' || process.argv[2] !== '--lifecycle') throw new Error('Explicit staging-write opt-in and lifecycle mode required');
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
const { AccessBoundaryGuard } = await import('../dist/ba02-check/modules/authentication/http/access-boundary.guard.js');
const { AccessExceptionFilter } = await import('../dist/ba02-check/modules/authentication/http/access-exception.filter.js');
const { AccessHttpConfiguration } = await import('../dist/ba02-check/modules/authentication/http/configuration.js');
const exec = promisify(execFile);
const root = resolve(import.meta.dirname, '../../..');
const digest = value => createHash('sha256').update(value).digest('hex');
const tag = `ba02-${randomUUID()}`;
const temp = await mkdtemp(join(tmpdir(), 'ba02-owned-'));
const ledgerPath = join(temp, 'ownership.json');
const ledger = { tag, business: null, branch: null, accounts: [], sessions: [], prelogins: [], limits: [], events: [], cliStarted: false };
const saveLedger = () => writeFile(ledgerPath, JSON.stringify(ledger), { mode: 0o600 });
await saveLedger();
const config = readConfiguration(process.env);
const pool = new Pool({ ...config.database, max: 1, application_name: tag, connectionTimeoutMillis: 15000, query_timeout: 20000, options: '-c statement_timeout=20000 -c lock_timeout=5000' });
pool.on('error', () => {});
const tables = ['access_limits','access_prelogins','access_security_events','access_sessions','branches','businesses','installation_binding','staff_accounts','staff_branch_grants','staff_credentials'];
const report = { startedAt: new Date().toISOString(), runTag: tag, results: [], cleanup: { result: 'not run' }, connectionMaximum: 2, remaining: 'BA-02 awaiting acceptance; no trusted-browser or BA-03 acceptance. Original migration rehearsal not run.' };
let stage = 'entry';
let app;
let ownsBootstrap = false;
let attributionFailed = false;
const record = (id, check, result = 'passed') => report.results.push({ id, check, result });
const counts = async (connection = pool) => Object.fromEntries(await Promise.all(tables.map(async name => [name, Number((await connection.query(`select count(*) as n from public.${name}`)).rows[0].n)])));
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
    const events = [];
    try {
      const result = await actualStore.run(unit => work(new Proxy(unit, { get(target, key) {
        if (key === 'event') return async (event, now) => { await target.event(event, now); events.push([event, now]); };
        if (['saveAccount', 'saveSession', 'savePrelogin', 'saveLimit'].includes(key)) return async row => {
          if (key === 'saveAccount' && !ledger.accounts.includes(row.id)) {
            assert.equal(row.businessId, ledger.business); assert.ok(row.username.startsWith('ba02.')); ledger.accounts.push(row.id);
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
  await exec(process.execPath, ['--env-file=.env', resolve(root,'apps/api/tests/ba02-staging-acceptance.mjs'), '--preflight-migrated'], { cwd: root, env: process.env, timeout: 90000 });
  const preflight = JSON.parse(await readFile(resolve(root,'apps/api/tests/evidence/ba02-migrated-preflight.json'), 'utf8'));
  assert.equal(preflight.preflight.result, 'passed'); report.candidate = preflight.candidate; report.runtime = preflight.runtime; report.tls = preflight.tls;
  assert.ok(Object.values(await counts()).every(value => value === 0));
  stage = 'bootstrap';
  const fixture = join(temp, 'installation.json');
  await writeFile(fixture, JSON.stringify({ business: { name: tag, currencyCode: 'PKR', timezone: 'Asia/Karachi' }, branch: { name: tag, address: 'Synthetic acceptance fixture' }, administrator: { username: 'ba02.owner', displayName: tag } }), { mode: 0o600 });
  ledger.cliStarted = true; await saveLedger();
  // Password travels only through protected process environment to PTY helper; helper strips it before CLI spawn.
  const cli = await exec('python3', [resolve(root,'apps/api/tests/acceptance-terminal.py'), process.execPath, resolve(root,'apps/api/dist/ba02-check/operator/provision-installation.js'), fixture], { env: { ...process.env, BA01_TEST_PASSWORD: secrets[0] }, timeout: 50000, maxBuffer: 16384 });
  assert.ok(!secrets.some(secret => cli.stdout.includes(secret) || cli.stderr.includes(secret)));
  const ids = JSON.parse(cli.stdout.split(/\r?\n/).find(line => line.startsWith('{')));
  ledger.business = ids.businessId; ledger.branch = ids.branchId; ledger.accounts.push(ids.accountId); await saveLedger(); ownsBootstrap = true;
  assert.equal((await pool.query('select name from public.businesses where id=$1', [ledger.business])).rows[0].name, tag);
  record('BA-02-V02','Actual hidden-terminal setup creates synthetic business, branch and restricted administrator');
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
  let admin = await login('ba02.owner',secrets[0]);
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
  record('BA-02-V02','Initial restriction, unchanged-password rejection without credential/session mutation and valid rotation');
  stage = 'staff-lifecycle';
  const create = async (username, role='staff') => status(await request('POST','/staff',admin,{username,role,branchId:ledger.branch,password:secrets[0]}),201).json();
  const staff = await create('ba02.staff'); const second = await create('ba02.admin','administrator');
  status(await request('GET','/staff',admin),200);
  status(await request('PATCH',`/staff/${staff.id}`,admin,{displayName:'Edited synthetic staff'}),200);
  status(await request('POST','/staff',admin,{username:'ba02.staff',role:'staff',branchId:ledger.branch,password:secrets[0]}),409);
  for (const extra of [{businessId:randomUUID()},{id:randomUUID()},{permissions:['all']}]) status(await request('POST','/staff',admin,{username:'ba02.invalid',role:'staff',branchId:ledger.branch,password:secrets[0],...extra}),400);
  status(await request('PATCH',`/staff/${staff.id}`,admin,{role:'owner'}),400);
  status(await request('PATCH',`/staff/${staff.id}`,admin,{branchId:randomUUID()}),404);
  status(await request('PATCH',`/staff/${randomUUID()}`,admin,{status:'disabled'}),404);
  let user = await login('ba02.staff',secrets[0]);
  user = absorb(status(await request('POST','/auth/password',user,{currentPassword:secrets[0],newPassword:secrets[1]}),200));
  status(await request('GET','/staff',user),403);
  status(await request('POST','/staff',user,{username:'ba02.denied',role:'administrator',branchId:ledger.branch,password:secrets[0]}),403);
  status(await request('POST',`/staff/${staff.id}/password-reset`,admin,{password:secrets[2]}),204);
  status(await request('GET','/auth/me',user),401);
  user = await login('ba02.staff',secrets[2]);
  status(await request('GET','/auth/me',user),403);
  status(await request('PATCH',`/staff/${staff.id}`,admin,{status:'disabled'}),200);
  await login('ba02.staff',secrets[2],401);
  status(await request('PATCH',`/staff/${staff.id}`,admin,{status:'active'}),200);
  status(await request('GET','/auth/me',user),401);
  const hashes = (await pool.query('select password_hash from public.staff_credentials')).rows;
  assert.equal(hashes.length,3); assert.ok(hashes.every(row=>row.password_hash.startsWith('$argon2id$')));
  record('BA-02-V02','Staff/admin creation, list/edit/reset/disable/re-enable, fixed-role denial, invalid/foreign fields and duplicate username; PHC-only storage');
  stage = 'login-boundary';
  for (const overrides of [{origin:undefined},{origin:'null'},{origin:'https://foreign.test'},{host:'foreign.test'},{'x-forwarded-proto':'http'}]) status(await request('POST','/auth/login',await bootstrap(),{username:'ba02.owner',password:secrets[1]},overrides),403);
  await login('ba02.unknown',secrets[0],401); await login('ba02.owner',secrets[0],401);
  const pre = await bootstrap();
  status(await request('POST','/auth/login',{...pre,csrf:randomBytes(32).toString('hex')},{username:'ba02.owner',password:secrets[1]}),403);
  const replay = await bootstrap();
  const logged = absorb(status(await request('POST','/auth/login',replay,{username:'ba02.owner',password:secrets[1]}),200));
  status(await request('POST','/auth/login',replay,{username:'ba02.owner',password:secrets[1]}),403);
  status(await request('GET','/auth/me',{cookie:`__Host-session=${randomBytes(32).toString('hex')}`}),401);
  record('BA-02-V03','Real database-backed wrong/unknown/disabled credentials, Origin/Host/protocol, CSRF mismatch/replay, forged session, secure cookies/no-store');
  stage = 'logout';
  const unrelated = await bootstrap();
  const bad = status(await request('POST','/auth/logout',{cookie:`${logged.cookie}; ${unrelated.cookie}`,csrf:unrelated.csrf}),403);
  assert.equal(bad.headers['set-cookie'],undefined);
  status(await request('GET','/auth/me',logged),200);
  status(await request('POST','/auth/logout',logged),204);
  status(await request('GET','/auth/me',logged),401);
  status(await request('POST','/auth/logout',logged),204);
  status(await request('POST','/auth/logout',await bootstrap()),204);
  record('BA-02-V06','Active-session logout rejects unrelated pre-login proof without cookie clearance; valid logout/replay/absent session proof');
  report.result = 'passed scoped checks';
} catch (error) {
  report.result = 'failed'; report.failure = { stage, subprocessExit: typeof error.code === 'number' ? error.code : undefined, terminalTimeout: /terminal timeout|timed out/.test(String(error.stderr ?? '')), operatorRejected: /Provisioning failed/.test(String(error.stdout ?? '')), terminalInputRejected: /terminal|TTY/.test(String(error.stdout ?? '')), category: error.name === 'AssertionError' ? 'acceptance-assertion' : /^[A-Z0-9_]{2,40}$/.test(String(error.code)) ? error.code : 'sanitized-operation-failure' };
  record(stage === 'preflight' ? 'entry' : 'BA-02-V02', stage, 'failed');
  process.exitCode = 1;
} finally {
  await app?.close();
  stage = 'cleanup';
  if (ownsBootstrap && !attributionFailed) {
    const client = await pool.connect();
    try {
      await client.query('begin');
      const existing = await client.query('select name from public.businesses where id=$1 for update',[ledger.business]);
      assert.equal(existing.rows[0]?.name,tag);
      const actual = await counts(client);
      const allowed = {businesses:1,branches:1,installation_binding:1,staff_accounts:ledger.accounts.length,staff_credentials:ledger.accounts.length,staff_branch_grants:ledger.accounts.length,access_sessions:ledger.sessions.length,access_prelogins:ledger.prelogins.length,access_limits:ledger.limits.length,access_security_events:ledger.events.length};
      assert.ok(tables.every(name=>actual[name]<=allowed[name]));
      // Verify every extant key against the ownership ledger before deleting any row.
      for (const [table,column,keys] of [['access_sessions','digest',ledger.sessions],['access_prelogins','digest',ledger.prelogins],['access_security_events','id',ledger.events],['staff_accounts','id',ledger.accounts]]) {
        const rows = (await client.query(`select ${column} as key from public.${table}`)).rows;
        assert.ok(rows.every(row=>keys.includes(row.key)));
      }
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
      await client.query('delete from public.branches where id=$1 and business_id=$2',[ledger.branch,ledger.business]);
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
  await writeFile(resolve(root,'apps/api/tests/evidence/ba02-backend.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({result:report.result,failure:report.failure,checks:report.results,cleanup:report.cleanup,poolClosed:report.poolClosed}));
}
