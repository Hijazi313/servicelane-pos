import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { definition, resolveSelection, validateReferences, activeView, precision } from '../dist/menu-check/modules/menu/domain/catalogue.js';
import { MenuService } from '../dist/menu-check/modules/menu/application/menu.service.js';
const context = { businessId: randomUUID(), branchId: randomUUID(), business: { name: 'Synthetic', currencyCode: 'PKR', timezone: 'Asia/Karachi' }, branch: { name: 'Synthetic' } };
const scope = { installation: context, transaction: { id: Symbol('offline') } };
function item(name = 'Fries') {
  return { kind: 'item', name, active: true, sized: true, variants: [{ name: 'Regular', price: '180', active: true }, { name: 'Large', price: '260', active: true }], addOnGroups: [{ name: 'Extras', maximum: 1, options: [{ name: 'Cheese', surcharge: '70', active: true }, { name: 'Jalapenos', surcharge: '40', active: true }] }] };
}
function combo(component, drinks = []) {
  return { kind: 'combo', name: 'Meal', active: true, basePrice: '650', components: [{ variantId: component, quantity: 1 }], choiceGroups: drinks.length ? [{ name: 'Drink', minimum: 1, maximum: 1, options: drinks.map((variantId, i) => ({ name: `Drink ${i}`, variantId, quantity: 1, surcharge: i ? '30' : '0', active: true })) }] : [] };
}
function edit(offering) { const { id, revision, currencyCode, scale, ...input } = structuredClone(offering); return input; }
const rejects = (work, reason) => assert.throws(work, error => { assert.equal('status' in error, false); return error.reason === reason; });
function fixture() {
  const businesses = new Map(); let reads = 0;
  const store = {
    read: async business => { reads++; return structuredClone(businesses.get(business) ?? []); },
    save: async (business, value, expected, tx) => {
      assert.equal(tx, scope.transaction);
      if (store.fail) throw new Error('injected before commit');
      const rows = businesses.get(business) ?? [], index = rows.findIndex(row => row.id === value.id);
      if (expected !== undefined && rows[index]?.revision !== expected) throw new Error('stale double write');
      if (index === -1) rows.push(structuredClone(value)); else rows[index] = structuredClone(value);
      businesses.set(business, rows);
    },
  };
  return { service: new MenuService(store), store, businesses, reads: () => reads };
}

test('sizes and optional extras price exactly; invalid selections never silently fall back', () => {
  const fries = definition(item(), 'PKR'), large = fries.variants[1].id, cheese = fries.addOnGroups[0].options[0].id;
  assert.equal(resolveSelection({ offeringId: fries.id, variantId: large, addOnIds: [cheese] }, [fries]).total, '330.00');
  for (const selection of [
    { offeringId: fries.id },
    { offeringId: fries.id, variantId: large, addOnIds: [cheese, cheese] },
    { offeringId: fries.id, variantId: large, addOnIds: [randomUUID()] },
    { offeringId: fries.id, variantId: large, addOnIds: fries.addOnGroups[0].options.map(row => row.id) },
    { offeringId: fries.id, variantId: large, price: '1' },
  ]) rejects(() => resolveSelection(selection, [fries]), 'INVALID_INPUT');
  fries.addOnGroups[0].options[0].active = false;
  rejects(() => resolveSelection({ offeringId: fries.id, variantId: large, addOnIds: [cheese] }, [fries]), 'SELECTION_UNAVAILABLE');
  assert.equal(activeView(fries, [fries]).addOnGroups[0].options.length, 1);
});

test('currency precision, decimal validation, stable nested IDs and naming invariants', () => {
  for (const [currency, scale] of [['JPY', 0], ['PKR', 2], ['KWD', 3]]) {
    assert.equal(precision(currency), scale);
    const input = item(); input.variants[0].price = scale ? `1.${'1'.repeat(scale)}` : '1';
    const result = definition(input, currency);
    assert.equal(resolveSelection({ offeringId: result.id, variantId: result.variants[0].id }, [result]).total, input.variants[0].price);
    input.variants[0].price = `1.${'1'.repeat(scale + 1)}`; rejects(() => definition(input, currency), 'INVALID_INPUT');
  }
  for (const mutate of [x => { x.name = ' '; }, x => { x.variants[1].name = 'regular'; }, x => { x.variants[0].price = '-1'; }, x => { x.variants[0].price = 180; }, x => { x.variants[0].id = randomUUID(); }, x => { x.addOnGroups[0].minimum = 1; }]) {
    const input = item(); mutate(input); rejects(() => definition(input, 'PKR'), 'INVALID_INPUT');
  }
  const original = definition(item(), 'PKR'), updated = definition(edit(original), 'PKR', original);
  assert.equal(updated.variants[0].id, original.variants[0].id);
  const missingVariant = edit(original); missingVariant.variants.pop(); rejects(() => definition(missingVariant, 'PKR', original), 'INVALID_INPUT');
  rejects(() => definition(edit(original), 'KWD', original), 'CURRENCY_CHANGED');
});

