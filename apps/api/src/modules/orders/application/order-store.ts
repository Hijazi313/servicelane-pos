import type { TransactionContext } from '../../../infrastructure/database/transaction.js';
import type { OrderSelection, ResolvedOrderUnit } from '../../menu/public.js';
import type { Customer, LimitPolicy } from '../domain/capture.js';
export interface CaptureLine { selection: OrderSelection; quantity: number; expectedUnitMinor: string; instructions?: string }
export interface CaptureRequest { currencyCode: string; scale: number; lines: CaptureLine[]; customer?: Customer; instructions?: string }
export interface OrderSnapshot {
  id: string; createdAt: string; state: 'captured'; fulfillment: 'takeaway'; amountKind: 'merchandise';
  currencyCode: string; scale: number; totalMinor: string; policy: LimitPolicy; customer?: Customer; instructions?: string;
  lines: { selection: OrderSelection; quantity: number; instructions?: string; unit: ResolvedOrderUnit; lineMinor: string }[];
}
export interface StoredOrder { snapshot: OrderSnapshot; request: CaptureRequest }
export abstract class OrderStore {
  abstract policy(businessId: string, transaction?: TransactionContext): Promise<LimitPolicy>;
  abstract updatePolicy(businessId: string, policy: LimitPolicy, expectedRevision: number, transaction: TransactionContext): Promise<void>;
  abstract replay(businessId: string, branchId: string, key: string, transaction: TransactionContext): Promise<StoredOrder | undefined>;
  abstract get(businessId: string, branchId: string, orderId: string): Promise<OrderSnapshot | undefined>;
  abstract save(businessId: string, branchId: string, key: string, order: StoredOrder, transaction: TransactionContext): Promise<void>;
}
