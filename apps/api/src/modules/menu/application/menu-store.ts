import type { TransactionContext } from '../../../infrastructure/database/transaction.js';
import type { Offering } from '../domain/catalogue.js';
export abstract class MenuStore {
  abstract read(businessId: string, transaction?: TransactionContext): Promise<Offering[]>;
  abstract save(businessId: string, offering: Offering, expectedRevision: number | undefined, transaction: TransactionContext): Promise<void>;
}
