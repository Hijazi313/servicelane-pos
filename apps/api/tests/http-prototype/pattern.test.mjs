import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Module, Controller, Get, Post, Body, Query, Req, HttpCode, UseFilters, BadRequestException } from '@nestjs/common';
import { NestFactory, APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { createHttpAdapter } from '../../dist/orders-check/infrastructure/http/http-adapter.js';
import { HttpContract } from '../../dist/orders-check/infrastructure/http/http-contract.decorator.js';
import { HttpContractGuard } from '../../dist/orders-check/infrastructure/http/http-contract.guard.js';
import { ValidatedInputPipe, parseEmptyQuery } from '../../dist/orders-check/infrastructure/http/validated-input.pipe.js';
import { HttpResponseInterceptor } from '../../dist/orders-check/infrastructure/http/http-response.interceptor.js';
import { HttpContractFilter } from '../../dist/orders-check/infrastructure/http/http-contract.filter.js';
import { fixture } from '../orders-fixture.mjs';
import { MenuController } from '../../dist/orders-check/modules/menu/http/menu.controller.js';
import { MenuService } from '../../dist/orders-check/modules/menu/application/menu.service.js';
import { MenuError } from '../../dist/orders-check/modules/menu/domain/catalogue.js';
import { menuErrorStatus } from '../../dist/orders-check/modules/menu/http/menu-error-mapping.js';
import { OrdersController } from '../../dist/orders-check/modules/orders/http/orders.controller.js';
import { OrdersService, snapshotFits } from '../../dist/orders-check/modules/orders/application/orders.service.js';
import { OrdersError, object, integer, optionalText, customer, minorAmount, MAX_LINES, MAX_QUANTITY, RESPONSE_BYTES } from '../../dist/orders-check/modules/orders/domain/capture.js';
import { OrdersExceptionFilter } from '../../dist/orders-check/modules/orders/http/orders-exception.filter.js';
import { AccessService } from '../../dist/orders-check/modules/authentication/public.js';
import { AccessError } from '../../dist/orders-check/modules/authentication/application/access-policy.js';
import { AccessBoundaryGuard } from '../../dist/orders-check/modules/authentication/http/access-boundary.guard.js';
import { AccessExceptionFilter } from '../../dist/orders-check/modules/authentication/http/access-exception.filter.js';
import { AccessEntry } from '../../dist/orders-check/modules/authentication/http/access-entry.decorator.js';
import { proof } from '../../dist/orders-check/modules/authentication/http/access-http.helpers.js';
import { AccessHttpConfiguration } from '../../dist/orders-check/modules/authentication/http/configuration.js';

// Independent structural parser experiment, reusing domain primitives. Production
// OrdersService still parses: this is equivalence evidence, not extraction proof.
function parseCapture(value, normalize) {
  const input = object(value, ['retryKey', 'currencyCode', 'scale', 'lines', 'customer', 'instructions']);
  if (typeof input.retryKey !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(input.retryKey)) throw new OrdersError('INVALID_RETRY_KEY');
  if (typeof input.currencyCode !== 'string' || !/^[A-Z]{3}$/.test(input.currencyCode)) throw new OrdersError('INVALID_CURRENCY');
  const scale = integer(input.scale, 0, 4);
  if (!Array.isArray(input.lines) || !input.lines.length || input.lines.length > MAX_LINES) throw new OrdersError('INVALID_LINES');
  const lines = input.lines.map(value => {
    const row = object(value, ['selection', 'quantity', 'expectedUnitMinor', 'instructions']);
    const instructions = optionalText(row.instructions, 250);
    return { selection: normalize(row.selection), quantity: integer(row.quantity, 1, MAX_QUANTITY), expectedUnitMinor: minorAmount(row.expectedUnitMinor), ...(instructions ? { instructions } : {}) };
  });
  const details = customer(input.customer), instructions = optionalText(input.instructions, 500);
  return { retryKey: input.retryKey, currencyCode: input.currencyCode, scale, lines, ...(details ? { customer: details } : {}), ...(instructions ? { instructions } : {}) };
}
const accessStatuses = { INVALID_INPUT: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, RATE_LIMITED: 429, UNAVAILABLE: 503 };
const orderStatuses = { INVALID_ORDER_INPUT: 400, INVALID_RETRY_KEY: 400, INVALID_CURRENCY: 400, INVALID_LINES: 400, ORDER_LIMIT_EXCEEDED: 400, ORDER_NOT_FOUND: 404, RETRY_CONTENT_CONFLICT: 409, PRICE_CONFIRMATION_REQUIRED: 409, STALE_ORDER_POLICY: 409, ORDER_AMOUNT_CAPACITY: 409, ORDER_RESPONSE_CAPACITY: 409, MENU_RESULT_UNAVAILABLE: 503, INSTALLATION_UNAVAILABLE: 503 };
function mapper(error) {
  if (error instanceof AccessError) return { status: accessStatuses[error.reason], type: error.reason.toLowerCase(), title: 'Access rejected', retryAfter: error.retryDelaySeconds };
  if (error instanceof OrdersError) return { status: orderStatuses[error.code], type: error.code.toLowerCase(), title: 'Order rejected', ...(error.code === 'PRICE_CONFIRMATION_REQUIRED' ? { details: error.details } : {}) };
  if (error instanceof MenuError) return { status: menuErrorStatus(error.reason), type: 'menu-rejected', title: 'Menu rejected' };
}
async function harness() {
  const h = fixture(), diagnostics = [], completions = [];
  let calls = 0, parses = 0;
  const menu = new MenuService({ read: async business => business === h.installation.businessId ? structuredClone(h.state().catalogue) : [] });
  const parser = value => { parses++; return parseCapture(value, selection => h.menu.normalize(selection)); };
  class ProbeController {
    async list(request) { const context = await h.access.me(proof(request), true); return menu.list(context); }
    async create(request, input) { calls++; return h.service.create(proof(request), input); }
    none() { return undefined; }
    unexpected() { throw new Error('synthetic-private-detail'); }
    limited() { throw new AccessError('RATE_LIMITED', 'Wait', 7); }
    serialize() { return { unsupported: 1n }; }
  }
  Controller('probe')(ProbeController);
  for (const [name, verb, path] of [['list',Get,'menu/offerings'],['create',Post,'orders'],['none',Post,'none'],['unexpected',Get,'unexpected'],['limited',Get,'limited'],['serialize',Get,'serialize']]) {
    const descriptor = Object.getOwnPropertyDescriptor(ProbeController.prototype, name);
    verb(path)(ProbeController.prototype,name,descriptor);
    AccessEntry('staff')(ProbeController.prototype,name,descriptor);
    HttpContract()(ProbeController.prototype,name,descriptor);
  }
  Req()(ProbeController.prototype,'list',0); Query(new ValidatedInputPipe(parseEmptyQuery))(ProbeController.prototype,'list',1);
  Req()(ProbeController.prototype,'create',0); Body(new ValidatedInputPipe(parser))(ProbeController.prototype,'create',1);
  HttpCode(204)(ProbeController.prototype,'none',Object.getOwnPropertyDescriptor(ProbeController.prototype,'none'));
  const filter = new HttpContractFilter(new AccessExceptionFilter(), {
    map(error) { const problem = mapper(error); return problem && { ...problem, type: `https://api.example.com/problems/${problem.type}` }; },
    framework: status => ({ status, type:'https://api.example.com/problems/request-rejected', title:'Request rejected' }),
    unexpected: () => ({ status:500, type:'https://api.example.com/problems/internal-error', title:'Internal server error' }),
    reportUnexpected(error,requestId) { diagnostics.push({requestId,category:'unexpected',message:error instanceof Error?error.message:'Unknown failure'}); },
  });
  UseFilters(filter)(ProbeController);
  class TestModule {}
  Module({ controllers:[ProbeController,MenuController,OrdersController],providers:[
    {provide:MenuService,useValue:menu},{provide:OrdersService,useValue:h.service},{provide:AccessService,useValue:h.access},
    {provide:AccessHttpConfiguration,useValue:new AccessHttpConfiguration('https://pos.test','pos.test',['127.0.0.1'])},
    {provide:APP_GUARD,useClass:HttpContractGuard},
    {provide:APP_GUARD,useFactory:(r,c,a)=>new AccessBoundaryGuard(r,c,a),inject:[Reflector,AccessHttpConfiguration,AccessService]},
    {provide:APP_FILTER,useValue:filter},{provide:APP_INTERCEPTOR,useClass:HttpResponseInterceptor},
  ]})(TestModule);
  const adapter = createHttpAdapter({trustedProxies:['127.0.0.1'],bodyLimit:16_384},event=>completions.push(event));
  const server = adapter.getInstance();
  const app=await NestFactory.create(TestModule,adapter,{logger:false,abortOnError:false});
  await app.init();await server.ready();
  const request=(method,url,payload,headers={})=>app.inject({method,url,...(payload===undefined?{}:{payload}),headers:{host:'pos.test','x-forwarded-proto':'https',origin:'https://pos.test',cookie:`__Host-session=${h.sessionToken}`,'x-csrf-token':h.csrf,'x-request-id':'spoofed',...headers}});
  return {...h,app,request,diagnostics,completions,parser,calls:()=>calls,parses:()=>parses};
}
function problem(response,status) {
  assert.equal(response.statusCode,status);assert.match(response.headers['content-type'],/^application\/problem\+json/);
  const body=response.json();assert.equal(body.status,status);assert.equal(body.meta.requestId,response.headers['x-request-id']);assert.notEqual(body.meta.requestId,'spoofed');return body;
}

test('bounded list opt-in, legacy array, strict query, empty results and correlation',async()=>{
  const h=await harness();try{
    const legacy=await h.request('GET','/api/v1/menu/offerings?ignored=1');assert.ok(Array.isArray(legacy.json()));
    const response=await h.request('GET','/probe/menu/offerings');assert.deepEqual(response.json().data,legacy.json());assert.equal(response.json().meta.requestId,response.headers['x-request-id']);
    problem(await h.request('GET','/probe/menu/offerings?limit=1&limit=2'),400);
    h.state().catalogue=[];assert.deepEqual((await h.request('GET','/probe/menu/offerings')).json().data,[]);
    assert.ok(h.completions.every(e=>e.requestId!=='spoofed'&&e.duration>=0&&typeof e.route==='string'));
  }finally{await h.app.close();}
});

test('mutation pipe preserves normalized capture/replay/conflict and rejects before application',async()=>{
  const h=await harness();try{
    const input=h.body({instructions:'  hello  '});const parsed=h.parser(input);assert.equal(parsed.instructions,'hello');assert.equal(h.reads(),0);
    const response=await h.request('POST','/probe/orders',input);assert.equal(response.statusCode,201);const saved=response.json().data;assert.equal(saved.instructions,'hello');
    const duplicates=await Promise.all([h.request('POST','/probe/orders',input),h.request('POST','/probe/orders',input)]);
    for(const duplicate of duplicates) assert.deepEqual(duplicate.json().data,saved);
    assert.equal(h.state().orders.length,1);
    problem(await h.request('POST','/probe/orders',{...input,instructions:'changed'}),409);
    const price=problem(await h.request('POST','/probe/orders',h.body({lines:[{selection:{offeringId:h.item.id},quantity:1,expectedUnitMinor:'0'}]})),409);assert.equal(price.details.lines[0].unitMinor,'1234');
    const count=h.calls(),reads=h.reads();problem(await h.request('POST','/probe/orders',{...input,extra:1}),400);assert.equal(h.calls(),count);assert.equal(h.reads(),reads);
    const legacy=await h.request('POST','/api/v1/orders',input);assert.equal(legacy.json().id,saved.id);assert.equal(legacy.statusCode,201);
    assert.ok(snapshotFits(saved));assert.ok(Buffer.byteLength(response.body)>Buffer.byteLength(JSON.stringify(saved)));
    const nearLimit={padding:'x'.repeat(RESPONSE_BYTES-14)};assert.equal(Buffer.byteLength(JSON.stringify(nearLimit)),RESPONSE_BYTES);assert.ok(snapshotFits(nearLimit));assert.ok(Buffer.byteLength(JSON.stringify({data:nearLimit,meta:{requestId:'id'}}))>RESPONSE_BYTES);
  }finally{await h.app.close();}
});

test('guard admission precedes pipe, CSRF and local errors share formatting; legacy stays legacy',async()=>{
  const h=await harness();try{
    const count=h.parses();problem(await h.request('POST','/probe/orders',{}, {origin:'https://foreign.test'}),403);assert.equal(h.parses(),count);
    problem(await h.request('POST','/probe/orders',h.body(),{'x-csrf-token':'bad'}),403);assert.equal(h.state().orders.length,0);
    const legacy=await h.request('POST','/api/v1/orders',h.body(),{origin:'https://foreign.test'});assert.equal(legacy.statusCode,403);assert.equal(legacy.json().meta,undefined);
    const rate=await h.request('GET','/probe/limited');problem(rate,429);assert.equal(rate.headers['retry-after'],'7');
    const failed=await h.request('GET','/probe/unexpected');problem(failed,500);assert.doesNotMatch(failed.body,/synthetic-private/);assert.equal(h.diagnostics.length,1);assert.equal(h.diagnostics[0].requestId,failed.headers['x-request-id']);
    h.failSave();const legacyFail=await h.request('POST','/api/v1/orders',h.body());assert.equal(legacyFail.statusCode,503);assert.equal(legacyFail.json().meta,undefined);
    const none=await h.request('POST','/probe/none');assert.equal(none.statusCode,204);assert.equal(none.body,'');
  }finally{await h.app.close();}
});

test('adapter parsing, unmatched and serializer paths are observed explicitly',async(t)=>{
  const h=await harness();try{
    const malformed=await h.request('POST','/probe/orders','{',{'content-type':'application/json'});assert.equal(malformed.statusCode,400);assert.equal(malformed.json().meta,undefined);assert.notEqual(malformed.headers['x-request-id'],'spoofed');
    const missing=await h.request('GET','/not-a-route');assert.equal(missing.statusCode,404);assert.equal(missing.json().meta,undefined);
    const failed=await h.request('GET','/probe/serialize');
    t.diagnostic(`serializer status=${failed.statusCode}; content-type=${failed.headers['content-type']}`);
    problem(failed,500);assert.doesNotMatch(failed.body,/unsupported|BigInt|synthetic-private/);
    assert.equal(h.diagnostics.length,1);assert.equal(h.diagnostics[0].requestId,failed.headers['x-request-id']);
    const oversized=await h.request('POST','/probe/orders',{padding:'x'.repeat(16_384)});assert.equal(oversized.statusCode,413);assert.equal(oversized.json().meta,undefined);
  }finally{await h.app.close();}
});


test('independent parser matches current service normalization and rejects representative inputs',async()=>{
  const inputs=[body=>({...body,scale:'2'}),body=>({...body,retryKey:'x'}),body=>({...body,lines:[]}),body=>({...body,customer:{extra:'x'}}),body=>({...body,lines:[{...body.lines[0],quantity:1.5}]})];
  for(const change of inputs){
    const h=fixture(),input=change(h.body());let code;
    try{parseCapture(input,s=>h.menu.normalize(s));assert.fail('Parser accepted invalid input');}catch(error){assert.ok(error instanceof OrdersError);code=error.code;}
    await assert.rejects(h.service.create(h.proof,input),error=>error instanceof OrdersError&&error.code===code);
    assert.equal(h.state().orders.length,0);assert.equal(h.reads(),0);
  }
  const h=fixture(),input=h.body({instructions:'  hello  ',customer:{name:'  Synthetic  '}});
  const normalized=parseCapture(input,s=>h.menu.normalize(s));await h.service.create(h.proof,input);
  const {retryKey,...request}=normalized;assert.deepEqual(h.state().orders[0].order.request,request);
});
