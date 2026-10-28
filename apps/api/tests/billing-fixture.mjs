import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { BillingService } from '../dist/billing-check/modules/billing/application/billing.service.js';
import { initialPolicy } from '../dist/billing-check/modules/billing/domain/billing.js';
import { AccessError } from '../dist/billing-check/modules/authentication/application/access-policy.js';
import { DrawerError } from '../dist/billing-check/modules/cashier-shifts/public.js';

export function billingFixture() {
  const scope = { installation: { businessId: randomUUID(), branchId: randomUUID() }, actorId: randomUUID(), transaction: { id: Symbol() } };
  let current = initialPolicy(), display = { revision: 0, businessName: 'Offline business', branchName: 'Offline branch', branchAddress: null, currencyCode: 'PKR', timezone: 'Asia/Karachi' };
  let records = [], history = [], retired = [], attributions = [], fail = false, denied = false, administrator = true, projectionReads = 0;
  const sessionId = randomUUID(); let drawerError;
  const order = { orderId: randomUUID(), capturedAt: '2026-10-26T00:00:00.000Z', fulfillment: 'takeaway', currencyCode: 'PKR', scale: 2, merchandiseMinor: '10000', lines: [
    { position: 0, quantity: 1, unitMerchandiseMinor: '10000', merchandiseMinor: '10000', sellingUnit: { offeringId: randomUUID(), name: 'Offline item', components: [{ itemId: randomUUID(), itemName: 'Item', variantId: randomUUID(), variantName: 'Size', quantity: 1 }], addOns: [], choices: [] } },
  ] };
  const access = {
    async authorize(proof, admin) { if (denied || proof.session !== 'offline') throw new AccessError('UNAUTHENTICATED', 'Denied'); if (admin && !administrator) throw new AccessError('FORBIDDEN', 'Denied'); },
    async me(proof) { await this.authorize(proof); return { ...scope.installation, business: {} }; },
    async runAuthorized(proof, role, operation) {
      await this.authorize(proof, role === 'administrator');
      if (proof.csrf !== 'offline-csrf') throw new AccessError('FORBIDDEN', 'Denied');
      const before = structuredClone({ records, history, retired, current, attributions });
      try { const result = await operation(scope); if (fail) throw new Error('Synthetic SQL secret'); return result; }
      catch (error) { ({ records, history, retired, current, attributions } = before); throw error; }
    },
  };
  const store = {
    async policy() { return structuredClone(current); }, async retiredRuleIds() { return retired; },
    async replacePolicy(_scope, change) { history.push(structuredClone(change)); const nextIds = [...change.next.charges, ...change.next.taxes].map(r => r.id); retired.push(...[...current.charges, ...current.taxes].map(r => r.id).filter(id => !nextIds.includes(id))); current = structuredClone(change.next); },
    async forOrder(_scope, id) { return structuredClone(records.find(r => r.bill.orderId === id)); },
    async forRetry(_scope, key) { return structuredClone(records.find(r => r.request.retryKey === key)); },
    async insert(_scope, record) { records.push(structuredClone(record)); },
  };
  const orders = { async get(receivedScope, id) { assert.equal(receivedScope, scope); projectionReads++; return id === order.orderId ? structuredClone(order) : undefined; } };
  const displays = { async get(receivedScope) { assert.equal(receivedScope, scope); return structuredClone(display); } };
  const cashier = { async attribute(receivedScope, input) {
    assert.equal(receivedScope, scope);
    if (drawerError) throw new DrawerError(drawerError);
    if (input.sessionId !== sessionId) throw new DrawerError('DRAWER_NOT_FOUND');
    attributions.push(structuredClone(input));
  } };
  const service = new BillingService(access, orders, displays, store, cashier), proof = { session: 'offline', csrf: 'offline-csrf' };
  const policy = (overrides = {}) => ({ expectedRevision: current.revision, status: 'configured', currencyCode: 'PKR', scale: 2, rounding: 'halfUp', charges: [], taxes: [], configurationNote: 'Approved offline sample', ...overrides });
  const request = (assessment, overrides = {}) => ({ orderId: order.orderId, retryKey: randomUUID(), optionalChargeIds: [], expectedCurrencyCode: assessment.currencyCode, expectedScale: assessment.scale, expectedPayableMinor: assessment.payableMinor, expectedPolicyRevision: assessment.billingPolicy.revision, expectedDisplayRevision: assessment.businessDisplay.revision, sessionId, ...overrides });
  return { service, access, proof, scope, order, store, displays, policy, request, sessionId, cashier,
    state: () => ({ current, display, records, history, retired, projectionReads, attributions }), setDisplay: next => { display = { ...display, ...next }; },
    drawerError: value => { drawerError = value; },
    fail: value => { fail = value; }, deny: value => { denied = value; }, admin: value => { administrator = value; } };
}
