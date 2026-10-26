import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderFinancialService } from '../dist/billing-check/modules/orders/public.js';
import { DisplaySettingsService, DisplaySettingsError } from '../dist/billing-check/modules/business/public.js';
import { DisplayReplacementDto } from '../dist/billing-check/modules/business/http/display-input.dto.js';
import { DtoValidationPipe } from '../dist/billing-check/infrastructure/http/dto-validation.pipe.js';
import { BusinessDisplayService } from '../dist/billing-check/modules/business/http/business-display.service.js';
const id = '00000000-0000-0000-0000-000000000001';
const scope = { actorId: id, installation: { businessId: id, branchId: id }, transaction: { id: Symbol('offline') } };
function snapshot() {
  return { id, createdAt: '2026-10-26T00:00:00.000Z', state: 'captured', fulfillment: 'takeaway', amountKind: 'merchandise', currencyCode: 'PKR', scale: 2,
    totalMinor: '300', customer: { name: 'Do not expose' }, instructions: 'Private', policy: { revision: 0 },
    lines: [{ quantity: 3, lineMinor: '300', selection: { private: true }, instructions: 'Private line', unit: { currencyCode: 'PKR', scale: 2, unitMinor: '100', offeringId: id, name: 'Synthetic unit',
      components: [{ itemId: id, itemName: 'Item', variantId: id, variantName: 'Large', quantity: 2 }],
      addOns: [{ id, name: 'Extra', surcharge: '25' }], choices: [{ groupId: id, optionId: id, name: 'Choice', surcharge: '10' }] } }] };
}
test('BP-A06/07/14 financial projection preserves captured money and composition, excludes private and pricing inputs', async () => {
  const saved = snapshot(); let reads = 0;
  const service = new OrderFinancialService({ get: async (business, branch, order, tx) => {
    assert.equal(business, id); assert.equal(branch, id); assert.equal(order, id); assert.equal(tx, scope.transaction); reads++; return saved;
  } });
  const result = await service.get(scope, id);
  assert.equal(reads, 1); assert.equal(result.merchandiseMinor, '300');
  assert.equal(result.lines[0].sellingUnit.components[0].quantity, 2);
  assert.equal(result.lines[0].quantity, 3);
  assert.deepEqual(result.lines[0].sellingUnit.addOns, [{ id, name: 'Extra' }]);
  assert.doesNotMatch(JSON.stringify(result), /Private|Do not expose|surcharge|selection|policy|instructions|customer/);
  assert.deepEqual(saved, snapshot());
  assert.equal(await new OrderFinancialService({ get: async () => undefined }).get(scope, id), undefined);
});
test('BP-A14 financial projection fails closed on corrupt monetary identity and history', async () => {
  const mutations = [s => { s.totalMinor = '301'; }, s => { s.lines[0].lineMinor = '299'; }, s => { s.scale = 0; },
    s => { s.lines[0].unit.currencyCode = 'USD'; }, s => { s.lines[0].quantity = 1001; }, s => { s.lines[0].unit.unitMinor = '01'; },
    s => { s.createdAt = '1'; }, s => { s.createdAt = '2026-10-26T00:00:00Z'; }, s => { s.lines[0].unit.unitMinor = 100; },
    s => { s.amountKind = 'payable'; }, s => { s.fulfillment = 'dine-in'; }];
  for (const mutate of mutations) {
    const saved = snapshot(); mutate(saved);
    await assert.rejects(new OrderFinancialService({ get: async () => saved }).get(scope, id), /financial history unavailable/);
  }
});
function displayFixture() {
  let view = { revision: 0, businessName: 'Synthetic business', branchName: 'Synthetic branch', branchAddress: null, currencyCode: 'PKR', timezone: 'Asia/Karachi' };
  const history = [];
  const service = new DisplaySettingsService({ get: async (installation, tx) => {
    assert.equal(installation.businessId, id); if (tx) assert.equal(tx, scope.transaction); return structuredClone(view);
  }, replace: async (installation, before, after, actor, at, tx) => {
    assert.equal(tx, scope.transaction); assert.equal(actor, id); assert.ok(at instanceof Date); history.push({ before, after, actor }); view = structuredClone(after);
  } });
  return { service, history, view: () => view, set: value => { view = value; } };
}
test('BP-A09/10/12 narrow display replacement retains tuple history and avoids no-op increments', async () => {
  const h = displayFixture();
  const replacement = { expectedRevision: 0, businessName: ' Synthetic business ', branchName: 'Synthetic branch', branchAddress: null };
  assert.equal((await h.service.replace(scope, replacement)).revision, 0); assert.equal(h.history.length, 0);
  const changed = await h.service.replace(scope, { ...replacement, branchAddress: 'Synthetic address' });
  assert.equal(changed.revision, 1); assert.equal(h.history.length, 1); assert.equal(h.history[0].before.branchAddress, null);
  await assert.rejects(h.service.replace(scope, { ...replacement, branchAddress: 'Synthetic address' }), error => error.code === 'STALE_DISPLAY_SETTINGS' && error.revision === 1);
  const cleared = await h.service.replace(scope, { ...replacement, expectedRevision: 1 });
  assert.equal(cleared.branchAddress, null); assert.equal(cleared.revision, 2);
  for (const extra of [{ currencyCode: 'USD' }, { actorId: id }, { branchId: id }, { timezone: 'UTC' }]) {
    await assert.rejects(h.service.replace(scope, { ...replacement, expectedRevision: 2, ...extra }), error => error.code === 'INVALID_DISPLAY_SETTINGS');
  }
  h.set({ ...h.view(), revision: 2147483647 });
  assert.equal((await h.service.replace(scope, { ...replacement, expectedRevision: 2147483647 })).revision, 2147483647);
  await assert.rejects(h.service.replace(scope, { ...replacement, expectedRevision: 2147483647, businessName: 'Changed' }), error => error.code === 'REVISION_CAPACITY');
});
test('BP-A01 display HTTP application wrapper authorizes current scope and administrator update', async () => {
  let policy, supplied;
  const view = displayFixture().view();
  const access = { me: async (_proof, scoped) => { assert.equal(scoped, true); return { ...scope.installation, business: {} }; },
    runAuthorized: async (_proof, selected, work) => { policy = selected; return work(scope); } };
  const service = new BusinessDisplayService(access, { read: async context => { assert.equal(context.branchId, id); return view; },
    replace: async (authorized, body) => { assert.equal(authorized, scope); supplied = body; return view; } });
  assert.equal(await service.read({}), view); assert.equal(await service.update({}, { expectedRevision: 0 }), view);
  assert.equal(policy, 'administrator'); assert.deepEqual(supplied, { expectedRevision: 0 });
  access.runAuthorized = async () => { throw new Error('Denied'); };
  await assert.rejects(service.update({}, {}), /Denied/);
});
test('BP-A11 display DTO rejects omitted/null/type/extra inputs and accepts explicit null address', async () => {
  const pipe = new DtoValidationPipe(), metadata = { type: 'body', metatype: DisplayReplacementDto };
  const valid = { expectedRevision: 0, businessName: 'Business', branchName: 'Branch', branchAddress: null };
  await pipe.transform(valid, metadata);
  for (const body of [{ ...valid, expectedRevision: '0' }, { ...valid, currencyCode: 'PKR' }, { ...valid, branchName: null },
    { expectedRevision: 0, businessName: 'Business', branchName: 'Branch' }]) await assert.rejects(pipe.transform(body, metadata));
  assert.ok(new DisplaySettingsError('INVALID_DISPLAY_SETTINGS'));
});
