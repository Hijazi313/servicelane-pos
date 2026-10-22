import type { InstallationContext } from '../../business/public.js';
import type { TransactionContext } from '../../../infrastructure/database/transaction.js';

export type AuthorizedPolicy = 'staff' | 'administrator';

export interface AuthorizedScope {
  readonly actorId: string;
  readonly installation: InstallationContext;
  readonly transaction: TransactionContext;
}

// Await all work in this scope. No nested access calls, transactions or external I/O.
export type AuthorizedOperation<T> = (scope: AuthorizedScope) => Promise<T>;
