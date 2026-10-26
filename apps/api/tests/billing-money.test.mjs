import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAssessment, normalizePolicyReplacement, normalizeSettlement, initialPolicy, assertRuleIdentities, assertPolicyCapacity, assertBillCapacity } from '../dist/billing-check/modules/billing/domain/billing.js';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const display={revision:0,businessName:'Synthetic',branchName:'Offline',branchAddress:null,currencyCode:'PKR',timezone:'Asia/Karachi'};
const order=(amount='100000',quantity=1)=>({orderId:id(90),capturedAt:'2026-10-26T00:00:00.000Z',fulfillment:'takeaway',currencyCode:'PKR',scale:2,merchandiseMinor:amount,
 lines:[{position:0,quantity,sellingUnit:{offeringId:id(91),name:'Fixture',components:[],addOns:[],choices:[]},unitMerchandiseMinor:(BigInt(amount)/BigInt(quantity)).toString(),merchandiseMinor:amount}]});
const charge=(n,kind='fixed',application='optional',value='2000')=>({id:id(n),enabled:true,label:'Synthetic charge',application,kind,fixedMinor:kind==='fixed'?value:null,ratePercent:kind==='percentage'?value:null});
const tax=(n,ratePercent='10',priceMode='exclusive',chargeIds=[])=>({id:id(n),enabled:true,label:'Synthetic tax',ratePercent,priceMode,targets:{merchandise:true,chargeIds}});
const policy=(taxes=[],charges=[],rounding='halfUp')=>({revision:1,status:'configured',currencyCode:'PKR',scale:2,rounding,taxes,charges});
const replacement=p=>({expectedRevision:0,...Object.fromEntries(Object.entries(p).filter(([key])=>key!=='revision')),configurationNote:'Offline fixture only'});
const rejectsCode=(fn,code)=>assert.throws(fn,error=>error.code===code);

