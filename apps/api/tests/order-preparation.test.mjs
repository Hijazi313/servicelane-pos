import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderPreparationService } from '../dist/orders-check/modules/orders/public.js';
import { fixture } from './orders-fixture.mjs';

test('Orders preparation uses authorized transaction and explicitly strips all non-preparation fields', async () => {
  const h = fixture();
  const saved = await h.service.create(h.proof, h.body({ customer: { name: 'SyntheticGuest', phone: '+1234' }, instructions: 'Pack separately' }));
  const line = saved.lines[0]; line.quantity = 3; line.unit.components[0].quantity = 2;
  line.unit.addOns = [{ id: 'extra', name: 'Extra', surcharge: '3.00' }];
  line.unit.choices = [{ groupId: 'group', optionId: 'choice', name: 'Choice', surcharge: '4.00' }];
  line.instructions = 'No salt';
  let calls = 0;
  const reader = new OrderPreparationService({ get: async (business, branch, id, transaction) => {
    assert.equal(business, h.installation.businessId); assert.equal(branch, h.installation.branchId);
    assert.equal(id, saved.id); assert.ok(transaction); calls++; return structuredClone(saved);
  } });
  const result = await h.access.runAuthorized(h.proof, 'staff', scope => reader.get(scope, saved.id));
  assert.equal(calls, 1); assert.equal(result.lines[0].quantity * result.lines[0].components[0].quantity, 6);
  assert.deepEqual(result.lines[0].addOns, [{ id: 'extra', name: 'Extra' }]);
  assert.deepEqual(result.lines[0].choices, [{ groupId: 'group', optionId: 'choice', name: 'Choice' }]);
  assert.equal(result.instructions, 'Pack separately'); assert.equal(result.lines[0].instructions, 'No salt');
  assert.doesNotMatch(JSON.stringify(result), /SyntheticGuest|surcharge|unitMinor|totalMinor|currencyCode|policy|retryKey/);
  assert.equal('customer' in result, false); assert.equal('selection' in result.lines[0], false);
  h.state().catalogue.length = 0;
  const again = await h.access.runAuthorized(h.proof, 'staff', scope => reader.get(scope, saved.id));
  assert.deepEqual(again, result);
});

test('Orders preparation preserves absence and fails closed on inconsistent history', async () => {
  const h = fixture(), saved = await h.service.create(h.proof, h.body());
  let snapshot;
  const reader = new OrderPreparationService({ get: async () => snapshot });
  assert.equal(await h.access.runAuthorized(h.proof, 'staff', scope => reader.get(scope, saved.id)), undefined);
  snapshot = { ...saved, id: 'different' };
  await assert.rejects(h.access.runAuthorized(h.proof, 'staff', scope => reader.get(scope, saved.id)), /preparation unavailable/);
});
