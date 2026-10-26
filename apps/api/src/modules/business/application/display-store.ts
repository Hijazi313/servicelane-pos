import type { TransactionContext } from '../../../infrastructure/database/transaction.js';
import type { DisplayView } from './display-settings.js';
export interface DisplayScope { businessId: string; branchId: string }
export abstract class DisplayStore {
  abstract get(scope: DisplayScope, transaction?: TransactionContext): Promise<DisplayView>;
  abstract replace(scope: DisplayScope, before: DisplayView, after: DisplayView, actorId: string, changedAt: Date, transaction: TransactionContext): Promise<void>;
}
