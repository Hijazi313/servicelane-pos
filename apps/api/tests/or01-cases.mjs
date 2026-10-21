// Separately authorized manual integration instrumentation. Importing does not access a database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const copy = value => structuredClone(value);
const reason = error => error?.code ?? error?.reason;
const rejects = (work, code) => assert.rejects(work, error => reason(error) === code);
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const editable = offering => Object.fromEntries(Object.entries(copy(offering)).filter(([key]) => !['id', 'revision', 'currencyCode', 'scale'].includes(key)));

export async function runCases(ctx) {
  const { one, orders, otherOrders, store, proof, otherProof, menu, resolver, ledger, tag } = ctx;
  const query = (text, values = []) => one.query(text, values);
  const rowsFor = async key => (await query('select id, request, snapshot from captured_orders where business_id=$1 and branch_id=$2 and retry_key=$3', [ledger.businessId, ledger.branchId, key])).rows;
  const sessionState = async () => (await query('select digest, last_activity_at, revoked_at from access_sessions where account_id=$1 order by digest', [ledger.accountId])).rows;
  const save = async definition => ctx.run(async scope => {
    const offering = await menu.save(scope, { definition });
    ledger.offeringIds ??= []; ledger.offeringIds.push(offering.id); await ctx.saveLedger();
    return offering;
  });
  const update = async (offering, definition) => ctx.run(scope => menu.save(scope, { definition, expectedRevision: offering.revision }, offering.id));
  const test = async (id, work) => {
    try { const details = await work(); await ctx.record(id, { status: 'passed', ...details }); }
    catch (error) { await ctx.record(id, { status: 'failed', code: reason(error) ?? error.name }); throw error; }
  };
  const item = await save({ kind: 'item', name: `${tag}.meal`, active: true, sized: true,
    variants: [{ name: 'Regular', price: '12.00', active: true }, { name: 'Large', price: '15.00', active: true }],
    addOnGroups: [{ name: 'Extras', maximum: 2, options: [{ name: 'Sauce', surcharge: '0.34', active: true }, { name: 'Napkin', surcharge: '0', active: true }] }] });
  const second = await save({ kind: 'item', name: `${tag}.side`, active: true, sized: false,
    variants: [{ name: 'Default', price: '2', active: true }], addOnGroups: [] });
  const combo = await save({ kind: 'combo', name: `${tag}.combo`, active: true, basePrice: '20',
    components: [{ variantId: item.variants[0].id, quantity: 2 }],
    choiceGroups: [{ name: 'Side', minimum: 1, maximum: 1, options: [{ name: 'Side portion', variantId: second.variants[0].id, quantity: 1, surcharge: '1', active: true }] }] });
  const selection = { offeringId: item.id, variantId: item.variants[0].id, addOnIds: item.addOnGroups[0].options.map(row => row.id) };
  const body = { retryKey: randomUUID(), currencyCode: 'PKR', scale: 2,
    lines: [{ selection, quantity: 2, expectedUnitMinor: '1234', instructions: ' No salt ' },
      { selection: { offeringId: combo.id, choices: [{ groupId: combo.choiceGroups[0].id, optionIds: [combo.choiceGroups[0].options[0].id] }] }, quantity: 3, expectedUnitMinor: '2100' }],
    customer: { name: ' Synthetic guest ', phone: '+1 (555) 010-0000' }, instructions: ' Pack separately ' };
  const fresh = changes => ({ ...copy(body), retryKey: randomUUID(), ...changes });
  let snapshot;
  await test('P01', async () => {
    snapshot = await orders.create(proof, body);
    assert.equal(snapshot.totalMinor, '8768'); assert.equal(snapshot.scale, 2); assert.equal(snapshot.currencyCode, 'PKR');
    assert.equal(snapshot.state, 'captured'); assert.equal(snapshot.fulfillment, 'takeaway'); assert.equal(snapshot.amountKind, 'merchandise');
    assert.equal('payableTotal' in snapshot, false); assert.equal('taxTotal' in snapshot, false);
    assert.deepEqual(snapshot.customer, { name: 'Synthetic guest', phone: '+1 (555) 010-0000' });
    assert.equal(snapshot.instructions, 'Pack separately'); assert.equal(snapshot.lines[0].instructions, 'No salt');
    assert.deepEqual(snapshot.lines.map(row => row.lineMinor), ['2468', '6300']);
    assert.deepEqual(snapshot.lines[0].unit.components, [{ itemId: item.id, itemName: item.name, variantId: item.variants[0].id, variantName: 'Regular', quantity: 1 }]);
    assert.equal(snapshot.lines[0].unit.addOns.length, 2); assert.equal(snapshot.lines[1].unit.components.length, 2);
    assert.deepEqual(snapshot.policy, { maxLines: 50, maxQuantity: 100, revision: 0 });
    assert.deepEqual((await rowsFor(body.retryKey))[0].snapshot, snapshot);
    assert.deepEqual(await orders.get(proof, snapshot.id), snapshot);
    const high = await save({ kind: 'item', name: `${tag}.exact-high`, active: true, sized: false,
      variants: [{ name: 'Default', price: '999999999', active: true }],
      addOnGroups: [{ name: 'Extra', maximum: 1, options: [{ name: 'Extra', surcharge: '999999999', active: true }] }] });
    const highBody = fresh({ lines: [{ selection: { offeringId: high.id, addOnIds: [high.addOnGroups[0].options[0].id] }, quantity: 2, expectedUnitMinor: '199999999800' }] });
    const highSaved = await orders.create(proof, highBody); assert.equal(highSaved.totalMinor, '399999999600');
    assert.deepEqual((await rowsFor(highBody.retryKey))[0].snapshot, highSaved);
    return { oracleTotalMinor: '8768', highTotalMinor: '399999999600', committedReadback: true };
  });
  await test('R01', async () => {
    const badRequests = [
      [value => { value.lines[1].selection.offeringId = randomUUID(); }, 'NOT_FOUND'],
      [value => { value.lines[1].expectedUnitMinor = '2099'; }, 'PRICE_CONFIRMATION_REQUIRED'],
      [value => { value.currencyCode = 'USD'; }, 'PRICE_CONFIRMATION_REQUIRED'],
      [value => { value.lines[1].quantity = 101; }, 'ORDER_LIMIT_EXCEEDED'],
      [value => { value.lines = Array.from({ length: 51 }, () => copy(value.lines[0])); }, 'ORDER_LIMIT_EXCEEDED'],
      [value => { value.lines[1].selection.choices[0].optionIds = []; }, 'INVALID_INPUT'],
    ];
    for (const [change, code] of badRequests) {
      const candidate = fresh(), repaired = copy(candidate); change(candidate);
      const before = await sessionState(); await rejects(() => orders.create(proof, candidate), code);
      assert.deepEqual(await rowsFor(candidate.retryKey), []); assert.deepEqual(await sessionState(), before);
      await orders.create(proof, repaired); assert.equal((await rowsFor(candidate.retryKey)).length, 1);
    }
    const inactive = await ctx.run(scope => menu.deactivate(scope, second.id, { expectedRevision: second.revision }));
    const unavailable = fresh(), before = await sessionState();
    await rejects(() => orders.create(proof, unavailable), 'SELECTION_UNAVAILABLE');
    assert.deepEqual(await rowsFor(unavailable.retryKey), []); assert.deepEqual(await sessionState(), before);
    Object.assign(second, await update(inactive, { ...editable(inactive), active: true }));
    await orders.create(proof, unavailable);
    // Real Menu expands compact variant references into repeated long component names.
    const bulky = await save({ kind: 'item', name: (tag + '.').padEnd(120, 'M'), active: true, sized: true,
      variants: Array.from({ length: 32 }, (_, i) => ({ name: `${i}`.padEnd(120, 'V'), price: '1', active: true })), addOnGroups: [] });
    const expanded = await save({ kind: 'combo', name: (tag + '.').padEnd(120, 'C'), active: true, basePrice: '1',
      components: bulky.variants.map(row => ({ variantId: row.id, quantity: 1 })), choiceGroups: [] });
    const capacityPolicy = await orders.policy(proof);
    await orders.updatePolicy(proof, { maxLines: 100, maxQuantity: 100, expectedRevision: capacityPolicy.revision });
    const capacity = fresh({ lines: Array.from({ length: 90 }, () => ({ selection: { offeringId: expanded.id }, quantity: 1, expectedUnitMinor: '100' })) });
    assert.ok(Buffer.byteLength(JSON.stringify(capacity)) < 16_384);
    const capacityBefore = await sessionState(); await rejects(() => orders.create(proof, capacity), 'ORDER_RESPONSE_CAPACITY');
    assert.deepEqual(await rowsFor(capacity.retryKey), []); assert.deepEqual(await sessionState(), capacityBefore);
    capacity.lines = [capacity.lines[0]]; await orders.create(proof, capacity);
    await orders.updatePolicy(proof, { maxLines: 50, maxQuantity: 100, expectedRevision: capacityPolicy.revision + 1 });
    return { rejectedAndReusedKeys: badRequests.length + 2, realExpandedCapacity: true };
  });
  await test('R02', async () => {
    const request = fresh(), originalSave = store.save;
    const policyBefore = await orders.policy(proof), menuBefore = await menu.list(await ctx.business.resolveInstallationContext(), true);
    const before = await sessionState();
    store.save = async function (...args) { await originalSave.apply(this, args); throw new Error('OR01_INSERT_ROLLBACK'); };
    try { await assert.rejects(() => orders.create(proof, request), /OR01_INSERT_ROLLBACK/); }
    finally { store.save = originalSave; }
    assert.deepEqual(await rowsFor(request.retryKey), []); assert.deepEqual(await sessionState(), before);
    assert.deepEqual(await orders.policy(proof), policyBefore); assert.deepEqual(await menu.list(await ctx.business.resolveInstallationContext(), true), menuBefore);
    await orders.create(proof, request); assert.equal((await rowsFor(request.retryKey)).length, 1);
    return { realInsertThenRollback: true, sessionAndConfigurationUnchanged: true };
  });
  await test('I01', async () => {
    ledger.foreignBusinessId = randomUUID(); ledger.foreignBranchId = randomUUID(); ledger.extraBranchId = randomUUID(); ledger.foreignOfferingId = randomUUID(); await ctx.saveLedger();
    await ctx.run(async scope => {
      const db = ctx.transactionDatabase(scope.transaction), sql = ctx.sql;
      const foreignDefinition = { ...copy(second), id: ledger.foreignOfferingId, name: tag + '.foreign-offering', variants: [{ ...second.variants[0], id: randomUUID() }] };
      await db.execute(sql`insert into menu_offerings(id,business_id,revision,definition,currency_code,scale) values(${foreignDefinition.id},${ledger.foreignBusinessId},${foreignDefinition.revision},${JSON.stringify(foreignDefinition)}::jsonb,'PKR',2)`);
      await db.execute(sql`insert into menu_variants(business_id,id,offering_id) values(${ledger.foreignBusinessId},${foreignDefinition.variants[0].id},${foreignDefinition.id})`);
      await db.execute(sql`insert into businesses(id,name,currency_code,timezone) values(${ledger.foreignBusinessId},${tag + '.foreign'},'PKR','Asia/Karachi')`);
      await db.execute(sql`insert into branches(id,business_id,name) values(${ledger.foreignBranchId},${ledger.foreignBusinessId},${tag + '.foreign-branch'}),(${ledger.extraBranchId},${ledger.businessId},${tag + '.extra-branch'})`);
      for (const [businessId, branchId] of [[ledger.foreignBusinessId, ledger.foreignBranchId], [ledger.businessId, ledger.extraBranchId]]) {
        const foreign = { snapshot: { ...copy(snapshot), id: randomUUID() }, request: (await store.replay(ledger.businessId, ledger.branchId, body.retryKey, scope.transaction)).request };
        await store.save(businessId, branchId, body.retryKey, foreign, scope.transaction);
        assert.deepEqual(await store.replay(businessId, branchId, body.retryKey, scope.transaction), foreign);
        assert.equal(await store.replay(businessId, randomUUID(), body.retryKey, scope.transaction), undefined);
      }
      assert.equal(await store.replay(ledger.foreignBusinessId, ledger.foreignBranchId, randomUUID(), scope.transaction), undefined);
    });
    const foreignRows = (await query('select id from captured_orders where business_id=$1 or branch_id=$2', [ledger.foreignBusinessId, ledger.extraBranchId])).rows;
    const absentResponse = await ctx.request('GET', '/' + randomUUID()); assert.equal(absentResponse.statusCode, 404);
    for (const row of foreignRows) {
      assert.equal(await store.get(ledger.businessId, ledger.branchId, row.id), undefined);
      const response = await ctx.request('GET', '/' + row.id); assert.equal(response.statusCode, 404); assert.deepEqual(response.json(), absentResponse.json());
    }
    await assert.rejects(() => ctx.run(async scope => {
      const existing = await store.replay(ledger.businessId, ledger.branchId, body.retryKey, scope.transaction);
      await store.save(ledger.businessId, ledger.branchId, body.retryKey, { ...existing, snapshot: { ...existing.snapshot, id: randomUUID() } }, scope.transaction);
    }), error => error.code === '23505' || error.cause?.code === '23505');
    const foreignOffering = fresh(); foreignOffering.lines[1].selection = { offeringId: ledger.foreignOfferingId };
    await rejects(() => orders.create(proof, foreignOffering), 'NOT_FOUND'); assert.deepEqual(await rowsFor(foreignOffering.retryKey), []);
    assert.deepEqual(await store.policy(ledger.foreignBusinessId), { maxLines: 50, maxQuantity: 100, revision: 0 });
    try {
      await query('delete from staff_branch_grants where account_id=$1 and branch_id=$2', [ledger.accountId, ledger.branchId]);
      await rejects(() => orders.create(proof, body), 'FORBIDDEN');
      const denied = await ctx.request('GET', '/' + snapshot.id); assert.equal(denied.statusCode, 403);
    } finally {
      await query('insert into staff_branch_grants(business_id,account_id,branch_id) values($1,$2,$3) on conflict do nothing', [ledger.businessId, ledger.accountId, ledger.branchId]);
    }
    try {
      await query('update access_sessions set revoked_at=now() where account_id=$1', [ledger.accountId]);
      await rejects(() => orders.create(proof, body), 'UNAUTHENTICATED');
      assert.equal((await ctx.request('GET', '/' + snapshot.id)).statusCode, 401);
    } finally { await query('update access_sessions set revoked_at=null where account_id=$1', [ledger.accountId]); }
    return { foreignRows: foreignRows.length, apiIndistinguishable404: true, uniqueSqlstate: '23505', currentAuthorityChecked: true };
  });
  async function overlap(request, contenderRequest, conflict) {
    const saved = deferred(), release = deferred(), originalSave = store.save; let holder, contender, observation;
    store.save = async function (...args) {
      await originalSave.apply(this, args); saved.resolve(args[4]); await release.promise;
    };
    try {
      holder = orders.create(proof, request).then(value => ({ value }), error => ({ error }));
      const transaction = await Promise.race([saved.promise, holder.then(result => { throw result.error ?? new Error('Holder completed without barrier'); })]);
      contender = otherOrders.create(otherProof, contenderRequest).then(value => ({ value }), error => ({ error }));
      observation = await ctx.waitForContention(transaction);
      release.resolve(); const [left, right] = await Promise.all([holder, contender]);
      if (left.error) throw left.error;
      if (conflict) assert.equal(reason(right.error), 'RETRY_CONTENT_CONFLICT');
      else { if (right.error) throw right.error; assert.deepEqual(right.value, left.value); }
      assert.equal((await rowsFor(request.retryKey)).length, 1); assert.deepEqual((await rowsFor(request.retryKey))[0].snapshot, left.value);
      return { winner: left.value, observation };
    } finally { release.resolve(); store.save = originalSave; await Promise.allSettled([holder, contender].filter(Boolean)); }
  }
  await test('C01', async () => {
    const request = fresh(); const result = await overlap(request, copy(request), false);
    // Model a lost successful response; D01 separately establishes fresh connections.
    assert.deepEqual(await otherOrders.create(otherProof, request), result.winner);
    return { observation: result.observation, oneCommittedRow: true, lostAcknowledgementReplay: true };
  });
  await test('C02', async () => {
    const request = fresh(), changed = copy(request); changed.lines[0].quantity++;
    const result = await overlap(request, changed, true);
    const changes = [value => { value.lines[0].expectedUnitMinor = '1235'; }, value => { value.customer.name = 'Different synthetic guest'; },
      value => { value.instructions = 'Different'; }, value => { value.lines[0].selection.variantId = item.variants[1].id; }, value => { value.lines.reverse(); }];
    for (const change of changes) { const conflicting = copy(request); change(conflicting); await rejects(() => orders.create(proof, conflicting), 'RETRY_CONTENT_CONFLICT'); }
    const equivalent = copy(request); equivalent.lines[0].selection.offeringId = item.id.toUpperCase(); equivalent.lines[0].selection.addOnIds.reverse();
    equivalent.lines[1].instructions = ' '; equivalent.customer = Object.fromEntries(Object.entries(equivalent.customer).reverse());
    assert.deepEqual(await orders.create(proof, equivalent), result.winner); assert.deepEqual((await rowsFor(request.retryKey))[0].snapshot, result.winner);
    return { observation: result.observation, sequentialConflictingFields: changes.length, canonicalReplay: true };
  });
  let policy;
  await test('H01', async () => {
    const changed = { ...editable(item), name: `${tag}.renamed`, active: true };
    changed.variants[0].price = '99'; const repriced = await update(item, changed);
    await ctx.run(scope => menu.deactivate(scope, item.id, { expectedRevision: repriced.revision }));
    const priorPolicy = await orders.policy(proof);
    policy = await orders.updatePolicy(proof, { maxLines: 1, maxQuantity: 1, expectedRevision: priorPolicy.revision });
    const originalResolve = resolver.resolve; let calls = 0;
    resolver.resolve = async function (...args) { calls++; return originalResolve.apply(this, args); };
    try { assert.deepEqual(await orders.create(proof, body), snapshot); assert.deepEqual(await orders.get(proof, snapshot.id), snapshot); assert.equal(calls, 0); }
    finally { resolver.resolve = originalResolve; }
    await rejects(() => orders.create(proof, fresh()), 'ORDER_LIMIT_EXCEEDED');
    await rejects(() => orders.create(proof, { ...copy(body), instructions: 'changed' }), 'RETRY_CONTENT_CONFLICT');
    await rejects(() => orders.updatePolicy(proof, { maxLines: 2, maxQuantity: 2, expectedRevision: 0 }), 'STALE_ORDER_POLICY');
    try {
      await query("update staff_accounts set role='staff' where id=$1", [ledger.accountId]);
      await rejects(() => orders.updatePolicy(proof, { maxLines: 2, maxQuantity: 2, expectedRevision: policy.revision }), 'FORBIDDEN');
    } finally { await query("update staff_accounts set role='administrator' where id=$1", [ledger.accountId]); }
    assert.deepEqual(await orders.policy(proof), policy);
    await update({ ...repriced, active: false, revision: repriced.revision + 1 }, changed);
    const current = fresh({ lines: [{ selection: copy(selection), quantity: 1, expectedUnitMinor: '9934' }] });
    const currentSaved = await orders.create(proof, current); assert.equal(currentSaved.totalMinor, '9934');
    assert.deepEqual((await rowsFor(body.retryKey))[0].snapshot, snapshot); assert.deepEqual(await store.policy(ledger.foreignBusinessId), { maxLines: 50, maxQuantity: 100, revision: 0 });
    return { historicalReplayWithoutResolution: true, policyRevision: policy.revision, currentCaptureMinor: '9934', historicalUnchanged: true };
  });
  return { body, snapshot, policy };
}
