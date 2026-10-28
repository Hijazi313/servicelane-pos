import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import { transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { DrawerStore, type Drawer, type DrawerEvent, type DrawerPolicyChange, type DrawerRetry, type DrawerScope } from '../application/drawer-store.js';
import type { DrawerSession } from '../domain/drawer-session.js';
import { cashDrawerEvents, cashDrawerPolicies, cashDrawerPolicyHistory, cashDrawerRetries, cashDrawerSessions, cashDrawers } from './schema.js';

@Injectable()
export class PostgresDrawerStore extends DrawerStore {
  constructor(private readonly database: DatabaseService) { super(); }
  async drawers(scope: DrawerScope, transaction?: TransactionContext) {
    return (transaction ? transactionDatabase(transaction) : this.database.db).select({ id: cashDrawers.id, label: cashDrawers.label })
      .from(cashDrawers).where(and(eq(cashDrawers.businessId, scope.businessId), eq(cashDrawers.branchId, scope.branchId)))
      .orderBy(asc(cashDrawers.label), asc(cashDrawers.id)).limit(101);
  }
  async drawer(scope: DrawerScope, id: string, transaction: TransactionContext) {
    const [row] = await transactionDatabase(transaction).select({ id: cashDrawers.id, label: cashDrawers.label }).from(cashDrawers).where(and(
      eq(cashDrawers.businessId, scope.businessId), eq(cashDrawers.branchId, scope.branchId), eq(cashDrawers.id, id)));
    return row;
  }
  async insertDrawer(scope: DrawerScope, drawer: Drawer, transaction: TransactionContext) {
    await transactionDatabase(transaction).insert(cashDrawers).values({ ...scope, ...drawer });
  }
  async drawerByLabel(scope: DrawerScope, label: string, transaction: TransactionContext) {
    const [row] = await transactionDatabase(transaction).select({ id: cashDrawers.id, label: cashDrawers.label }).from(cashDrawers).where(and(
      eq(cashDrawers.businessId, scope.businessId), eq(cashDrawers.branchId, scope.branchId), eq(cashDrawers.label, label)));
    return row;
  }
  async session(scope: DrawerScope, id: string, transaction?: TransactionContext) {
    const [row] = await (transaction ? transactionDatabase(transaction) : this.database.db).select().from(cashDrawerSessions).where(and(
      eq(cashDrawerSessions.businessId, scope.businessId), eq(cashDrawerSessions.branchId, scope.branchId), eq(cashDrawerSessions.id, id)));
    return row?.state;
  }
  async current(scope: DrawerScope, actorId: string, transaction?: TransactionContext) {
    const [row] = await (transaction ? transactionDatabase(transaction) : this.database.db).select().from(cashDrawerSessions).where(and(
      eq(cashDrawerSessions.businessId, scope.businessId), eq(cashDrawerSessions.branchId, scope.branchId),
      eq(cashDrawerSessions.custodianId, actorId), eq(cashDrawerSessions.open, true)));
    return row?.state;
  }
  async openForDrawer(scope: DrawerScope, drawerId: string, transaction: TransactionContext) {
    const [row] = await transactionDatabase(transaction).select().from(cashDrawerSessions).where(and(
      eq(cashDrawerSessions.businessId, scope.businessId), eq(cashDrawerSessions.branchId, scope.branchId),
      eq(cashDrawerSessions.drawerId, drawerId), eq(cashDrawerSessions.open, true)));
    return row?.state;
  }
  async insertSession(scope: DrawerScope, session: DrawerSession, transaction: TransactionContext) {
    await transactionDatabase(transaction).insert(cashDrawerSessions).values({ ...scope, id: session.id,
      drawerId: session.drawerId, custodianId: session.custodianId, revision: session.revision, open: session.closed === null, state: session });
  }
  async updateSession(scope: DrawerScope, session: DrawerSession, expectedRevision: number, transaction: TransactionContext) {
    const rows = await transactionDatabase(transaction).update(cashDrawerSessions).set({ custodianId: session.custodianId,
      revision: session.revision, open: session.closed === null, state: session }).where(and(
      eq(cashDrawerSessions.businessId, scope.businessId), eq(cashDrawerSessions.branchId, scope.branchId),
      eq(cashDrawerSessions.id, session.id), eq(cashDrawerSessions.revision, expectedRevision))).returning({ id: cashDrawerSessions.id });
    return rows.length === 1;
  }
  async policy(scope: DrawerScope, transaction?: TransactionContext) {
    const [row] = await (transaction ? transactionDatabase(transaction) : this.database.db).select().from(cashDrawerPolicies).where(and(
      eq(cashDrawerPolicies.businessId, scope.businessId), eq(cashDrawerPolicies.branchId, scope.branchId)));
    return row && { revision: row.revision, selfClose: row.selfClose, replacementClose: row.replacementClose, replacementIds: row.replacementIds };
  }
  async replacePolicy(scope: DrawerScope, change: DrawerPolicyChange, transaction: TransactionContext) {
    const db = transactionDatabase(transaction);
    const next = { ...change.next, replacementIds: [...change.next.replacementIds] };
    if (change.previous === null) {
      await db.insert(cashDrawerPolicies).values({ ...scope, ...next });
    } else {
      const rows = await db.update(cashDrawerPolicies).set(next).where(and(
        eq(cashDrawerPolicies.businessId, scope.businessId), eq(cashDrawerPolicies.branchId, scope.branchId),
        eq(cashDrawerPolicies.revision, change.previous.revision))).returning({ revision: cashDrawerPolicies.revision });
      if (rows.length !== 1) return false;
    }
    await db.insert(cashDrawerPolicyHistory).values({ ...scope, revision: change.next.revision,
      previous: change.previous, next: change.next, actorId: change.actorId, changedAt: change.changedAt, note: change.note });
    return true;
  }
  async appendEvent(scope: DrawerScope, event: DrawerEvent, transaction: TransactionContext) {
    await transactionDatabase(transaction).insert(cashDrawerEvents).values({ ...scope, ...event });
  }
  async retry(scope: DrawerScope, operation: string, retryKey: string, transaction: TransactionContext) {
    const [row] = await transactionDatabase(transaction).select().from(cashDrawerRetries).where(and(
      eq(cashDrawerRetries.businessId, scope.businessId), eq(cashDrawerRetries.branchId, scope.branchId),
      eq(cashDrawerRetries.operation, operation), eq(cashDrawerRetries.retryKey, retryKey)));
    return row && { request: row.request, result: row.result };
  }
  async saveRetry(scope: DrawerScope, operation: string, retryKey: string, retry: DrawerRetry, transaction: TransactionContext) {
    await transactionDatabase(transaction).insert(cashDrawerRetries).values({ ...scope, operation, retryKey, ...retry });
  }
}
