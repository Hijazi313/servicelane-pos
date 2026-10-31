// Offline preparation only. setup is invoked solely by a separately authorized runner.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';

export function syntheticFixtures() {
  const ids = count => Array.from({ length: count }, () => randomUUID());
  return { runId: randomUUID(), businesses: ids(2), branches: ids(3), actors: ids(3), orders: ids(8),
    orderRetryKeys: ids(8), operationKeys: ids(48), chargeId: randomUUID(), taxId: randomUUID() };
}

export function snapshot(id, offeringId) {
  const selection = { offeringId, addOnIds: [], choices: [] };
  const unit = { offeringId, name: 'Synthetic item', revision: 1, currencyCode: 'PKR', scale: 2, unitMinor: '10000',
    components: [{ itemId: randomUUID(), itemName: 'Synthetic item', variantId: randomUUID(), variantName: 'Synthetic size', quantity: 1 }], addOns: [], choices: [] };
  return { id, createdAt: '2026-10-29T00:00:00.000Z', state: 'captured', fulfillment: 'takeaway', amountKind: 'merchandise', currencyCode: 'PKR', scale: 2,
    totalMinor: '10000', policy: { revision: 0, maxLines: 100, maxQuantity: 1000 }, lines: [{ selection, quantity: 1, unit, lineMinor: '10000' }] };
}

export function billingPolicy(fixture, expectedRevision = 0) {
  return { expectedRevision, status: 'configured', currencyCode: 'PKR', scale: 2, rounding: 'halfUp',
    charges: [], taxes: [], configurationNote: `Synthetic CS02 ${fixture.runId}` };
}

export async function setup(runtime, ledger, saveLedger, tables) {
  const { expectedBaseline } = await import('./cs02-plan.mjs');
  const expected = await expectedBaseline('post-0007');
  assert.deepEqual([...tables].sort(), expected.tables, 'Full post-migration table manifest required');
  assert.match(ledger.tag, /^cs02\.[0-9a-f-]{36}$/);
  assert.equal(ledger.tag, `cs02.${ledger.fixture.runId}`);
  const { sql } = await import('drizzle-orm');
  const { transactionDatabase } = await import('../dist/cs02-check/infrastructure/database/transaction.js');
  const { token, digest } = await import('../dist/cs02-check/modules/authentication/application/access-policy.js');
  const { hashInitialPassword } = await import('../dist/cs02-check/modules/authentication/infrastructure/password-hash.js');
  const proofs = ledger.fixture.actors.map(() => ({ session: token(), csrf: token() }));
  const passwordHash = await hashInitialPassword(randomBytes(24).toString('base64url'));
  ledger.sessionDigests = proofs.map(proof => digest(proof.session));
  ledger.snapshots = ledger.fixture.orders.map(id => snapshot(id, ledger.fixture.runId));
  ledger.setupAttempted = true; await saveLedger();
  await runtime.accessStore.run(async unit => {
    const tx = transactionDatabase(unit.context), f = ledger.fixture;
    for (const table of expected.tables) {
      assert.match(table, /^[a-z_]+$/);
      assert.equal(Number((await tx.execute(sql.raw(`select count(*) as n from public."${table}"`))).rows[0].n), 0);
    }
    for (const [i, id] of f.businesses.entries()) await tx.execute(sql`insert into businesses(id,name,currency_code,timezone) values(${id}::uuid,${ledger.tag + '.' + i},'PKR','Asia/Karachi')`);
    for (const [i, id] of f.branches.entries()) await tx.execute(sql`insert into branches(id,business_id,name) values(${id}::uuid,${f.businesses[i === 2 ? 1 : 0]}::uuid,${ledger.tag + '.branch.' + i})`);
    await tx.execute(sql`insert into installation_binding(singleton,business_id,branch_id) values(1,${f.businesses[0]}::uuid,${f.branches[0]}::uuid)`);
    for (const [i, id] of f.actors.entries()) {
      await unit.saveAccount({ id, businessId: f.businesses[0], username: ledger.tag + '-' + i, displayName: ledger.tag + '-' + i,
        role: i === 0 ? 'administrator' : 'staff', status: 'active', passwordChangeRequired: false, passwordHash, branchIds: [f.branches[0]] });
      const now = new Date();
      await unit.saveSession({ digest: ledger.sessionDigests[i], businessId: f.businesses[0], accountId: id, csrfToken: proofs[i].csrf, createdAt: now, lastActivityAt: now, revokedAt: null });
    }
    for (const [i, id] of f.orders.entries()) {
      const branch = i === 6 ? 1 : i === 7 ? 2 : 0, business = i === 7 ? 1 : 0;
      const saved = ledger.snapshots[i], request = { currencyCode: 'PKR', scale: 2, lines: [{ selection: saved.lines[0].selection, quantity: 1, expectedUnitMinor: '10000' }] };
      await tx.execute(sql`insert into captured_orders(id,business_id,branch_id,retry_key,request,snapshot) values(${id}::uuid,${f.businesses[business]}::uuid,${f.branches[branch]}::uuid,${f.orderRetryKeys[i]},${JSON.stringify(request)}::jsonb,${JSON.stringify(saved)}::jsonb)`);
    }
  });
  ledger.setupCommitted = true; await saveLedger();
  return proofs;
}
