import { randomUUID } from 'node:crypto';
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { and, count, eq, inArray, isNotNull, lte, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import { inTransaction, transactionDatabase, type TransactionContext } from '../../../infrastructure/database/transaction.js';
import { AccessStore, type AccessUnit, type Account, type Limit, type Prelogin, type SecurityEvent, type Session } from '../application/access-store.js';
import { staffAccounts, staffBranchGrants, staffCredentials } from './schema.js';
import { accessLimits, accessPrelogins, accessSecurityEvents, accessSessions } from './access-schema.js';

class PostgresAccessUnit implements AccessUnit {
  constructor(readonly context: TransactionContext) {}
  private get db() { return transactionDatabase(this.context); }
  private async accounts(businessId: string, selector?: { id: string } | { username: string }): Promise<Account[]> {
    const rows = await this.db.select({ account: staffAccounts, passwordHash: staffCredentials.passwordHash }).from(staffAccounts)
      .innerJoin(staffCredentials, eq(staffCredentials.accountId, staffAccounts.id))
      .where(and(eq(staffAccounts.businessId, businessId), selector && ('id' in selector ? eq(staffAccounts.id, selector.id) : eq(staffAccounts.username, selector.username))))
      .orderBy(staffAccounts.username);
    if (!rows.length) return [];
    const grants = await this.db.select().from(staffBranchGrants).where(and(eq(staffBranchGrants.businessId, businessId), inArray(staffBranchGrants.accountId, rows.map(({ account }) => account.id))));
    return rows.map(({ account, passwordHash }) => ({ ...account, status: account.status as Account['status'], role: account.role as Account['role'], passwordHash, branchIds: grants.filter((grant) => grant.accountId === account.id).map((grant) => grant.branchId).sort() }));
  }
  async findAccount(businessId: string, selector: { id: string } | { username: string }): Promise<Account | undefined> { return (await this.accounts(businessId, selector))[0]; }
  async listAccounts(businessId: string): Promise<Account[]> { return this.accounts(businessId); }
  async saveAccount(account: Account): Promise<void> {
    const { passwordHash, branchIds, ...row } = account;
    // Ownership is immutable even when this private adapter receives an existing ID.
    const { id: _id, businessId: _businessId, ...changes } = row;
    const saved = await this.db.insert(staffAccounts).values(row).onConflictDoUpdate({ target: staffAccounts.id, set: changes, setWhere: eq(staffAccounts.businessId, account.businessId) }).returning({ id: staffAccounts.id });
    if (!saved.length) throw new Error('Account ownership mismatch');
    await this.db.insert(staffCredentials).values({ accountId: account.id, passwordHash }).onConflictDoUpdate({ target: staffCredentials.accountId, set: { passwordHash } });
    await this.db.delete(staffBranchGrants).where(and(eq(staffBranchGrants.businessId, account.businessId), eq(staffBranchGrants.accountId, account.id)));
    if (branchIds.length) await this.db.insert(staffBranchGrants).values(branchIds.map((branchId) => ({ businessId: account.businessId, accountId: account.id, branchId })));
  }
  async getSession(digest: string): Promise<Session | undefined> { return (await this.db.select().from(accessSessions).where(eq(accessSessions.digest, digest)))[0]; }
  async saveSession(session: Session): Promise<void> { await this.db.insert(accessSessions).values(session).onConflictDoUpdate({ target: accessSessions.digest, set: { lastActivityAt: session.lastActivityAt, revokedAt: session.revokedAt } }); }
  async revokeSessions(accountId: string, now: Date): Promise<void> { await this.db.update(accessSessions).set({ revokedAt: now }).where(eq(accessSessions.accountId, accountId)); }
  async getPrelogin(digest: string): Promise<Prelogin | undefined> { return (await this.db.select().from(accessPrelogins).where(eq(accessPrelogins.digest, digest)))[0]; }
  async savePrelogin(prelogin: Prelogin): Promise<void> { await this.db.insert(accessPrelogins).values(prelogin); }
  async deletePrelogin(digest: string): Promise<void> { await this.db.delete(accessPrelogins).where(eq(accessPrelogins.digest, digest)); }
  async getLimit(kind: Limit['kind'], key: string): Promise<Limit | undefined> { return (await this.db.select().from(accessLimits).where(and(eq(accessLimits.kind, kind), eq(accessLimits.key, key))))[0]; }
  async saveLimit(limit: Limit): Promise<void> { await this.db.insert(accessLimits).values(limit).onConflictDoUpdate({ target: [accessLimits.kind, accessLimits.key], set: { attempts: limit.attempts, expiresAt: limit.expiresAt, pendingIds: limit.pendingIds ?? [] } }); }
  async deleteLimit(kind: Limit['kind'], key: string): Promise<void> { await this.db.delete(accessLimits).where(and(eq(accessLimits.kind, kind), eq(accessLimits.key, key))); }
  async countLimits(kind: Limit['kind']): Promise<number> { return (await this.db.select({ value: count() }).from(accessLimits).where(eq(accessLimits.kind, kind)))[0]!.value; }
  async event(event: SecurityEvent, now: Date): Promise<void> { await this.db.insert(accessSecurityEvents).values({ id: randomUUID(), ...event, occurredAt: now }); }
  async cleanup(now: Date): Promise<void> {
    const prelogins = this.db.select({ digest: accessPrelogins.digest }).from(accessPrelogins).where(lte(accessPrelogins.expiresAt, now)).limit(100);
    await this.db.delete(accessPrelogins).where(inArray(accessPrelogins.digest, prelogins));
    const sessions = this.db.select({ digest: accessSessions.digest }).from(accessSessions).where(or(isNotNull(accessSessions.revokedAt), lte(accessSessions.lastActivityAt, new Date(now.getTime() - 30 * 60_000)), lte(accessSessions.createdAt, new Date(now.getTime() - 12 * 60 * 60_000)))).limit(100);
    await this.db.delete(accessSessions).where(inArray(accessSessions.digest, sessions));
    // Composite keys are selected/deleted together; each cleanup remains bounded.
    const limits = await this.db.select({ kind: accessLimits.kind, key: accessLimits.key }).from(accessLimits).where(lte(accessLimits.expiresAt, now)).limit(100);
    if (limits.length) await this.db.delete(accessLimits).where(or(...limits.map((limit) => and(eq(accessLimits.kind, limit.kind), eq(accessLimits.key, limit.key)))));
  }
}

@Injectable()
export class PostgresAccessStore extends AccessStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresAccessStore.name);
  private timer?: ReturnType<typeof setInterval>;
  private cleaning = false;
  constructor(private readonly database: DatabaseService) { super(); }
  async run<T>(work: (unit: AccessUnit) => Promise<T>): Promise<T> {
    return inTransaction(this.database.db, async (context) => {
      // Fixed installation-local lock shared by every access transaction/worker.
      await transactionDatabase(context).execute(sql`SELECT pg_advisory_xact_lock(20261012, 2)`);
      return work(new PostgresAccessUnit(context));
    });
  }
  onModuleInit(): void {
    this.timer = setInterval(() => {
      if (this.cleaning) return;
      this.cleaning = true;
      void this.run((unit) => unit.cleanup(new Date())).catch(() => this.logger.warn('Access cleanup unavailable')).finally(() => { this.cleaning = false; });
    }, 60_000);
    this.timer.unref();
  }
  onModuleDestroy(): void { clearInterval(this.timer); }
}
