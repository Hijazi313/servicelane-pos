// Run-owned fixture cleanup only; never imported/run by production or automatic suites.
import assert from 'node:assert/strict';
export async function cleanup(database, ledger, tag) {
  const { sql } = await import('drizzle-orm');
  const { inTransaction, transactionDatabase } = await import('../dist/orders-check/infrastructure/database/transaction.js');
  await inTransaction(database, async context => {
    const tx = transactionDatabase(context); await tx.execute(sql`select pg_advisory_xact_lock(20261012,2)`);
    if (!ledger.businessId) { assert.equal(ledger.setupCommitted, false); return; }
    const businesses = (await tx.execute(sql`select name from businesses where id=${ledger.businessId}::uuid`)).rows;
    if (!businesses.length) { assert.equal(ledger.setupCommitted, false); return; }
    assert.deepEqual(businesses, [{ name: tag }]);
    const branches = (await tx.execute(sql`select id,name from branches where business_id=${ledger.businessId}::uuid order by id`)).rows;
    assert.deepEqual(branches, [{ id: ledger.branchId, name: tag }, { id: ledger.extraBranchId, name: tag + '.extra' }].sort((a, b) => a.id.localeCompare(b.id)));
    const accounts = (await tx.execute(sql`select id,display_name from staff_accounts where business_id=${ledger.businessId}::uuid order by id`)).rows;
    assert.deepEqual(accounts, ledger.accountIds.map((id, index) => ({ id, display_name: tag + '-' + index })).sort((a, b) => a.id.localeCompare(b.id)));
    const sessions = (await tx.execute(sql`select digest from access_sessions where business_id=${ledger.businessId}::uuid order by digest`)).rows.map(row => row.digest);
    assert.deepEqual(sessions, ledger.sessionDigests.toSorted());
    const offerings = (await tx.execute(sql`select id,definition->>'name' as name from menu_offerings where business_id=${ledger.businessId}::uuid`)).rows;
    assert.ok(offerings.every(row => ledger.offeringIds.includes(row.id) && row.name.startsWith(tag + '.')));
    const binding = (await tx.execute(sql`select business_id,branch_id from installation_binding where singleton=1`)).rows;
    assert.deepEqual(binding, [{ business_id: ledger.businessId, branch_id: ledger.branchId }]);
    const allowedOrders = [...ledger.orderIds, ...(ledger.foreignOrderId ? [ledger.foreignOrderId] : [])];
    const orders = (await tx.execute(sql`select id,branch_id from captured_orders where business_id=${ledger.businessId}::uuid`)).rows;
    assert.ok(orders.every(row => allowedOrders.includes(row.id) && [ledger.branchId, ledger.extraBranchId].includes(row.branch_id)));
    const tickets = (await tx.execute(sql`select order_id,branch_id,dispatched_by,preparing_by,ready_by from kitchen_tickets where business_id=${ledger.businessId}::uuid`)).rows;
    assert.ok(tickets.every(row => allowedOrders.includes(row.order_id) && [ledger.branchId, ledger.extraBranchId].includes(row.branch_id)
      && [row.dispatched_by, row.preparing_by, row.ready_by].filter(Boolean).every(id => ledger.accountIds.includes(id))));
    assert.equal(Number((await tx.execute(sql`select count(*) as n from order_capture_policies where business_id=${ledger.businessId}::uuid`)).rows[0].n), 0);
    // Never delete global Access rows; no login/rate-limit/admin recovery flow was exercised.
    for (const table of ['access_limits', 'access_prelogins', 'access_security_events']) assert.equal(Number((await tx.execute(sql.raw(`select count(*) as n from public.${table}`))).rows[0].n), 0);
    for (const table of ['kitchen_tickets', 'captured_orders', 'menu_references', 'menu_variants', 'menu_offerings']) {
      await tx.execute(sql`delete from ${sql.identifier(table)} where business_id=${ledger.businessId}::uuid`);
    }
    for (const id of ledger.accountIds) {
      await tx.execute(sql`delete from access_sessions where business_id=${ledger.businessId}::uuid and account_id=${id}::uuid`);
      await tx.execute(sql`delete from staff_branch_grants where business_id=${ledger.businessId}::uuid and account_id=${id}::uuid`);
      await tx.execute(sql`delete from staff_credentials where account_id=${id}::uuid`);
      await tx.execute(sql`delete from staff_accounts where business_id=${ledger.businessId}::uuid and id=${id}::uuid`);
    }
    await tx.execute(sql`delete from installation_binding where singleton=1 and business_id=${ledger.businessId}::uuid and branch_id=${ledger.branchId}::uuid`);
    await tx.execute(sql`delete from branches where business_id=${ledger.businessId}::uuid`);
    await tx.execute(sql`delete from businesses where id=${ledger.businessId}::uuid`);
  });
}
