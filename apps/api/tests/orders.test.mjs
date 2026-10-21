import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fixture } from './orders-fixture.mjs';
import { OrdersError, RESPONSE_BYTES, canonical, checkedAmount } from '../dist/orders-check/modules/orders/domain/capture.js';
import { snapshotFits } from '../dist/orders-check/modules/orders/application/orders.service.js';
const rejects = (work, code) => assert.rejects(work, error => { if (error instanceof OrdersError) { assert.equal('status' in error, false); return code === 400 ? error.code.startsWith('INVALID_') : error.code === code; } return error.reason === code; });

test('capture exact snapshots and customer instructions; replay survives Menu/policy and JSONB key-order changes', async () => {
  const h = fixture(), body = h.body({ customer: { name: ' Synthetic guest ', phone: '+1 (555) 010-0000' }, instructions: ' Pack separately ' });
  body.lines[0].instructions = ' No salt ';
  const saved = await h.service.create(h.proof, body);
  assert.equal(saved.totalMinor, '2468'); assert.equal(saved.customer.name, 'Synthetic guest'); assert.equal(saved.lines[0].instructions, 'No salt');
  assert.equal(saved.amountKind, 'merchandise'); assert.equal('payableTotal' in saved, false); assert.equal(h.reads(), 1);
  h.state().catalogue[0].active = false;
  await h.service.updatePolicy(h.proof, { maxLines: 1, maxQuantity: 1, expectedRevision: 0 });
  const original = h.state().orders[0].order.request;
  h.state().orders[0].order.request = Object.fromEntries(Object.entries(original).reverse());
  assert.deepEqual(await h.service.create(h.proof, body), saved); assert.equal(h.reads(), 1); assert.deepEqual(await h.service.get(h.proof, saved.id), saved);
  await rejects(() => h.service.create(h.proof, { ...body, instructions: 'Different' }), 'RETRY_CONTENT_CONFLICT');
  h.state().session.revokedAt = new Date(); await rejects(() => h.service.create(h.proof, body), 'UNAUTHENTICATED');
});

test('price conflict returns only changed exact amounts and reserves no key', async () => {
  const h = fixture(), body = h.body(); body.lines[0].expectedUnitMinor = '1233';
  await assert.rejects(() => h.service.create(h.proof, body), error => {
    assert.equal(error.code, 'PRICE_CONFIRMATION_REQUIRED'); assert.deepEqual(error.details, { currencyCode: 'PKR', scale: 2, lines: [{ line: 0, unitMinor: '1234' }] }); return true;
  });
  assert.equal(h.state().orders.length, 0); body.lines[0].expectedUnitMinor = '1234';
  await h.service.create(h.proof, body); assert.equal(h.state().orders.length, 1);
  await rejects(() => h.service.create(h.proof, h.body({ currencyCode: 'JPY', scale: 0 })), 'PRICE_CONFIRMATION_REQUIRED');
});

test('concurrent attempts through actual authorization create one aggregate; injected post-write failure rolls back', async () => {
  const h = fixture(), body = h.body();
  const results = await Promise.all(Array.from({ length: 6 }, () => h.service.create(h.proof, structuredClone(body))));
  assert.equal(new Set(results.map(row => row.id)).size, 1); assert.equal(h.state().orders.length, 1);
  const failing = fixture(); failing.failSave();
  await assert.rejects(() => failing.service.create(failing.proof, failing.body())); assert.equal(failing.state().orders.length, 0);
});

