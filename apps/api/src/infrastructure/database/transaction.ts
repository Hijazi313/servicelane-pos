import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type DrizzleTransaction = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];
// Public application operations accept an opaque scope, never a query builder.
export interface TransactionContext { readonly id: symbol }
const transactions = new WeakMap<TransactionContext, DrizzleTransaction>();

export async function inTransaction<T>(db: NodePgDatabase, work: (context: TransactionContext) => Promise<T>): Promise<T> {
  return db.transaction(async (transaction) => {
    const context: TransactionContext = Object.freeze({ id: Symbol('transaction') });
    transactions.set(context, transaction);
    try {
      return await work(context);
    } finally {
      transactions.delete(context);
    }
  });
}

// Persistence adapters only. A forged or completed context cannot perform work.
export function transactionDatabase(context: TransactionContext): DrizzleTransaction {
  const transaction = transactions.get(context);
  if (!transaction) throw new Error('Inactive transaction context');
  return transaction;
}
