import type { TransactionContext } from '../../../infrastructure/database/transaction.js';
import type { ClosePolicy, DrawerSession } from '../domain/drawer-session.js';

export interface DrawerScope { businessId: string; branchId: string }
export interface DrawerEvent {
  id: string; sessionId: string; kind: string; actorId: string; occurredAt: string; payload: Record<string, unknown>;
}
export interface DrawerRetry { request: Record<string, unknown>; result: Record<string, unknown> }
export interface DrawerPolicy extends ClosePolicy { revision: number }
export interface Drawer { id: string; label: string }
export interface DrawerPolicyChange {
  previous: DrawerPolicy | null; next: DrawerPolicy; actorId: string; changedAt: string; note: string;
}

export abstract class DrawerStore {
  abstract drawers(scope: DrawerScope, transaction?: TransactionContext): Promise<Drawer[]>;
  abstract drawer(scope: DrawerScope, id: string, transaction: TransactionContext): Promise<Drawer | undefined>;
  abstract drawerByLabel(scope: DrawerScope, label: string, transaction: TransactionContext): Promise<Drawer | undefined>;
  abstract insertDrawer(scope: DrawerScope, drawer: Drawer, transaction: TransactionContext): Promise<void>;
  abstract session(scope: DrawerScope, id: string, transaction?: TransactionContext): Promise<DrawerSession | undefined>;
  abstract current(scope: DrawerScope, actorId: string, transaction?: TransactionContext): Promise<DrawerSession | undefined>;
  abstract openForDrawer(scope: DrawerScope, drawerId: string, transaction: TransactionContext): Promise<DrawerSession | undefined>;
  abstract insertSession(scope: DrawerScope, session: DrawerSession, transaction: TransactionContext): Promise<void>;
  abstract updateSession(scope: DrawerScope, session: DrawerSession, expectedRevision: number, transaction: TransactionContext): Promise<boolean>;
  abstract policy(scope: DrawerScope, transaction?: TransactionContext): Promise<DrawerPolicy | undefined>;
  abstract replacePolicy(scope: DrawerScope, change: DrawerPolicyChange, transaction: TransactionContext): Promise<boolean>;
  abstract appendEvent(scope: DrawerScope, event: DrawerEvent, transaction: TransactionContext): Promise<void>;
  abstract retry(scope: DrawerScope, operation: string, retryKey: string, transaction: TransactionContext): Promise<DrawerRetry | undefined>;
  abstract saveRetry(scope: DrawerScope, operation: string, retryKey: string, retry: DrawerRetry, transaction: TransactionContext): Promise<void>;
}
