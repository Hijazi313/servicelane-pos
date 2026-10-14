import type { TransactionContext } from '../../../infrastructure/database/transaction.js';

export type Role = 'administrator' | 'staff';
export interface Account {
  id: string; businessId: string; username: string; displayName: string;
  status: 'active' | 'disabled'; role: Role; passwordChangeRequired: boolean;
  passwordHash: string; branchIds: string[];
}
export interface Session {
  digest: string; businessId: string; accountId: string; csrfToken: string;
  createdAt: Date; lastActivityAt: Date; revokedAt: Date | null;
}
export interface Prelogin { digest: string; csrfToken: string; expiresAt: Date }
export interface Limit { kind: 'account' | 'source'; key: string; attempts: number; expiresAt: Date }
export interface SecurityEvent {
  action: string; success: boolean; actorId?: string; targetId?: string; operator?: string;
}
// A single short transaction serializes authorization and mutations. Hashing stays outside it.
export interface AccessUnit {
  readonly context: TransactionContext;
  findAccount(businessId: string, selector: { id: string } | { username: string }): Promise<Account | undefined>;
  listAccounts(businessId: string): Promise<Account[]>;
  saveAccount(account: Account): Promise<void>;
  getSession(digest: string): Promise<Session | undefined>;
  saveSession(session: Session): Promise<void>;
  revokeSessions(accountId: string, now: Date): Promise<void>;
  getPrelogin(digest: string): Promise<Prelogin | undefined>;
  savePrelogin(prelogin: Prelogin): Promise<void>;
  deletePrelogin(digest: string): Promise<void>;
  getLimit(kind: Limit['kind'], key: string): Promise<Limit | undefined>;
  saveLimit(limit: Limit): Promise<void>;
  deleteLimit(kind: Limit['kind'], key: string): Promise<void>;
  countLimits(kind: Limit['kind']): Promise<number>;
  event(event: SecurityEvent, now: Date): Promise<void>;
  cleanup(now: Date): Promise<void>;
}
export abstract class AccessStore {
  abstract run<T>(work: (unit: AccessUnit) => Promise<T>): Promise<T>;
}