test('BP-A02/A15: simultaneous exclusive bases and automatic/optional charges match independent approved examples',()=>{
 const p=policy([tax(1,'10','exclusive',[id(3),id(4)]),tax(2,'2')],[charge(3,'percentage','automatic','5'),charge(4)]);
 const a=calculateAssessment(order(),p,display,[]);
 assert.equal(a.chargesMinor,'5000'); assert.equal(a.payableMinor,'117500');
 assert.deepEqual(a.taxSummary.map(t=>t.amountMinor),['10500','2000']);
 const b=calculateAssessment(order(),p,display,[id(4)]);
 assert.equal(b.chargesMinor,'7000'); assert.equal(b.payableMinor,'119700');
 assert.deepEqual(b.taxSummary.map(t=>t.amountMinor),['10700','2000']);
 assert.equal(b.charges[0].baseMinor,'100000'); assert.equal(b.charges[1].baseMinor,null);
});
test('BP-A17: included shared base allocation, tiny tie and zero-rate component reconcile',()=>{
 const a=calculateAssessment(order('11200'),policy([tax(1,'10','inclusive'),tax(2,'2','inclusive')]),display,[]);
 assert.equal(a.includedTaxMinor,'1200'); assert.equal(a.merchandiseNetMinor,'10000'); assert.equal(a.payableMinor,'11200');
 assert.deepEqual(a.lines[0].taxes.map(t=>[t.baseMinor,t.amountMinor]),[['11200','1000'],['11200','200']]);
 const b=calculateAssessment(order('2'),policy([tax(2,'100','inclusive'),tax(1,'100','inclusive'),tax(3,'0','inclusive')]),display,[]);
 assert.equal(b.includedTaxMinor,'1'); assert.equal(b.payableMinor,'2');
 assert.deepEqual(b.lines[0].taxes.map(t=>t.amountMinor),['1','0','0']);
});
test('BP-A17: mixed included/exclusive tax uses net, percentage charges use net and ties round by line',()=>{
 const a=calculateAssessment(order('11000'),policy([tax(1,'10','inclusive'),tax(2,'10')],[charge(3,'percentage','automatic','10')]),display,[]);
 assert.equal(a.merchandiseNetMinor,'10000'); assert.equal(a.chargesMinor,'1000'); assert.equal(a.addedTaxMinor,'1000'); assert.equal(a.payableMinor,'13000');
 for (const [mode,total] of [['halfUp','2'],['halfEven','0']]) {
  const o=order('10'); o.lines=[{...o.lines[0],merchandiseMinor:'5',unitMerchandiseMinor:'5'},{...o.lines[0],position:1,merchandiseMinor:'5',unitMerchandiseMinor:'5'}];
  assert.equal(calculateAssessment(o,policy([tax(1)],[],mode),display,[]).taxMinor,total);
 }
 const even=calculateAssessment(order('15'),policy([tax(1)],[],'halfEven'),display,[]); assert.equal(even.taxMinor,'2');
});
test('BP-A08/A16: configured no-tax differs from absent policy and strict selection includes zero-rounded charge',()=>{
 assert.equal(calculateAssessment(order('1'),policy(),display,[]).payableMinor,'1');
 rejectsCode(()=>calculateAssessment(order(),initialPolicy(),display,[]),'BILLING_POLICY_UNCONFIGURED');
 const p=policy([], [charge(3,'percentage','optional','0.0001'),charge(4,'fixed','automatic')]);
 assert.equal(calculateAssessment(order('1'),p,display,[id(3)]).charges[0].netMinor,'0');
 for (const ids of [[id(3),id(3)],[id(4)],[id(99)]]) rejectsCode(()=>calculateAssessment(order(),p,display,ids),'INVALID_BILLING_INPUT');
 p.charges[0].enabled=false; rejectsCode(()=>calculateAssessment(order(),p,display,[id(3)]),'INVALID_BILLING_INPUT');
});
test('BP-A18: canonical normalization, nested references, ranges, nulls and retired IDs',()=>{
 const a=tax(1,'0','exclusive',[id(4)]), b=tax(2), c=charge(3), d=charge(4);
 const p=policy([b,a],[d,c]); const normalized=normalizePolicyReplacement(replacement(p));
 assert.deepEqual(normalized.policy.taxes.map(t=>t.id),[id(1),id(2)]);
 assert.deepEqual(normalized.policy.charges.map(t=>t.id),[id(3),id(4)]);
 for (const modify of [r=>r.taxes[0].ratePercent='1.0',r=>r.taxes[0].ratePercent='100.0001',r=>r.taxes[0].targets.extra=true,
 r=>r.taxes[0].targets.chargeIds=[id(99)],r=>{r.taxes[0].priceMode='inclusive';r.taxes[0].targets.chargeIds=[id(4)];},r=>r.charges[0].ratePercent='1',
 r=>r.charges[0].enabled='true',r=>r.charges[0].id=id(1),r=>r.taxes.push(...Array(8).fill(tax(5)))]) {
  const r=structuredClone(replacement(p)); modify(r); rejectsCode(()=>normalizePolicyReplacement(r),'INVALID_BILLING_INPUT');
 }
 rejectsCode(()=>assertRuleIdentities(initialPolicy(),normalized.policy,[id(4)]),'INVALID_BILLING_INPUT');
 assertPolicyCapacity({...normalized.policy,revision:1});
 const max=policy(Array.from({length:8},(_,i)=>tax(i+1)),Array.from({length:8},(_,i)=>charge(i+20)));
 assert.equal(normalizePolicyReplacement(replacement(max)).policy.taxes.length,8);
 assertPolicyCapacity(max);
});
test('BP-A14: currency, zero payable, overflow and expanded representation caps fail closed',()=>{
 rejectsCode(()=>calculateAssessment(order(),policy(),{...display,currencyCode:'USD'},[]),'UNSUPPORTED_BILL_CURRENCY');
 rejectsCode(()=>calculateAssessment(order('0'),policy(),display,[]),'UNSUPPORTED_ZERO_PAYABLE');
 rejectsCode(()=>calculateAssessment(order('999999999999999999999999'),policy([tax(1,'100')]),display,[]),'BILL_AMOUNT_OVERFLOW');
 const o=order('1'); o.lines[0].sellingUnit.name='x'.repeat(2_097_152);
 rejectsCode(()=>calculateAssessment(o,policy(),display,[]),'BILL_CAPACITY');
 const a=calculateAssessment(order('1'),policy(),display,[]);
 const bill={...a,id:id(80),settledAt:'2026-10-26T00:00:00.000Z',payment:{method:'cash',amountMinor:'1'}};
 const base=Buffer.byteLength(JSON.stringify({data:a,meta:{requestId:id(0)}}));
 a.lines[0].sellingUnit.name+='x'.repeat(2_097_152-base);
 assertBillCapacity(a); // Exact assessment cap admits but future bill overhead does not.
 bill.lines=a.lines;
 rejectsCode(()=>assertBillCapacity(bill),'BILL_CAPACITY');
 rejectsCode(()=>calculateAssessment({...order('1'),lines:[{...order('1').lines[0],sellingUnit:a.lines[0].sellingUnit}]},policy(),display,[]),'BILL_CAPACITY');
});
test('BP-A16: retry normalization canonicalizes casing and selection, requires every field',()=>{
 const value={orderId:id(90).toUpperCase(),optionalChargeIds:[id(4),id(3)],retryKey:id(89),expectedCurrencyCode:'PKR',expectedScale:2,expectedPayableMinor:'10',expectedPolicyRevision:1,expectedDisplayRevision:0};
 assert.deepEqual(normalizeSettlement(value).optionalChargeIds,[id(3),id(4)]);
 for (const modification of [r=>delete r.optionalChargeIds,r=>r.expectedScale='2',r=>r.expectedPayableMinor='01',r=>r.actorId=id(90)]) {
  const r=structuredClone(value); modification(r); rejectsCode(()=>normalizeSettlement(r),'INVALID_BILLING_INPUT');
 }
});

test('BP-A14/A17: quantity is included before line rounding and every bounded allocation reconciles',()=>{
 const quantityOrder=order('10',2);
 assert.equal(calculateAssessment(quantityOrder,policy([tax(1)],[],'halfEven'),display,[]).taxMinor,'1');
 for (const mode of ['halfUp','halfEven']) for (const amount of ['1','2','3','5','99','100']) {
  const p=policy([tax(1,'100','inclusive'),tax(2,'100','inclusive'),tax(3,'0','inclusive'),tax(4,'2')],[],mode);
  const a=calculateAssessment(order(amount),p,display,[]);
  assert.equal(BigInt(a.netMinor)+BigInt(a.taxMinor),BigInt(a.payableMinor));
  assert.equal(BigInt(a.merchandiseMinor)+BigInt(a.chargesMinor)+BigInt(a.addedTaxMinor),BigInt(a.payableMinor));
  assert.equal(a.lines[0].taxes.filter(t=>t.ruleId!==id(4)).reduce((n,t)=>n+BigInt(t.amountMinor),0n),BigInt(a.includedTaxMinor));
  assert.equal(a.lines[0].taxes.find(t=>t.ruleId===id(3)).amountMinor,'0');
 }
});
