import { Injectable } from '@nestjs/common';
import { and, desc, eq, lt, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { OrderStore, type OrderPosition, type OrderSummary, type StoredOrder } from '../application/order-store.js';
import { DEFAULT_POLICY, OrdersError, type LimitPolicy } from '../domain/capture.js';
import { capturedOrders, orderCapturePolicies } from './schema.js';
@Injectable()
export class PostgresOrderStore extends OrderStore {
  constructor(private readonly database: DatabaseService) { super(); }
  async policy(businessId: string, transaction?: TransactionContext): Promise<LimitPolicy> {
    const db = transaction ? transactionDatabase(transaction) : this.database.db;
    const [row] = await db.select({ revision: orderCapturePolicies.revision, maxLines: orderCapturePolicies.maxLines, maxQuantity: orderCapturePolicies.maxQuantity })
      .from(orderCapturePolicies).where(eq(orderCapturePolicies.businessId, businessId));
    return row ?? { ...DEFAULT_POLICY };
  }
  async updatePolicy(businessId: string, policy: LimitPolicy, expectedRevision: number, transaction: TransactionContext) {
    const db = transactionDatabase(transaction);
    if (expectedRevision === 0) {
      const rows = await db.insert(orderCapturePolicies).values({ businessId, ...policy }).onConflictDoNothing().returning({ id: orderCapturePolicies.businessId });
      if (!rows.length) throw new OrdersError('STALE_ORDER_POLICY');
    } else {
      const rows = await db.update(orderCapturePolicies).set(policy).where(and(eq(orderCapturePolicies.businessId, businessId), eq(orderCapturePolicies.revision, expectedRevision))).returning({ id: orderCapturePolicies.businessId });
      if (!rows.length) throw new OrdersError('STALE_ORDER_POLICY');
    }
  }
  async replay(businessId: string, branchId: string, key: string, transaction: TransactionContext): Promise<StoredOrder | undefined> {
    const [row] = await transactionDatabase(transaction).select({ snapshot: capturedOrders.snapshot, request: capturedOrders.request }).from(capturedOrders)
      .where(and(eq(capturedOrders.businessId, businessId), eq(capturedOrders.branchId, branchId), eq(capturedOrders.retryKey, key)));
    return row;
  }
  async get(businessId: string, branchId: string, orderId: string, transaction?: TransactionContext) {
    const db = transaction ? transactionDatabase(transaction) : this.database.db;
    const [row] = await db.select({ snapshot: capturedOrders.snapshot }).from(capturedOrders)
      .where(and(eq(capturedOrders.businessId, businessId), eq(capturedOrders.branchId, branchId), eq(capturedOrders.id, orderId)));
    return row?.snapshot;
  }
  async list(businessId: string, branchId: string, limit: number, after?: OrderPosition): Promise<OrderSummary[]> {
    const createdAt = sql<string>`${capturedOrders.snapshot}->>'createdAt'`;
    const rows = await this.database.db.select({ snapshot: capturedOrders.snapshot }).from(capturedOrders)
      .where(and(eq(capturedOrders.businessId, businessId), eq(capturedOrders.branchId, branchId),
        after ? or(lt(createdAt, after.createdAt), and(eq(createdAt, after.createdAt), lt(capturedOrders.id, after.id))) : undefined))
      .orderBy(desc(createdAt), desc(capturedOrders.id)).limit(limit);
    return rows.map(({ snapshot }) => ({ id: snapshot.id, createdAt: snapshot.createdAt, state: snapshot.state,
      fulfillment: snapshot.fulfillment, currencyCode: snapshot.currencyCode, scale: snapshot.scale, totalMinor: snapshot.totalMinor }));
  }
  async save(businessId: string, branchId: string, retryKey: string, order: StoredOrder, transaction: TransactionContext) {
    await transactionDatabase(transaction).insert(capturedOrders).values({ id: order.snapshot.id, businessId, branchId, retryKey, ...order });
  }
}
