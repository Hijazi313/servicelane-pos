import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openDrawer, closeDrawer } from '../dist/cashier-check/modules/cashier-shifts/domain/drawer-session.js';
import { CashierSettlementService } from '../dist/cashier-check/modules/cashier-shifts/application/cashier-settlement.service.js';

function fixture() {
  let session = openDrawer({ id: 'session', drawerId: 'drawer', actorId: 'cashier', currencyCode: 'PKR', scale: 2,
    openingMinor: '1000', openedAt: '2026-10-28T12:00:00.000Z' });
  const events = [];
  const transaction = { marker: 'same-transaction' };
  const scope = { actorId: 'cashier', installation: { businessId: 'business', branchId: 'branch' }, transaction };
  const store = {
    session: async (s, id, tx) => { assert.equal(tx, transaction); return id === session.id ? session : undefined; },
    updateSession: async (s, next, revision, tx) => { assert.equal(tx, transaction); assert.equal(revision, session.revision); session = next; return true; },
    appendEvent: async (s, event, tx) => { assert.equal(tx, transaction); events.push(event); },
  };
  return { service: new CashierSettlementService(store), scope, store, events, state: () => session,
    setSession: value => { session = value; }, input: { sessionId: 'session', billId: 'bill', amountMinor: '500', currencyCode: 'PKR', scale: 2, occurredAt: '2026-10-28T12:01:00.000Z' } };
}

test('cash sale updates the selected drawer and appends attribution in the supplied transaction', async () => {
  const f = fixture(); await f.service.attribute(f.scope, f.input);
  assert.equal(f.state().cashSalesMinor, '500');
  assert.equal(f.state().revision, 1);
  assert.deepEqual(f.events[0].payload, { billId: 'bill', amountMinor: '500' });
  assert.equal(f.events[0].actorId, 'cashier');
});

test('missing, closed, foreign-custodian and currency-mismatched sessions admit no attribution', async () => {
  for (const [change, code] of [
    [f => { f.input.sessionId = 'missing'; }, 'DRAWER_NOT_FOUND'],
    [f => { f.input.currencyCode = 'USD'; }, 'CURRENCY_MISMATCH'],
    [f => { f.scope.actorId = 'other'; }, 'NOT_CUSTODIAN'],
    [f => { f.setSession(closeDrawer(f.state(), 'cashier', false, { selfClose: true, replacementClose: false, replacementIds: [] }, '1000', null, 0, '2026-10-28T12:02:00.000Z')); }, 'DRAWER_CLOSED'],
  ]) {
    const f = fixture(); change(f);
    await assert.rejects(f.service.attribute(f.scope, f.input), error => error.code === code);
    assert.equal(f.events.length, 0);
  }
});
