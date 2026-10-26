import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { BillingStore, type BillingScope, type PolicyChange, type SettlementRecord } from '../application/billing-store.js';
import { BillingError } from '../domain/billing.js';
import { billingPolicies, billingPolicyHistory, billingSettlements } from './schema.js';

function scoped(scope: BillingScope) {
  return and(eq(billingSettlements.businessId, scope.businessId), eq(billingSettlements.branchId, scope.branchId));
}
function record(row: typeof billingSettlements.$inferSelect): SettlementRecord {
  return { bill: row.bill, request: row.request, actorId: row.actorId };
}
function uniqueViolation(error: unknown): boolean {
  return error instanceof Error && (('code' in error && error.code === '23505') || ('cause' in error && error.cause !== error && uniqueViolation(error.cause)));
}
function knownUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ('code' in error && typeof error.code === 'string' &&
    (error.code.startsWith('08') || ['57P01', '57P02', '57P03', '53300', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code))) return true;
  return 'cause' in error && error.cause !== error ? knownUnavailable(error.cause) : false;
}
async function available<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); }
  catch (error) {
    if (knownUnavailable(error)) throw new BillingError('BILLING_UNAVAILABLE');
    throw error;
  }
}
@Injectable()
export class PostgresBillingStore extends BillingStore {
  constructor(private readonly database: DatabaseService) { super(); }
  async policy(scope: BillingScope, transaction?: TransactionContext) {
    const db = transaction ? transactionDatabase(transaction) : this.database.db;
    const [row] = await available(() => db.select().from(billingPolicies).where(eq(billingPolicies.businessId, scope.businessId)));
    return row?.policy;
  }
  async retiredRuleIds(scope: BillingScope, transaction: TransactionContext) {
    const rows = await available(() => transactionDatabase(transaction).select().from(billingPolicyHistory)
      .where(eq(billingPolicyHistory.businessId, scope.businessId)).orderBy(asc(billingPolicyHistory.revision)));
    const retired = new Set<string>();
    for (const row of rows) {
      const next = new Set([...row.next.charges, ...row.next.taxes].map(rule => rule.id));
      for (const rule of [...row.previous.charges, ...row.previous.taxes]) if (!next.has(rule.id)) retired.add(rule.id);
    }
    return [...retired];
  }
  async replacePolicy(scope: BillingScope, change: PolicyChange, transaction: TransactionContext) {
    const db = transactionDatabase(transaction);
    // Access owns serialization; compare-and-swap also prevents accidental lost updates.
    if (change.previous.revision === 0) {
      await available(() => db.insert(billingPolicies).values({ businessId: scope.businessId, revision: change.next.revision, policy: change.next }));
    } else {
      const rows = await available(() => db.update(billingPolicies).set({ revision: change.next.revision, policy: change.next })
        .where(and(eq(billingPolicies.businessId, scope.businessId), eq(billingPolicies.revision, change.previous.revision))).returning({ revision: billingPolicies.revision }));
      if (rows.length !== 1) throw new BillingError('BILLING_UNAVAILABLE');
    }
    await available(() => db.insert(billingPolicyHistory).values({ businessId: scope.businessId, revision: change.next.revision,
      previous: change.previous, next: change.next, actorId: change.actorId, changedAt: change.changedAt, configurationNote: change.configurationNote }));
  }
  async forOrder(scope: BillingScope, orderId: string, transaction?: TransactionContext) {
    const db = transaction ? transactionDatabase(transaction) : this.database.db;
    const [row] = await available(() => db.select().from(billingSettlements).where(and(scoped(scope), eq(billingSettlements.orderId, orderId))));
    return row ? record(row) : undefined;
  }
  async forRetry(scope: BillingScope, retryKey: string, transaction: TransactionContext) {
    const [row] = await available(() => transactionDatabase(transaction).select().from(billingSettlements).where(and(scoped(scope), eq(billingSettlements.retryKey, retryKey))));
    return row ? record(row) : undefined;
  }
  async insert(scope: BillingScope, aggregate: SettlementRecord, transaction: TransactionContext) {
    try {
      await available(() => transactionDatabase(transaction).insert(billingSettlements).values({ id: aggregate.bill.id, businessId: scope.businessId,
        branchId: scope.branchId, orderId: aggregate.bill.orderId, retryKey: aggregate.request.retryKey,
        actorId: aggregate.actorId, bill: aggregate.bill, request: aggregate.request }));
    } catch (error) {
      // Roll back through the caller; no blind retry or second authorization transaction.
      if (uniqueViolation(error)) throw new BillingError('BILLING_UNAVAILABLE');
      throw error;
    }
  }
}
