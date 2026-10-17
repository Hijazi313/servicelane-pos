// Database-free BA-03 resolver fault checks; no connection or environment loading.
import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BusinessService } from '../dist/ba02-check/modules/business/public.js';

const row = {
  businessId: 'business-a', branchId: 'branch-a', businessName: 'Synthetic A',
  currencyCode: 'PKR', timezone: 'Asia/Karachi', branchName: 'Initial A', address: null,
};
function resolver(rows) {
  let calls = 0;
  const query = {
    from() { return this; }, innerJoin() { return this; },
    async where() { calls++; return rows(); },
  };
  return { service: new BusinessService({ db: { select: () => query } }), calls: () => calls };
}

test('BA03-V04 resolver refuses absent or ambiguous joined binding without selecting first row', async () => {
  for (const rows of [[], [row, { ...row, businessId: 'business-b', branchId: 'branch-b' }]]) {
    const h = resolver(() => rows);
    await assert.rejects(h.service.resolveInstallationContext());
    assert.equal(h.calls(), 1);
  }
});

test('BA03-V04 valid context is not reused after missing binding, invalid configuration or persistence failure', async () => {
  let state = [row];
  const h = resolver(() => {
    if (state instanceof Error) throw state;
    return state;
  });
  assert.equal((await h.service.resolveInstallationContext()).businessId, row.businessId);
  state = [];
  await assert.rejects(h.service.resolveInstallationContext());
  state = [{ ...row, timezone: 'invalid/timezone' }];
  await assert.rejects(h.service.resolveInstallationContext());
  state = new Error('synthetic persistence fault');
  await assert.rejects(h.service.resolveInstallationContext());
  state = [row];
  assert.equal((await h.service.resolveInstallationContext()).branchId, row.branchId);
  assert.equal(h.calls(), 5);
});