test('defaults/configurable limits, stale revisions and current admin/CSRF; foreign branch is not found', async () => {
  const h = fixture(); assert.deepEqual(await h.service.policy(h.proof), { maxLines: 50, maxQuantity: 100, revision: 0 });
  const body = h.body(); body.lines[0].quantity = 101; await rejects(() => h.service.create(h.proof, body), 'ORDER_LIMIT_EXCEEDED');
  await h.service.updatePolicy(h.proof, { maxLines: 500, maxQuantity: 1000, expectedRevision: 0 });
  await rejects(() => h.service.updatePolicy(h.proof, { maxLines: 1, maxQuantity: 1, expectedRevision: 0 }), 'STALE_ORDER_POLICY');
  const saved = await h.service.create(h.proof, body); assert.equal(saved.totalMinor, String(1234 * 101));
  h.state().account.role = 'staff'; await rejects(() => h.service.updatePolicy(h.proof, { maxLines: 1, maxQuantity: 1, expectedRevision: 1 }), 'FORBIDDEN');
  await rejects(() => h.service.create({ ...h.proof, csrf: 'wrong' }, h.body()), 'FORBIDDEN');
  h.installation.branchId = randomUUID(); h.state().account.branchIds = [h.installation.branchId];
  await rejects(() => h.service.get(h.proof, saved.id), 'ORDER_NOT_FOUND');
});

test('structural normalization and malformed personal/monetary input; no persistence', async () => {
  const h = fixture(), id = h.item.id;
  assert.deepEqual(h.menu.normalize({ offeringId: id.toUpperCase(), addOnIds: [], choices: [] }), h.menu.normalize({ offeringId: id }));
  for (const change of [{ lines: [] }, { customer: { address: 'Synthetic' } }, { customer: { name: 'x'.repeat(121) } }, { customer: { phone: 'abc' } }, { instructions: 'x'.repeat(501) }, { payableTotal: '0' }]) await rejects(() => h.service.create(h.proof, h.body(change)), 400);
  for (const value of ['-1', '1.00', '01', '1e3', '1'.repeat(25), 1234]) {
    const body = h.body(); body.lines[0].expectedUnitMinor = value; await rejects(() => h.service.create(h.proof, body), 400);
  }
  assert.equal(checkedAmount(10n ** 24n - 1n).length, 24); assert.throws(() => checkedAmount(10n ** 24n));
  assert.equal(h.state().orders.length, 0); assert.equal(canonical({ a: 1, b: 2 }), canonical({ b: 2, a: 1 }));
});

test('resolved unit prices above configured single-price ceiling remain exact', async () => {
  const h = fixture(), row = h.state().catalogue[0]; row.variants[0].price = '999999999.00';
  row.addOnGroups = [{ id: randomUUID(), name: 'Synthetic', maximum: 1, options: [{ id: randomUUID(), name: 'Extra', surcharge: '999999999.00', active: true }] }];
  const body = h.body(); body.lines[0].selection.addOnIds = [row.addOnGroups[0].options[0].id]; body.lines[0].expectedUnitMinor = '199999999800';
  const saved = await h.service.create(h.proof, body); assert.equal(saved.totalMinor, '399999999600'); assert.equal('active' in saved.lines[0].unit.addOns[0], false);
});

test('inclusive response byte boundary, multibyte names and atomic expanded-response rejection', async () => {
  const h = fixture(), saved = await h.service.create(h.proof, h.body());
  const base = { ...saved, instructions: '' }, overhead = Buffer.byteLength(JSON.stringify(base));
  base.instructions = 'x'.repeat(RESPONSE_BYTES - overhead); assert.equal(snapshotFits(base), true);
  base.instructions += 'x'; assert.equal(snapshotFits(base), false);
  base.instructions = 'é'.repeat(Math.floor((RESPONSE_BYTES - overhead) / 2)); assert.equal(snapshotFits(base), true);
  base.instructions = '"'.repeat(Math.floor((RESPONSE_BYTES - overhead) / 2)); assert.equal(snapshotFits(base), true);
  base.instructions += '"'; assert.equal(snapshotFits(base), false);
  const failing = fixture(); failing.menu.resolve = async (scope, selections) => selections.map(selection => ({ offeringId: selection.offeringId, name: 'x'.repeat(RESPONSE_BYTES), revision: 1, currencyCode: 'PKR', scale: 2, unitMinor: '1234', components: [], addOns: [], choices: [] }));
  await rejects(() => failing.service.create(failing.proof, failing.body()), 'ORDER_RESPONSE_CAPACITY'); assert.equal(failing.state().orders.length, 0);
});

