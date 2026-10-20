import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { AccessService } from '../dist/orders-check/modules/authentication/public.js';
import { token, digest } from '../dist/orders-check/modules/authentication/application/access-policy.js';
import { MenuService } from '../dist/orders-check/modules/menu/application/menu.service.js';
import { MenuOrderResolver } from '../dist/orders-check/modules/menu/public.js';
import { definition } from '../dist/orders-check/modules/menu/domain/catalogue.js';
import { OrdersService } from '../dist/orders-check/modules/orders/application/orders.service.js';
import { OrdersError } from '../dist/orders-check/modules/orders/domain/capture.js';
export function fixture() {
  const installation = { businessId: randomUUID(), branchId: randomUUID(), business: { name: 'Synthetic', currencyCode: 'PKR', timezone: 'Asia/Karachi' }, branch: { name: 'Synthetic' } };
  const sessionToken = token(), csrf = token(), now = new Date();
  let state = { orders: [], policies: {}, catalogue: [], account: { id: randomUUID(), businessId: installation.businessId, branchIds: [installation.branchId], role: 'administrator', status: 'active', passwordChangeRequired: false }, session: { digest: digest(sessionToken), businessId: installation.businessId, createdAt: now, lastActivityAt: now, revokedAt: null, csrfToken: csrf } };
  state.session.accountId = state.account.id;
  let queue = Promise.resolve(), active, reads = 0, failSave = false;
  const accessStore = { run(work) {
    const result = queue.then(async () => {
      const before = structuredClone(state); active = { id: Symbol('synthetic') };
      try { return await work({ context: active, getSession: async key => key === state.session.digest ? structuredClone(state.session) : undefined,
        findAccount: async business => business === installation.businessId ? structuredClone(state.account) : undefined,
        saveSession: async session => { state.session = structuredClone(session); } }); }
      catch (error) { state = before; throw error; } finally { active = undefined; }
    }); queue = result.catch(() => {}); return result;
  } };
  const business = { resolveInstallationContext: async () => structuredClone(installation), validateBranchOwnership: async () => {} };
  const access = new AccessService(accessStore, business, {});
  const menuStore = { read: async (business, tx) => { assert.equal(tx, active); assert.equal(business, installation.businessId); reads++; return structuredClone(state.catalogue); } };
  const menu = new MenuOrderResolver(new MenuService(menuStore));
  const store = {
    policy: async (business, tx) => { if (tx) assert.equal(tx, active); return structuredClone(state.policies[business] ?? { maxLines: 50, maxQuantity: 100, revision: 0 }); },
    updatePolicy: async (business, value, expected, tx) => { assert.equal(tx, active); if ((state.policies[business]?.revision ?? 0) !== expected) throw new OrdersError('STALE_ORDER_POLICY'); state.policies[business] = structuredClone(value); },
    replay: async (business, branch, key, tx) => { assert.equal(tx, active); return structuredClone(state.orders.find(row => row.business === business && row.branch === branch && row.key === key)?.order); },
    get: async (business, branch, id) => structuredClone(state.orders.find(row => row.business === business && row.branch === branch && row.order.snapshot.id === id)?.order.snapshot),
    save: async (business, branch, key, order, tx) => { assert.equal(tx, active); state.orders.push({ business, branch, key, order: structuredClone(order) }); if (failSave) throw new Error('synthetic private driver detail'); },
  };
  const service = new OrdersService(access, menu, store);
  const item = definition({ kind: 'item', name: 'Synthetic meal', active: true, sized: false, variants: [{ name: 'Default', price: '12.34', active: true }], addOnGroups: [] }, 'PKR');
  state.catalogue.push(item);
  const body = (changes = {}) => ({ retryKey: randomUUID(), currencyCode: 'PKR', scale: 2, lines: [{ selection: { offeringId: item.id }, quantity: 2, expectedUnitMinor: '1234' }], ...changes });
  return { service, access, menu, store, body, item, installation, sessionToken, csrf, proof: { session: sessionToken, csrf }, state: () => state, reads: () => reads, failSave: () => { failSave = true; } };
}
