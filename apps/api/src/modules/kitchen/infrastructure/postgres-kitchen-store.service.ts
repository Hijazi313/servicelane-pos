import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, lte, sql } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { KitchenStore, type KitchenScope, type TicketRecord } from '../application/kitchen-store.js';
import { kitchenTickets } from './schema.js';

type Row = typeof kitchenTickets.$inferSelect;
function record(row: Row): TicketRecord {
  return { id: row.id, orderId: row.orderId, capturedAt: row.preparation.capturedAt, preparation: row.preparation,
    state: row.state, revision: row.revision, dispatchedAt: row.dispatchedAt, dispatchedBy: row.dispatchedBy,
    ...(row.preparingAt ? { preparingAt: row.preparingAt } : {}), ...(row.preparingBy ? { preparingBy: row.preparingBy } : {}),
    ...(row.readyAt ? { readyAt: row.readyAt } : {}), ...(row.readyBy ? { readyBy: row.readyBy } : {}) };
}
function scoped(scope: KitchenScope) { return and(eq(kitchenTickets.businessId, scope.businessId), eq(kitchenTickets.branchId, scope.branchId)); }
@Injectable()
export class PostgresKitchenStore extends KitchenStore {
  constructor(private readonly database: DatabaseService) { super(); }
  async get(scope: KitchenScope, id: string, transaction?: TransactionContext) {
    const db = transaction ? transactionDatabase(transaction) : this.database.db;
    const [row] = await db.select().from(kitchenTickets).where(and(scoped(scope), eq(kitchenTickets.id, id)));
    return row ? record(row) : undefined;
  }
  async forOrder(scope: KitchenScope, orderId: string, transaction: TransactionContext) {
    const [row] = await transactionDatabase(transaction).select().from(kitchenTickets).where(and(scoped(scope), eq(kitchenTickets.orderId, orderId)));
    return row ? record(row) : undefined;
  }
  async insert(scope: KitchenScope, ticket: TicketRecord, transaction: TransactionContext) {
    const db = transactionDatabase(transaction);
    const [row] = await db.insert(kitchenTickets).values({ id: ticket.id, businessId: scope.businessId, branchId: scope.branchId, orderId: ticket.orderId, preparation: ticket.preparation,
      state: ticket.state, revision: ticket.revision, dispatchedAt: ticket.dispatchedAt, dispatchedBy: ticket.dispatchedBy })
      .onConflictDoNothing({ target: [kitchenTickets.businessId, kitchenTickets.branchId, kitchenTickets.orderId] }).returning();
    if (row) return record(row);
    const existing = await this.forOrder(scope, ticket.orderId, transaction);
    if (!existing) throw new Error('Kitchen storage unavailable');
    return existing;
  }
  async advance(scope: KitchenScope, id: string, expectedRevision: number, target: 'preparing' | 'ready', actorId: string, at: string, transaction: TransactionContext) {
    const [row] = await transactionDatabase(transaction).update(kitchenTickets).set({ state: target, revision: expectedRevision + 1,
      ...(target === 'preparing' ? { preparingAt: at, preparingBy: actorId } : { readyAt: at, readyBy: actorId }) })
      .where(and(scoped(scope), eq(kitchenTickets.id, id), eq(kitchenTickets.revision, expectedRevision), eq(kitchenTickets.state, target === 'preparing' ? 'queued' : 'preparing'))).returning();
    return row ? record(row) : undefined;
  }
  async maximum(scope: KitchenScope) {
    const [row] = await this.database.db.select({ position: kitchenTickets.position }).from(kitchenTickets).where(scoped(scope)).orderBy(desc(kitchenTickets.position)).limit(1);
    return row?.position.toString() ?? '0';
  }
  async page(scope: KitchenScope, after: string, fence: string, limit: number) {
    const rows = await this.database.db.select({ id: kitchenTickets.id, orderId: kitchenTickets.orderId, position: kitchenTickets.position,
      capturedAt: sql<string>`${kitchenTickets.preparation}->>'capturedAt'`, dispatchedAt: kitchenTickets.dispatchedAt, state: kitchenTickets.state, revision: kitchenTickets.revision })
      .from(kitchenTickets).where(and(scoped(scope), gt(kitchenTickets.position, BigInt(after)), lte(kitchenTickets.position, BigInt(fence))))
      .orderBy(asc(kitchenTickets.position)).limit(limit);
    return rows.map(row => ({ position: row.position.toString(), summary: { id: row.id, orderId: row.orderId, capturedAt: row.capturedAt,
      dispatchedAt: row.dispatchedAt, state: row.state, revision: row.revision } }));
  }
}
