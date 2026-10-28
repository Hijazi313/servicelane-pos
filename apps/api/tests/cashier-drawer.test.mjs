import test from 'node:test';
import assert from 'node:assert/strict';
import { openDrawer, recordCashSale, recordCashMovement, beginHandover, acceptHandover, closeDrawer } from '../dist/cashier-check/modules/cashier-shifts/domain/drawer-session.js';

const input = { id: 'session', drawerId: 'drawer', actorId: 'cashier', currencyCode: 'PKR', scale: 2,
  openingMinor: '1000', openedAt: '2026-10-28T12:00:00.000Z' };
const rejects = (fn, code) => assert.throws(fn, error => error.code === code);

test('opening validates money and retains server-provided provenance', () => {
  const session = openDrawer(input);
  assert.equal(session.openedBy, 'cashier');
  assert.equal(session.openedAt, input.openedAt);
  assert.equal(session.revision, 0);
  for (const amount of ['-1', '01', '1.5', '1'.repeat(25)]) rejects(() => openDrawer({ ...input, openingMinor: amount }), 'INVALID_AMOUNT');
  rejects(() => openDrawer({ ...input, openedAt: '2026-02-30T12:00:00.000Z' }), 'INVALID_OPEN');
});

test('handover count is observed without changing expected balance and close retains variance', () => {
  let session = openDrawer(input);
  session = recordCashSale(session, 'cashier', '5000', 0);
  session = recordCashMovement(session, 'cashier', 'out', '100', 'Safe drop', 1);
  session = beginHandover(session, 'admin', true, 'recipient', 'handover', 2, input.openedAt);
  rejects(() => recordCashSale(session, 'cashier', '1', 3), 'HANDOVER_PENDING');
  rejects(() => acceptHandover(session, 'recipient', 'handover', '5800', null, 3), 'INVALID_REASON');
  const accepted = acceptHandover(session, 'recipient', 'handover', '5800', 'Count difference', 3);
  assert.equal(accepted.expectedMinor, '5900');
  assert.equal(accepted.varianceMinor, '-100');
  session = closeDrawer(accepted.session, 'recipient', false, { selfClose: true, replacementClose: false, replacementIds: [] }, '5800', 'Count difference', 4, input.openedAt);
  assert.equal(session.closed.expectedMinor, '5900');
  assert.equal(session.closed.varianceMinor, '-100');
  rejects(() => recordCashSale(session, 'recipient', '1', 5), 'DRAWER_CLOSED');
});