test('Menu consumer resolves combos from one snapshot and canonicalizes unordered choices without current pricing', async () => {
  const { definition } = await import('../dist/orders-check/modules/menu/domain/catalogue.js');
  const h = fixture(), item = h.state().catalogue[0];
  const combo = definition({ kind: 'combo', name: 'Synthetic combo', active: true, basePrice: '20', components: [{ variantId: item.variants[0].id, quantity: 2 }], choiceGroups: [{ name: 'Choice', minimum: 1, maximum: 1, options: [{ name: 'Extra portion', variantId: item.variants[0].id, quantity: 1, surcharge: '1', active: true }] }] }, 'PKR');
  h.state().catalogue.push(combo); const group = combo.choiceGroups[0];
  const body = h.body(); body.lines = [{ selection: { offeringId: combo.id, choices: [{ groupId: group.id, optionIds: [group.options[0].id] }] }, quantity: 3, expectedUnitMinor: '2100' }, ...body.lines];
  const saved = await h.service.create(h.proof, body); assert.equal(h.reads(), 1); assert.equal(saved.lines[0].unit.components.length, 2); assert.equal(saved.lines[0].unit.components[0].quantity, 2); assert.equal(saved.totalMinor, '8768');
  h.state().catalogue = []; assert.deepEqual(await h.service.create(h.proof, body), saved);
});

test('same-price edits resolve current composition on first capture and preserve history thereafter', async () => {
  const h = fixture(), body = h.body(); h.state().catalogue[0].name = 'New synthetic name';
  const saved = await h.service.create(h.proof, body); assert.equal(saved.lines[0].unit.name, 'New synthetic name');
  h.state().catalogue[0].name = 'Later synthetic name'; assert.deepEqual(await h.service.get(h.proof, saved.id), saved);
});

test('real Menu projection expansion can exceed response budget from a transport-sized request', async () => {
  const { definition } = await import('../dist/orders-check/modules/menu/domain/catalogue.js');
  const h = fixture();
  const item = definition({ kind: 'item', name: 'é'.repeat(120), active: true, sized: true, variants: Array.from({ length: 32 }, (_, i) => ({ name: String(i).padStart(2, '0') + 'é'.repeat(118), price: '1', active: true })), addOnGroups: [] }, 'PKR');
  const combo = definition({ kind: 'combo', name: 'Synthetic', active: true, basePrice: '1', components: item.variants.map(row => ({ variantId: row.id, quantity: 1 })), choiceGroups: [] }, 'PKR');
  h.state().catalogue.push(item, combo);
  await h.service.updatePolicy(h.proof, { maxLines: 100, maxQuantity: 100, expectedRevision: 0 });
  const body = h.body({ lines: Array.from({ length: 100 }, () => ({ selection: { offeringId: combo.id }, quantity: 1, expectedUnitMinor: '100' })) });
  assert.ok(Buffer.byteLength(JSON.stringify(body)) < 16_384);
  await rejects(() => h.service.create(h.proof, body), 'ORDER_RESPONSE_CAPACITY'); assert.equal(h.state().orders.length, 0);
});

test('replay normalizes UUID/set/property order and optional blanks without another catalogue read', async () => {
  const h = fixture(), item = h.state().catalogue[0];
  const options = [1, 2].map(i => ({ id: randomUUID(), name: `Synthetic ${i}`, surcharge: '1.00', active: true }));
  item.addOnGroups = [{ id: randomUUID(), name: 'Synthetic extras', maximum: 2, options }];
  const body = h.body({ customer: {}, instructions: '  ' }); body.lines[0].selection.addOnIds = options.map(row => row.id); body.lines[0].expectedUnitMinor = '1434';
  const first = await h.service.create(h.proof, body), again = structuredClone(body);
  delete again.customer; delete again.instructions;
  again.lines[0].selection = { choices: [], addOnIds: options.map(row => row.id.toUpperCase()).reverse(), offeringId: item.id.toUpperCase() };
  assert.deepEqual(await h.service.create(h.proof, again), first); assert.equal(h.reads(), 1);
});
