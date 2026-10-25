// Manual acceptance case orchestration; importing never accesses configuration/DB.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
export async function overlap({ store, method, first, second, observe }) {
  const written = deferred(), release = deferred(), original = store[method];
  let context, firstPromise, secondPromise;
  store[method] = async (...args) => { const result = await original.apply(store, args); context = args.at(-1); written.resolve(); await release.promise; return result; };
  try {
    firstPromise = first(); firstPromise.catch(() => {});
    await Promise.race([written.promise, firstPromise.then(() => { throw new Error('Missing write barrier'); })]);
    secondPromise = second(); secondPromise.catch(() => {});
    const observation = await observe(context);
    release.resolve();
    return { results: await Promise.all([firstPromise, secondPromise]), ...observation };
  } finally {
    release.resolve(); store[method] = original;
    await Promise.allSettled([firstPromise, secondPromise].filter(Boolean));
  }
}
export async function runCases(ctx) {
  const { runtime: r, other, proof, otherProof, ledger, tag, one, sql, transactionDatabase } = ctx;
  const scope = { businessId: ledger.businessId, branchId: ledger.branchId };
  const rowsFor = async id => (await one.query('select * from kitchen_tickets where business_id=$1 and branch_id=$2 and order_id=$3', [scope.businessId, scope.branchId, id])).rows;
  const run = work => r.access.runAuthorized(proof, 'administrator', work);
  const save = definition => run(async authorized => {
    const offering = await r.menu.save(authorized, { definition });
    ledger.offeringIds.push(offering.id); await ctx.saveLedger(); return offering;
  });
  const meal = await save({ kind: 'item', name: tag + '.meal', active: true, sized: true,
    variants: [{ name: 'Regular', price: '12', active: true }], addOnGroups: [{ name: 'Extra', maximum: 1, options: [{ name: 'Sauce', surcharge: '0.34', active: true }] }] });
  const side = await save({ kind: 'item', name: tag + '.side', active: true, sized: false, variants: [{ name: 'Default', price: '2', active: true }], addOnGroups: [] });
  const combo = await save({ kind: 'combo', name: tag + '.combo', active: true, basePrice: '20', components: [{ variantId: meal.variants[0].id, quantity: 2 }],
    choiceGroups: [{ name: 'Side', minimum: 1, maximum: 1, options: [{ name: 'Side portion', variantId: side.variants[0].id, quantity: 1, surcharge: '1', active: true }] }] });
  const body = () => ({ retryKey: randomUUID(), currencyCode: 'PKR', scale: 2,
    lines: [{ selection: { offeringId: meal.id, variantId: meal.variants[0].id, addOnIds: [meal.addOnGroups[0].options[0].id] }, quantity: 2, expectedUnitMinor: '1234', instructions: ' No salt ' },
      { selection: { offeringId: combo.id, choices: [{ groupId: combo.choiceGroups[0].id, optionIds: [combo.choiceGroups[0].options[0].id] }] }, quantity: 3, expectedUnitMinor: '2100' }],
    customer: { name: 'SyntheticPrivateGuest' }, instructions: ' Pack separately ' });
  const capture = async () => { const order = await r.orders.create(proof, body()); ledger.orderIds.push(order.id); await ctx.saveLedger(); return order; };
  const test = async (id, work) => { try { const details = await work(); ctx.record(id, { status: 'passed', ...details }); } catch (error) { ctx.record(id, { status: 'failed' }); throw error; } };
  const order = await capture(); let ticket;
  await test('K01', async () => {
    const result = await overlap({ store: r.kitchenStore, method: 'insert', first: () => r.kitchen.dispatch(proof, { orderId: order.id }),
      second: () => other.kitchen.dispatch(otherProof, { orderId: order.id }), observe: ctx.observe });
    const [a, b] = result.results; assert.deepEqual(a, b); ticket = a;
    assert.equal((await rowsFor(order.id)).length, 1);
    assert.deepEqual(await other.kitchen.dispatch(otherProof, { orderId: order.id }), ticket); // discard/retry acknowledgement model
    assert.equal(ticket.preparation.lines[1].quantity * ticket.preparation.lines[1].components[0].quantity, 6);
    assert.equal(ticket.preparation.lines[0].name, tag + '.meal');
    assert.equal(ticket.preparation.lines[0].components[0].variantName, 'Regular');
    assert.deepEqual(ticket.preparation.lines[0].addOns, [{ id: meal.addOnGroups[0].options[0].id, name: 'Sauce' }]);
    assert.deepEqual(ticket.preparation.lines[1].components.map(row => row.quantity), [2, 1]);
    assert.equal(ticket.preparation.lines[1].choices[0].name, 'Side portion');
    assert.equal(ticket.preparation.instructions, 'Pack separately'); assert.equal(ticket.preparation.lines[0].instructions, 'No salt');
    assert.doesNotMatch(JSON.stringify(ticket.preparation), /SyntheticPrivateGuest|surcharge|unitMinor|totalMinor|currencyCode|policy|retryKey/);
    const stored = (await rowsFor(order.id))[0]; assert.deepEqual(stored.preparation, ticket.preparation); assert.equal(stored.dispatched_by, ledger.accountIds[0]);
    const duplicate = await run(authorized => r.kitchenStore.insert(scope, { ...ticket, id: randomUUID(), dispatchedBy: authorized.actorId }, authorized.transaction));
    assert.equal(duplicate.id, ticket.id); assert.equal((await rowsFor(order.id)).length, 1);
    assert.deepEqual(await r.orders.get(proof, order.id), order);
    return { observedAdvisoryWait: result.observedAdvisoryWait, committedTickets: 1, sameScopeDuplicateReturnsOriginal: true };
  });
  await test('K02', async () => {
    const rollbackOrder = await capture(), original = r.kitchenStore.insert;
    const sessions = async () => (await one.query('select digest,last_activity_at from access_sessions where business_id=$1 order by digest', [scope.businessId])).rows;
    const before = await sessions();
    r.kitchenStore.insert = async (...args) => { await original.apply(r.kitchenStore, args); throw new Error('Synthetic rollback after insert'); };
    try { await assert.rejects(r.kitchen.dispatch(proof, { orderId: rollbackOrder.id }), error => error.code === 'KITCHEN_UNAVAILABLE'); }
    finally { r.kitchenStore.insert = original; }
    assert.equal((await rowsFor(rollbackOrder.id)).length, 0); assert.deepEqual(await sessions(), before);
    assert.deepEqual(await r.orders.get(proof, rollbackOrder.id), rollbackOrder);
    const retry = await r.kitchen.dispatch(proof, { orderId: rollbackOrder.id }); assert.equal(retry.revision, 0); assert.equal((await rowsFor(rollbackOrder.id)).length, 1);
    return { noPartialTicket: true, sessionActivityRolledBack: true, retryCommittedOnce: true };
  });
  await test('K03', async () => {
    const result = await overlap({ store: r.kitchenStore, method: 'advance', first: () => r.kitchen.advance(proof, ticket.id, { state: 'preparing', expectedRevision: 0 }),
      second: () => other.kitchen.advance(otherProof, ticket.id, { state: 'preparing', expectedRevision: 0 }), observe: ctx.observe });
    assert.deepEqual(result.results[0], result.results[1]);
    const ready = await other.kitchen.advance(otherProof, ticket.id, { state: 'ready', expectedRevision: 1 }); assert.equal(ready.revision, 2);
    assert.deepEqual(await r.kitchen.advance(proof, ticket.id, { state: 'ready', expectedRevision: 1 }), ready);
    await assert.rejects(r.kitchen.advance(proof, ticket.id, { state: 'preparing', expectedRevision: 0 }), error => error.code === 'STALE_TICKET');
    const stored = (await rowsFor(order.id))[0]; assert.equal(stored.dispatched_by, ledger.accountIds[0]); assert.equal(stored.preparing_by, ledger.accountIds[0]); assert.equal(stored.ready_by, ledger.accountIds[1]);
    assert.ok(stored.preparing_at); assert.ok(stored.ready_at); assert.equal(stored.revision, 2);
    return { observedAdvisoryWait: result.observedAdvisoryWait, preservedStageActors: true, staleRevisionRejected: true };
  });
  let expected;
  await test('K04', async () => {
    for (let i = 0; i < 2; i++) { const next = await capture(); await r.kitchen.dispatch(proof, { orderId: next.id }); }
    const first = await r.kitchen.list(proof, { limit: '2' }); assert.equal(first.tickets.length, 2); assert.ok(first.nextCursor);
    const late = await capture(); await other.kitchen.dispatch(otherProof, { orderId: late.id });
    const second = await r.kitchen.list(proof, { limit: '2', cursor: first.nextCursor }); assert.equal(second.nextCursor, undefined);
    assert.equal(new Set([...first.tickets, ...second.tickets].map(row => row.id)).size, 4);
    assert.ok(!second.tickets.some(row => row.orderId === late.id));
    // Real foreign-branch rows: test-only fixture writes, never a production bypass.
    const foreignOrderId = randomUUID(), foreignTicketId = randomUUID(); ledger.foreignOrderId = foreignOrderId; ledger.foreignTicketId = foreignTicketId; await ctx.saveLedger();
    await run(async authorized => {
      const tx = transactionDatabase(authorized.transaction);
      const source = (await tx.execute(sql`select request,snapshot from captured_orders where id=${order.id}::uuid and business_id=${scope.businessId}::uuid`)).rows[0];
      await tx.execute(sql`insert into captured_orders(id,business_id,branch_id,retry_key,request,snapshot) values(${foreignOrderId}::uuid,${scope.businessId}::uuid,${ledger.extraBranchId}::uuid,${randomUUID()},${JSON.stringify(source.request)}::jsonb,${JSON.stringify({ ...source.snapshot, id: foreignOrderId })}::jsonb)`);
      await r.kitchenStore.insert({ businessId: scope.businessId, branchId: ledger.extraBranchId }, { ...ticket, id: foreignTicketId, orderId: foreignOrderId, preparation: { ...ticket.preparation, orderId: foreignOrderId }, dispatchedBy: authorized.actorId }, authorized.transaction);
    });
    await assert.rejects(r.kitchen.get(proof, foreignTicketId), error => error.code === 'TICKET_NOT_FOUND');
    assert.equal(await r.kitchenStore.get({ businessId: randomUUID(), branchId: scope.branchId }, ticket.id), undefined);
    assert.equal((await r.kitchen.list(proof, {})).tickets.length, 5);
    const ownRows = (await one.query('select id from kitchen_tickets where business_id=$1 and branch_id=$2 order by position', [scope.businessId, scope.branchId])).rows;
    expected = await Promise.all(ownRows.map(row => r.kitchen.get(proof, row.id)));
    assert.equal(expected.length, 5);
    return { preFenceCount: 4, nextScanCount: 5, foreignTicketHidden: true, freshProcess: 'pending' };
  });
  return { expected, orderId: order.id, foreignTicketId: ledger.foreignTicketId };
}