test('fixed and selectable combos use their own prices and configured 1/1 or 2/2 choices', () => {
  const fries = definition(item(), 'PKR'), drink = definition(item('Drink'), 'PKR');
  const fixed = definition(combo(fries.variants[0].id), 'PKR'), catalogue = [fries, drink, fixed];
  validateReferences(fixed, catalogue);
  assert.equal(resolveSelection({ offeringId: fixed.id }, catalogue).total, '650.00');
  fries.variants[0].price = '999.00'; assert.equal(resolveSelection({ offeringId: fixed.id }, catalogue).total, '650.00');
  const meal = definition(combo(fries.variants[0].id, drink.variants.map(row => row.id)), 'PKR'); catalogue.push(meal);
  const group = meal.choiceGroups[0], select = ids => ({ offeringId: meal.id, choices: [{ groupId: group.id, optionIds: ids }] });
  assert.equal(resolveSelection(select([group.options[1].id]), catalogue).total, '680.00');
  for (const ids of [[], group.options.map(row => row.id), [group.options[0].id, group.options[0].id], [randomUUID()]]) rejects(() => resolveSelection(select(ids), catalogue), 'INVALID_INPUT');
  group.minimum = 2; group.maximum = 2;
  assert.equal(resolveSelection(select(group.options.map(row => row.id)), catalogue).total, '680.00');
  assert.equal(resolveSelection(select(group.options.map(row => row.id)), catalogue).components.length, 3);
});

test('inactive dependencies hide choices or block meals; invalid/nested references reject', () => {
  const fries = definition(item(), 'PKR'), drink = definition(item('Drink'), 'PKR');
  const meal = definition(combo(fries.variants[0].id, drink.variants.map(row => row.id)), 'PKR');
  const catalogue = [fries, drink, meal]; drink.variants[0].active = false;
  assert.equal(activeView(meal, catalogue).choiceGroups[0].options.length, 1);
  drink.variants[1].active = false; assert.equal(activeView(meal, catalogue), undefined);
  rejects(() => validateReferences(meal, catalogue), 'SELECTION_UNAVAILABLE');
  drink.variants[1].active = true; fries.active = false;
  rejects(() => resolveSelection({ offeringId: meal.id }, catalogue), 'SELECTION_UNAVAILABLE');
  rejects(() => validateReferences(definition(combo(randomUUID()), 'PKR'), catalogue), 'NOT_FOUND');
  rejects(() => validateReferences(definition(combo(meal.id), 'PKR'), catalogue), 'NOT_FOUND');
  const bad = combo(fries.variants[0].id); bad.components[0].quantity = 0; rejects(() => definition(bad, 'PKR'), 'INVALID_INPUT');
});

test('application reconfiguration, per-offering edits, business isolation and failure boundary', async () => {
  const f = fixture(), fries = await f.service.save(scope, { definition: item() });
  const drink = await f.service.save(scope, { definition: item('Drink') });
  const meal = await f.service.save(scope, { definition: combo(fries.variants[0].id, drink.variants.map(row => row.id)) });
  const input = edit(meal); input.choiceGroups[0].options[1].surcharge = '45';
  const changed = await f.service.save(scope, { definition: input, expectedRevision: 1 }, meal.id);
  const before = f.reads();
  const result = await f.service.resolve(scope, { offeringId: meal.id, choices: [{ groupId: changed.choiceGroups[0].id, optionIds: [changed.choiceGroups[0].options[1].id] }] });
  assert.equal(result.total, '695.00'); assert.equal(f.reads() - before, 1);
  await assert.rejects(f.service.save(scope, { definition: input, expectedRevision: 1 }, meal.id), error => error.reason === 'STALE_REVISION');
  await f.service.save(scope, { definition: edit(fries), expectedRevision: 1 }, fries.id);
  await f.service.save(scope, { definition: edit(drink), expectedRevision: 1 }, drink.id);
  await assert.rejects(f.service.get({ ...context, businessId: randomUUID() }, fries.id), error => error.reason === 'NOT_FOUND');
  f.store.fail = true; await assert.rejects(f.service.deactivate(scope, fries.id, { expectedRevision: 2 }));
  assert.equal((await f.service.get(context, fries.id, true)).revision, 2);
});

test('deactivation blocks dependent meals and future saves but still permits their deactivation', async () => {
  const f = fixture(), fries = await f.service.save(scope, { definition: item() });
  const meal = await f.service.save(scope, { definition: combo(fries.variants[0].id) });
  await f.service.deactivate(scope, fries.id, { expectedRevision: 1 });
  assert.deepEqual(await f.service.list(context), []);
  assert.equal((await f.service.list(context, true)).length, 2);
  await assert.rejects(f.service.save(scope, { definition: edit(meal), expectedRevision: 1 }, meal.id), error => error.reason === 'SELECTION_UNAVAILABLE');
  assert.equal((await f.service.deactivate(scope, meal.id, { expectedRevision: 1 })).active, false);
});
