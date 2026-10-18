// Fresh API process used only by mn01-acceptance.mjs; no listener or provisioning.
import assert from 'node:assert/strict';
import { runRestartProbe } from './mn01-restart-operation.mjs';
if (process.env.MN01_ACCEPT_STAGING !== 'YES' || process.env.MN01_TARGET !== 'existing-env-disposable') throw new Error('Explicit MN-01 execution authorization required');
if (!/^v24\./.test(process.version) || Number(process.version.split('.')[1]) < 21) throw new Error('Supported Node 24 >=24.21.0 required');
await import('reflect-metadata');
const {Pool}=await import('pg');
const {drizzle}=await import('drizzle-orm/node-postgres');
const {Module}=await import('@nestjs/common');
const {NestFactory,Reflector,APP_FILTER,APP_GUARD}=await import('@nestjs/core');
const {FastifyAdapter}=await import('@nestjs/platform-fastify');
const base='../dist/menu-check/';
const {readConfiguration}=await import(base+'infrastructure/configuration.js');
const {REQUEST_BODY_LIMIT_BYTES}=await import(base+'infrastructure/request-limits.js');
const {BusinessService}=await import(base+'modules/business/public.js');
const {AccessService}=await import(base+'modules/authentication/public.js');
const {PostgresAccessStore}=await import(base+'modules/authentication/infrastructure/access-store.js');
const {PostgresMenuStore}=await import(base+'modules/menu/infrastructure/menu-store.js');
const {MenuService}=await import(base+'modules/menu/application/menu.service.js');
const {MenuController}=await import(base+'modules/menu/http/menu.controller.js');
const {AccessBoundaryGuard}=await import(base+'modules/authentication/http/access-boundary.guard.js');
const {AccessExceptionFilter}=await import(base+'modules/authentication/http/access-exception.filter.js');
const {AccessHttpConfiguration}=await import(base+'modules/authentication/http/configuration.js');
let input=''; for await(const chunk of process.stdin) {input+=chunk;assert.ok(input.length<65536);}
const {proof,expected,selection,expectedTotal}=JSON.parse(input);
const config=readConfiguration(process.env);
const pool=new Pool({...config.database,max:1,options:'-c statement_timeout=15000 -c lock_timeout=10000'});
const database={db:drizzle({client:pool})};
const access=new AccessService(new PostgresAccessStore(database),new BusinessService(database),{});
const menu=new MenuService(new PostgresMenuStore(database));
class RestartModule {}
Module({controllers:[MenuController],providers:[
  {provide:MenuService,useValue:menu},{provide:AccessService,useValue:access},
  {provide:AccessHttpConfiguration,useValue:new AccessHttpConfiguration('https://pos.test','pos.test',['127.0.0.1'])},
  {provide:APP_GUARD,useFactory:(reflector,configuration,service)=>new AccessBoundaryGuard(reflector,configuration,service),inject:[Reflector,AccessHttpConfiguration,AccessService]},
  {provide:APP_FILTER,useClass:AccessExceptionFilter},
]})(RestartModule);
await runRestartProbe(pool, async () => {
  let app;
  try {
    app=await NestFactory.create(RestartModule,new FastifyAdapter({trustProxy:['127.0.0.1'],bodyLimit:REQUEST_BODY_LIMIT_BYTES}),{logger:false,abortOnError:false});
    await app.init();await app.getHttpAdapter().getInstance().ready();
    const request=(method,path,payload)=>app.inject({method,url:'/api/v1/menu'+path,payload,headers:{host:'pos.test','x-forwarded-proto':'https',origin:'https://pos.test',cookie:`__Host-session=${proof.session}`,'x-csrf-token':proof.csrf}});
    const response=await request('GET','/definitions'); assert.equal(response.statusCode,200);assert.deepEqual(response.json(),expected);
    const resolved=await request('POST','/resolve',selection);assert.equal(resolved.statusCode,200);assert.equal(resolved.json().total,expectedTotal);
  } finally {if(app)await app.close();}
});
console.log('MN01 restart passed');
