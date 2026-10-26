import type { TransactionContext } from '../../../infrastructure/database/transaction.js';
import type { BillView, PolicyView, SettlementRequest } from '../domain/billing.js';

export interface BillingScope { businessId: string; branchId: string }
export interface SettlementRecord {
  bill: BillView;
  request: SettlementRequest;
  actorId: string;
}
export interface PolicyChange {
  previous: PolicyView;
  next: PolicyView;
  actorId: string;
  changedAt: string;
  configurationNote: string;
}
export abstract class BillingStore {
  abstract policy(scope: BillingScope, transaction?: TransactionContext): Promise<PolicyView | undefined>;
  abstract retiredRuleIds(scope: BillingScope, transaction: TransactionContext): Promise<string[]>;
  abstract replacePolicy(scope: BillingScope, change: PolicyChange, transaction: TransactionContext): Promise<void>;
  abstract forOrder(scope: BillingScope, orderId: string, transaction?: TransactionContext): Promise<SettlementRecord | undefined>;
  abstract forRetry(scope: BillingScope, retryKey: string, transaction: TransactionContext): Promise<SettlementRecord | undefined>;
  abstract insert(scope: BillingScope, record: SettlementRecord, transaction: TransactionContext): Promise<void>;
}
