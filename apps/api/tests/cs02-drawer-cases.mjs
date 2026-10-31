// CS02 case orchestration only. Safe to import without configuration or a database.
import assert from 'node:assert/strict';

const errorCode = expected => error => (error?.code ?? error?.reason) === expected;

/** C01/C04/C05; writes are individually wrapped in the runner's attempt/checkpoint.
 * Account disable/restore in C05 is a test-only Access-unit fixture mutation, not
 * evidence that the public staff-update endpoint or session revocation works. */
export async function runDrawerCases({ runtime, other, fixture, proofs, run, attempt, contend, seedForeign }) {
  const [admin, staff, replacement] = proofs;
  const keys = fixture.operationKeys;
  assert.equal(proofs.length, 3); assert.ok(keys.length >= 20);
  assert.equal(new Set(keys.slice(0, 20)).size, 20);
  const service = runtime.drawers;
  let drawerA, drawerB, sessionA, sessionB;
  const write = work => attempt(work);

  await run('C01', async () => {
    const policy = await write(() => service.replacePolicy(admin, { selfClose: true, replacementClose: false,
      replacementStaffIds: [], expectedRevision: 0, note: 'Synthetic CS02 policy' }));
    assert.equal(policy.configured, true); assert.equal(policy.revision, 1);
    drawerA = await write(() => service.createDrawer(admin, { label: 'Synthetic drawer A', retryKey: keys[0] }));
    drawerB = await write(() => service.createDrawer(admin, { label: 'Synthetic drawer B', retryKey: keys[1] }));
    assert.notEqual(drawerA.id, drawerB.id);
    assert.deepEqual(await write(() => service.createDrawer(admin, { label: 'Synthetic drawer A', retryKey: keys[0] })), drawerA);
    await assert.rejects(service.createDrawer(admin, { label: 'Synthetic altered', retryKey: keys[0] }), errorCode('RETRY_CONFLICT'));
    const firstOpen = { openingMinor: '1000', retryKey: keys[2] }, secondOpen = { openingMinor: '2500', retryKey: keys[3] };
    // The first open holds the real Access lock at insertSession while the
    // second connection attempts the same drawer with a different cashier/key.
    const outcomes = await write(() => contend(runtime.drawerStore, 'insertSession',
      () => service.open(admin, drawerA.id, firstOpen),
      () => other.drawers.open(replacement, drawerA.id, { openingMinor: '0', retryKey: keys[4] })));
    assert.ok(outcomes[0] && 'value' in outcomes[0] && !outcomes[0].error);
    assert.ok(outcomes[1]?.error && errorCode('DRAWER_BUSY')(outcomes[1].error));
    sessionA = outcomes[0].value;
    sessionB = await write(() => service.open(staff, drawerB.id, secondOpen));
    assert.notEqual(sessionA.id, sessionB.id);
    assert.equal(sessionA.currentCustodianId, fixture.actors[0]); assert.equal(sessionB.currentCustodianId, fixture.actors[1]);
    assert.deepEqual(await write(() => service.open(admin, drawerA.id, firstOpen)), sessionA);
    await assert.rejects(service.open(admin, drawerA.id, { ...firstOpen, openingMinor: '1001' }), errorCode('RETRY_CONFLICT'));
    await assert.rejects(service.open(replacement, drawerA.id, { openingMinor: '0', retryKey: keys[4] }), errorCode('DRAWER_BUSY'));
    await assert.rejects(service.open(admin, drawerB.id, { openingMinor: '0', retryKey: keys[5] }), errorCode('DRAWER_BUSY'));
    assert.equal((await service.current(admin)).id, sessionA.id);
    assert.equal((await service.current(staff)).id, sessionB.id);
  });

  await run('C04', async () => {
    const incoming = { direction: 'in', amountMinor: '300', reason: 'Synthetic float', expectedRevision: 0, retryKey: keys[6] };
    const outgoing = { direction: 'out', amountMinor: '100', reason: 'Synthetic safe drop', expectedRevision: 1, retryKey: keys[7] };
    const added = await write(() => service.move(staff, sessionB.id, incoming));
    assert.equal(added.amountMinor, '300'); assert.deepEqual(await write(() => service.move(staff, sessionB.id, incoming)), added);
    await write(() => service.move(staff, sessionB.id, outgoing));
    await assert.rejects(service.move(staff, sessionB.id, { ...outgoing, amountMinor: '101' }), errorCode('RETRY_CONFLICT'));
    const close = { countedMinor: '2600', varianceReason: 'Synthetic shortage', expectedRevision: 2, retryKey: keys[8] };
    const closed = await write(() => service.close(staff, sessionB.id, close));
    assert.equal(closed.closed.expectedMinor, '2700'); assert.equal(closed.closed.countedMinor, '2600');
    assert.equal(closed.closed.varianceMinor, '-100'); assert.equal(closed.closed.varianceReason, 'Synthetic shortage');
    assert.deepEqual(await write(() => service.close(staff, sessionB.id, close)), closed);
    await assert.rejects(service.move(staff, sessionB.id, { direction: 'in', amountMinor: '1', reason: 'Synthetic', expectedRevision: 3, retryKey: keys[9] }), errorCode('DRAWER_CLOSED'));
    sessionB = await write(() => service.open(staff, drawerB.id, { openingMinor: '2500', retryKey: keys[10] }));
  });

  await run('C05', async () => {
    // The runner must create and independently certify these exact synthetic
    // foreign-branch IDs before the case tests access from the bound branch.
    const foreign = { businessId: fixture.businesses[0], branchId: fixture.branches[1],
      drawerId: keys[40], sessionId: keys[41], custodianId: fixture.actors[0] };
    await write(() => seedForeign(foreign));
    await assert.rejects(service.get(admin, foreign.sessionId), errorCode('DRAWER_NOT_FOUND'));
    await assert.rejects(service.get(replacement, sessionA.id), errorCode('DRAWER_NOT_FOUND'));
    await assert.rejects(service.get(admin, fixture.branches[2]), errorCode('DRAWER_NOT_FOUND'));
    await assert.rejects(service.close(replacement, sessionB.id, { countedMinor: '2500', varianceReason: null,
      expectedRevision: 0, retryKey: keys[11] }), errorCode('FORBIDDEN'));
    await write(() => service.replacePolicy(admin, { selfClose: true, replacementClose: true,
      replacementStaffIds: [fixture.actors[2]], expectedRevision: 1, note: 'Synthetic replacement authority' }));
    const pending = await write(() => service.beginHandover(admin, sessionA.id, { recipientStaffId: fixture.actors[2],
      expectedRevision: 0, retryKey: keys[12] }));
    assert.equal(pending.pendingHandover.recipientStaffId, fixture.actors[2]);
    const setStatus = status => runtime.accessStore.run(async unit => {
      const account = await unit.findAccount(fixture.businesses[0], { id: fixture.actors[2] });
      assert.ok(account); assert.equal(account.id, fixture.actors[2]);
      await unit.saveAccount({ ...account, status });
    });
    await write(() => setStatus('disabled'));
    await assert.rejects(service.acceptHandover(replacement, sessionA.id, pending.pendingHandover.id,
      { countedMinor: '1000', varianceReason: null, expectedRevision: 1, retryKey: keys[13] }), errorCode('UNAUTHENTICATED'));
    await assert.rejects(service.close(replacement, sessionB.id, { countedMinor: '2500', varianceReason: null,
      expectedRevision: 0, retryKey: keys[14] }), errorCode('UNAUTHENTICATED'));
    await write(() => setStatus('active'));
    sessionA = await write(() => service.cancelHandover(admin, sessionA.id, pending.pendingHandover.id, { expectedRevision: 1, retryKey: keys[15] }));
    const replacementClose = await write(() => service.close(replacement, sessionB.id, { countedMinor: '2500', varianceReason: null,
      expectedRevision: 0, retryKey: keys[16] }));
    assert.equal(replacementClose.closed.closedBy, fixture.actors[2]); assert.equal(replacementClose.closed.varianceMinor, '0');
    await write(() => service.replacePolicy(admin, { selfClose: true, replacementClose: false,
      replacementStaffIds: [], expectedRevision: 2, note: 'Restore synthetic policy' }));
    sessionB = await write(() => service.open(staff, drawerB.id, { openingMinor: '2500', retryKey: keys[17] }));
    assert.equal(sessionA.status, 'open'); assert.equal(sessionB.status, 'open');
    // Billing cases open new drawers and use staff as handover recipient; release both custodians.
    sessionA = await write(() => service.close(admin, sessionA.id, { countedMinor: '1000', varianceReason: null,
      expectedRevision: sessionA.revision, retryKey: keys[18] }));
    sessionB = await write(() => service.close(staff, sessionB.id, { countedMinor: '2500', varianceReason: null,
      expectedRevision: sessionB.revision, retryKey: keys[19] }));
  });
  return { drawerA, drawerB, sessionA, sessionB };
}
