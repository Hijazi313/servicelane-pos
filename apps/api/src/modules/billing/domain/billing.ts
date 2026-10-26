import type { OrderFinancial } from '../../orders/public.js';
import type { DisplayView } from '../../business/public.js';

export type BillingErrorCode = 'INVALID_BILLING_INPUT' | 'ORDER_NOT_FOUND' | 'BILL_NOT_FOUND' | 'BILLING_POLICY_UNCONFIGURED' | 'STALE_ASSESSMENT' | 'STALE_BILLING_POLICY' | 'SETTLEMENT_RETRY_CONFLICT' | 'ORDER_ALREADY_SETTLED' | 'BILL_CAPACITY' | 'POLICY_CAPACITY' | 'BILL_AMOUNT_OVERFLOW' | 'UNSUPPORTED_BILL_CURRENCY' | 'UNSUPPORTED_ZERO_PAYABLE' | 'REVISION_CAPACITY' | 'BILLING_UNAVAILABLE';
export class BillingError extends Error {
  constructor(readonly code: BillingErrorCode, readonly details?: { revision: number } | { policyRevision: number; displayRevision: number }) { super(code); }
}
export interface ChargeRule {
  id: string; enabled: boolean; label: string; application: 'automatic' | 'optional';
  kind: 'fixed' | 'percentage'; fixedMinor: string | null; ratePercent: string | null;
}
export interface TaxRule {
  id: string; enabled: boolean; label: string; ratePercent: string; priceMode: 'inclusive' | 'exclusive';
  targets: { merchandise: boolean; chargeIds: string[] };
}
export interface PolicyView {
  revision: number; status: 'configured' | 'unconfigured'; currencyCode: string | null; scale: number | null;
  rounding: 'halfUp' | 'halfEven'; charges: ChargeRule[]; taxes: TaxRule[];
}
export interface PolicyReplacement { expectedRevision: number; policy: Omit<PolicyView, 'revision'>; configurationNote: string }
export interface AssessmentRequest { orderId: string; optionalChargeIds: string[] }
export interface SettlementRequest extends AssessmentRequest {
  retryKey: string; expectedCurrencyCode: string; expectedScale: number; expectedPayableMinor: string;
  expectedPolicyRevision: number; expectedDisplayRevision: number;
}
export interface TaxComponent { ruleId: string; baseMinor: string; amountMinor: string }
export interface BillingLine {
  position: number; quantity: number; sellingUnit: OrderFinancial['lines'][number]['sellingUnit'];
  unitMerchandiseMinor: string; merchandiseMinor: string; netMinor: string; taxes: TaxComponent[]; taxMinor: string; payableMinor: string;
}
export interface ChargeLine { ruleId: string; baseMinor: string | null; netMinor: string; taxes: TaxComponent[]; taxMinor: string; payableMinor: string }
export interface TaxSummary { ruleId: string; merchandiseBaseMinor: string; chargeBaseMinor: string; merchandiseTaxMinor: string; chargeTaxMinor: string; amountMinor: string }
export interface AssessmentView {
  orderId: string; capturedAt: string; fulfillment: 'takeaway'; currencyCode: string; scale: number;
  businessDisplay: DisplayView; billingPolicy: PolicyView; optionalChargeIds: string[];
  lines: BillingLine[]; charges: ChargeLine[]; taxSummary: TaxSummary[];
  merchandiseMinor: string; merchandiseNetMinor: string; chargesMinor: string; includedTaxMinor: string;
  addedTaxMinor: string; netMinor: string; taxMinor: string; payableMinor: string;
}
export interface BillView extends AssessmentView { id: string; settledAt: string; payment: { method: 'cash'; amountMinor: string } }
export const BILL_RESPONSE_BYTES = 2_097_152, POLICY_BYTES = 16_384, MAX_REVISION = 2_147_483_647;
export function initialPolicy(): PolicyView { return { revision: 0, status: 'unconfigured', currencyCode: null, scale: null, rounding: 'halfUp', charges: [], taxes: [] }; }
function invalid(): never { throw new BillingError('INVALID_BILLING_INPUT'); }
export function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) invalid();
  const record: Record<string, unknown> = Object.fromEntries(Object.entries(value));
  if (keys.some(key => !Object.hasOwn(record, key))) invalid();
  return record;
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalid();
  return value.toLowerCase();
}
export function integer(value: unknown, max = MAX_REVISION): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) invalid();
  return value;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || /[\p{Cc}\p{Cs}]/u.test(value)) invalid();
  const normalized = value.trim();
  if (!normalized || [...normalized].length > max) invalid();
  return normalized;
}
function bool(value: unknown): boolean { if (typeof value !== 'boolean') invalid(); return value; }
function choice<T extends string>(value: unknown, choices: readonly T[]): T {
  for (const candidate of choices) if (candidate === value) return candidate;
  return invalid();
}
function array(value: unknown): unknown[] { if (!Array.isArray(value) || value.length > 8) invalid(); return value; }
export function selection(value: unknown): string[] {
  const ids = array(value).map(identifier).sort();
  if (new Set(ids).size !== ids.length) invalid();
  return ids;
}
function minor(value: unknown, positive = false): string {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,23})$/.test(value) || (positive && value === '0')) invalid();
  return value;
}
function currency(value: unknown): string { if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) invalid(); return value; }
function rate(value: unknown, positive = false): string {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]?|100)(\.[0-9]{0,3}[1-9])?$/.test(value)) invalid();
  if (rateUnits(value) > 1_000_000n || (positive && rateUnits(value) === 0n)) invalid();
  return value;
}
export function rateUnits(ratePercent: string): bigint {
  const [whole = '', fraction = ''] = ratePercent.split('.');
  return BigInt(whole) * 10_000n + BigInt(fraction.padEnd(4, '0'));
}
export function normalizePolicyReplacement(value: unknown): PolicyReplacement {
  const row = object(value, ['expectedRevision', 'status', 'currencyCode', 'scale', 'rounding', 'charges', 'taxes', 'configurationNote']);
  const charges = array(row.charges).map(value => {
    const r = object(value, ['id','enabled','label','application','kind','fixedMinor','ratePercent']);
    const kind = choice(r.kind, ['fixed','percentage']);
    const fixedMinor = kind === 'fixed' ? minor(r.fixedMinor, true) : null;
    const ratePercent = kind === 'percentage' ? rate(r.ratePercent, true) : null;
    if ((kind === 'fixed' && r.ratePercent !== null) || (kind === 'percentage' && r.fixedMinor !== null)) invalid();
    return { id: identifier(r.id), enabled: bool(r.enabled), label: text(r.label,80), application: choice(r.application,['automatic','optional']), kind, fixedMinor, ratePercent };
  }).sort((a,b) => a.id.localeCompare(b.id));
  const taxes = array(row.taxes).map(value => {
    const r = object(value,['id','enabled','label','ratePercent','priceMode','targets']), t = object(r.targets,['merchandise','chargeIds']);
    const targets = { merchandise: bool(t.merchandise), chargeIds: selection(t.chargeIds) };
    const priceMode = choice(r.priceMode,['inclusive','exclusive']);
    if ((!targets.merchandise && !targets.chargeIds.length) || targets.chargeIds.some(id => !charges.some(charge => charge.id === id))
      || (priceMode === 'inclusive' && (!targets.merchandise || targets.chargeIds.length))) invalid();
    return { id: identifier(r.id), enabled: bool(r.enabled), label: text(r.label,80), ratePercent: rate(r.ratePercent), priceMode, targets };
  }).sort((a,b) => a.id.localeCompare(b.id));
  const ids = [...charges,...taxes].map(rule => rule.id);
  if (new Set(ids).size !== ids.length) invalid();
  const status = choice(row.status,['configured','unconfigured']);
  const currencyCode = status === 'configured' ? currency(row.currencyCode) : null;
  const scale = status === 'configured' ? integer(row.scale,4) : null;
  if (status === 'unconfigured' && (row.currencyCode !== null || row.scale !== null || charges.length || taxes.length)) invalid();
  return { expectedRevision: integer(row.expectedRevision), configurationNote: text(row.configurationNote,500), policy: { status,currencyCode,scale,rounding: choice(row.rounding,['halfUp','halfEven']),charges,taxes } };
}
export function normalizeAssessment(value: unknown): AssessmentRequest {
  const row = object(value,['orderId','optionalChargeIds']);
  return { orderId: identifier(row.orderId), optionalChargeIds: selection(row.optionalChargeIds) };
}
export function normalizeSettlement(value: unknown): SettlementRequest {
  const row = object(value,['orderId','optionalChargeIds','retryKey','expectedCurrencyCode','expectedScale','expectedPayableMinor','expectedPolicyRevision','expectedDisplayRevision']);
  return { orderId: identifier(row.orderId), optionalChargeIds: selection(row.optionalChargeIds), retryKey: identifier(row.retryKey), expectedCurrencyCode: currency(row.expectedCurrencyCode),
    expectedScale: integer(row.expectedScale,4), expectedPayableMinor: minor(row.expectedPayableMinor,true), expectedPolicyRevision: integer(row.expectedPolicyRevision), expectedDisplayRevision: integer(row.expectedDisplayRevision) };
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,val])=>JSON.stringify(key)+':'+canonical(val)).join(',') + '}';
  const result = JSON.stringify(value); if (result === undefined) invalid(); return result;
}
export function assertRuleIdentities(current: PolicyView, next: Omit<PolicyView,'revision'>, retiredIds: readonly string[]): void {
  const retired = new Set(retiredIds);
  for (const rule of [...next.charges,...next.taxes]) if (retired.has(rule.id)) invalid();
  if (next.charges.some(rule=>current.taxes.some(tax=>tax.id===rule.id)) || next.taxes.some(rule=>current.charges.some(charge=>charge.id===rule.id))) invalid();
}
export function checkedAmount(value: bigint): string {
  if (value < 0n || value >= 10n ** 24n) throw new BillingError('BILL_AMOUNT_OVERFLOW');
  return value.toString();
}
export function round(numerator: bigint, denominator: bigint, mode: PolicyView['rounding']): bigint {
  const quotient = numerator / denominator, remainder = numerator % denominator, twice = remainder * 2n;
  return quotient + (twice > denominator || (twice === denominator && (mode === 'halfUp' || quotient % 2n === 1n)) ? 1n : 0n);
}
function sum(values: readonly string[]): bigint { return values.reduce((total,value)=>total+BigInt(value),0n); }
function envelopeBytes(value: unknown): number { return Buffer.byteLength(JSON.stringify({data:value,meta:{requestId:'00000000-0000-0000-0000-000000000000'}}),'utf8'); }
export function assertBillCapacity(view: AssessmentView | BillView): void {
  if (envelopeBytes(view) > BILL_RESPONSE_BYTES) throw new BillingError('BILL_CAPACITY');
}
export function assertPolicyCapacity(view: PolicyView): void {
  const {revision: _revision,...effective} = view;
  const future = {expectedRevision:MAX_REVISION,...effective,configurationNote:'😀'.repeat(500)};
  if (envelopeBytes(view)>POLICY_BYTES || Buffer.byteLength(JSON.stringify(future),'utf8')>POLICY_BYTES) throw new BillingError('POLICY_CAPACITY');
}
export function calculateAssessment(order: OrderFinancial, policy: PolicyView, display: DisplayView, optionalChargeIds: string[]): AssessmentView {
  if (policy.status !== 'configured') throw new BillingError('BILLING_POLICY_UNCONFIGURED');
  if (policy.currencyCode !== order.currencyCode || policy.scale !== order.scale || display.currencyCode !== order.currencyCode) throw new BillingError('UNSUPPORTED_BILL_CURRENCY');
  const selected = selection(optionalChargeIds);
  if (selected.some(id => !policy.charges.some(rule => rule.id === id && rule.enabled && rule.application === 'optional'))) invalid();
  const taxes = policy.taxes.filter(tax=>tax.enabled), inclusive = taxes.filter(tax=>tax.priceMode==='inclusive');
  const totalRate = inclusive.reduce((total,tax)=>total+rateUnits(tax.ratePercent),0n), denominator = 1_000_000n+totalRate;
  let includedTotal = 0n;
  const lines: BillingLine[] = order.lines.map(line => {
    const merchandise = BigInt(line.merchandiseMinor), included = round(merchandise*totalRate,denominator,policy.rounding), net = merchandise-included;
    includedTotal += included;
    const allocations = inclusive.map(rule => ({rule, amount: merchandise*rateUnits(rule.ratePercent)/denominator, remainder: merchandise*rateUnits(rule.ratePercent)%denominator}));
    let left = included-allocations.reduce((total,allocation)=>total+allocation.amount,0n);
    allocations.sort((a,b)=>a.remainder===b.remainder ? a.rule.id.localeCompare(b.rule.id) : a.remainder>b.remainder ? -1:1);
    for (const allocation of allocations) if (left>0n && allocation.remainder>0n) { allocation.amount++; left--; }
    if (left!==0n) throw new Error('Invalid included allocation');
    const components: TaxComponent[] = taxes.filter(tax=>tax.targets.merchandise).map(rule=> {
      const amount = rule.priceMode==='inclusive' ? allocations.find(allocation=>allocation.rule.id===rule.id)?.amount : round(net*rateUnits(rule.ratePercent),1_000_000n,policy.rounding);
      if (amount === undefined) throw new Error('Invalid included allocation');
      return {ruleId:rule.id,baseMinor:checkedAmount(rule.priceMode==='inclusive'?merchandise:net),amountMinor:checkedAmount(amount)};
    }).sort((a,b)=>a.ruleId.localeCompare(b.ruleId));
    const tax = sum(components.map(component=>component.amountMinor));
    return {position:line.position,quantity:line.quantity,sellingUnit:structuredClone(line.sellingUnit),unitMerchandiseMinor:line.unitMerchandiseMinor,
      merchandiseMinor:line.merchandiseMinor,netMinor:checkedAmount(net),taxes:components,taxMinor:checkedAmount(tax),payableMinor:checkedAmount(net+tax)};
  });
  const merchandiseNet = sum(lines.map(line=>line.netMinor));
  const charges: ChargeLine[] = policy.charges.filter(rule=>rule.enabled && (rule.application==='automatic'||selected.includes(rule.id))).map(rule=> {
    let charge: bigint;
    if (rule.kind==='fixed' && rule.fixedMinor!==null) charge=BigInt(rule.fixedMinor);
    else if (rule.kind==='percentage' && rule.ratePercent!==null) charge=round(merchandiseNet*rateUnits(rule.ratePercent),1_000_000n,policy.rounding);
    else throw new Error('Invalid stored charge');
    const components = taxes.filter(tax=>tax.targets.chargeIds.includes(rule.id)).map(tax=>({ruleId:tax.id,baseMinor:checkedAmount(charge),amountMinor:checkedAmount(round(charge*rateUnits(tax.ratePercent),1_000_000n,policy.rounding))})).sort((a,b)=>a.ruleId.localeCompare(b.ruleId));
    const tax = sum(components.map(component=>component.amountMinor));
    return {ruleId:rule.id,baseMinor:rule.kind==='fixed'?null:checkedAmount(merchandiseNet),netMinor:checkedAmount(charge),taxes:components,taxMinor:checkedAmount(tax),payableMinor:checkedAmount(charge+tax)};
  }).sort((a,b)=>a.ruleId.localeCompare(b.ruleId));
  const taxSummary: TaxSummary[] = taxes.flatMap(rule=> {
    const merchandiseComponents=lines.flatMap(line=>line.taxes.filter(tax=>tax.ruleId===rule.id));
    const chargeComponents=charges.flatMap(charge=>charge.taxes.filter(tax=>tax.ruleId===rule.id));
    if (!merchandiseComponents.length&&!chargeComponents.length) return [];
    const merchandiseTax=sum(merchandiseComponents.map(component=>component.amountMinor)), chargeTax=sum(chargeComponents.map(component=>component.amountMinor));
    return [{ruleId:rule.id,merchandiseBaseMinor:checkedAmount(sum(merchandiseComponents.map(component=>component.baseMinor))),chargeBaseMinor:checkedAmount(sum(chargeComponents.map(component=>component.baseMinor))),
      merchandiseTaxMinor:checkedAmount(merchandiseTax),chargeTaxMinor:checkedAmount(chargeTax),amountMinor:checkedAmount(merchandiseTax+chargeTax)}];
  }).sort((a,b)=>a.ruleId.localeCompare(b.ruleId));
  const chargesTotal=sum(charges.map(charge=>charge.netMinor)), taxTotal=sum(taxSummary.map(tax=>tax.amountMinor)), netTotal=merchandiseNet+chargesTotal, payable=netTotal+taxTotal;
  if (payable<=0n) throw new BillingError('UNSUPPORTED_ZERO_PAYABLE');
  const view: AssessmentView = {orderId:order.orderId,capturedAt:order.capturedAt,fulfillment:order.fulfillment,currencyCode:order.currencyCode,scale:order.scale,
    businessDisplay:structuredClone(display),billingPolicy:structuredClone(policy),optionalChargeIds:selected,lines,charges,taxSummary,merchandiseMinor:order.merchandiseMinor,
    merchandiseNetMinor:checkedAmount(merchandiseNet),chargesMinor:checkedAmount(chargesTotal),includedTaxMinor:checkedAmount(includedTotal),addedTaxMinor:checkedAmount(taxTotal-includedTotal),
    netMinor:checkedAmount(netTotal),taxMinor:checkedAmount(taxTotal),payableMinor:checkedAmount(payable)};
  assertBillCapacity(view);
  assertBillCapacity({...view,id:'00000000-0000-0000-0000-000000000000',settledAt:'9999-12-31T23:59:59.999Z',payment:{method:'cash',amountMinor:view.payableMinor}});
  return view;
}
