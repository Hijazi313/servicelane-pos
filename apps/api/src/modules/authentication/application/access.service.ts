import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BusinessService } from '../../business/public.js';
import { AccessStore, type AccessUnit, type Account, type Session } from './access-store.js';
import { AccessError, PasswordHasher, token, tokenDigest, digest, sameToken, sessionActive, safeAccount, object, uuid, password, identity, role } from './access-policy.js';
import type { AuthorizedOperation, AuthorizedPolicy } from './authorized-operation.js';

// Keep consumer failures distinct from access/transaction failures until rollback finishes.
class CallbackFailure extends Error {
  constructor(readonly original: unknown) { super('Authorized operation failed'); }
}

export interface Proof { session?: string; prelogin?: string; csrf?: string }
export interface SessionResult { sessionToken: string; csrfToken: string; account: ReturnType<typeof safeAccount> }

@Injectable()
export class AccessService {
  // Tests replace this clock; production always uses server time.
  now = (): Date => new Date();
  constructor(private readonly store: AccessStore, private readonly business: BusinessService, private readonly hasher: PasswordHasher) {}

  private async execute<T>(action: string, work: () => Promise<T>, failure: { proof?: Proof; targetId?: unknown; operator?: string } = {}): Promise<T> {
    try { return await work(); }
    catch (error) {
      const safe = error instanceof AccessError ? error : new AccessError('UNAVAILABLE', 'Service unavailable');
      if (action !== 'read') {
        try {
          await this.store.run(async (unit) => {
            const key = tokenDigest(failure.proof?.session);
            const session = key ? await unit.getSession(key) : undefined;
            let targetId: string | undefined;
            try { if (failure.targetId !== undefined) targetId = uuid(failure.targetId); } catch { /* Do not retain malformed input. */ }
            const operator = failure.operator && failure.operator.length <= 160 && !/[\p{Cc}\p{Cs}]/u.test(failure.operator) ? failure.operator : undefined;
            await unit.event({ action, success: false, ...(session ? { actorId: session.accountId } : {}), ...(targetId ? { targetId } : {}), ...(operator ? { operator } : {}) }, this.now());
          });
        }
        catch { throw new AccessError('UNAVAILABLE', 'Service unavailable'); }
      }
      throw safe;
    }
  }
  private async bound(unit: AccessUnit) { return this.business.resolveInstallationContext(unit.context); }
  private async principal(unit: AccessUnit, proof: Proof, admin = false, restricted = false) {
    const key = tokenDigest(proof.session);
    const session = key ? await unit.getSession(key) : undefined;
    if (!session || !sessionActive(session, this.now())) throw new AccessError('UNAUTHENTICATED', 'Authentication required');
    const context = await this.bound(unit);
    if (session.businessId !== context.businessId) throw new AccessError('UNAUTHENTICATED', 'Authentication required');
    const account = await unit.findAccount(context.businessId, { id: session.accountId });
    if (!account || account.status !== 'active') throw new AccessError('UNAUTHENTICATED', 'Authentication required');
    if (!account.branchIds.includes(context.branchId)) throw new AccessError('FORBIDDEN', 'Access denied');
    await this.business.validateBranchOwnership(context.businessId, context.branchId, unit.context);
    if ((admin && account.role !== 'administrator') || (account.passwordChangeRequired && !restricted)) throw new AccessError('FORBIDDEN', 'Access denied');
    return { session, account, context };
  }
  private csrf(proof: Proof, expected: string) {
    if (!sameToken(proof.csrf, expected)) throw new AccessError('FORBIDDEN', 'Invalid CSRF proof');
  }
  private async prelogin(unit: AccessUnit, proof: Proof) {
    const key = tokenDigest(proof.prelogin);
    const state = key ? await unit.getPrelogin(key) : undefined;
    if (!state || state.expiresAt.getTime() <= this.now().getTime()) throw new AccessError('FORBIDDEN', 'Invalid CSRF proof');
    this.csrf(proof, state.csrfToken);
    return state;
  }
  private async issue(unit: AccessUnit, account: Account): Promise<SessionResult> {
    const sessionToken = token(); const csrfToken = token(); const now = this.now();
    await unit.saveSession({ digest: digest(sessionToken), csrfToken, accountId: account.id, businessId: account.businessId, createdAt: now, lastActivityAt: now, revokedAt: null });
    return { sessionToken, csrfToken, account: safeAccount(account) };
  }
  private async event(unit: AccessUnit, action: string, actorId?: string, targetId?: string, operator?: string) {
    await unit.event({ action, success: true, ...(actorId ? { actorId } : {}), ...(targetId ? { targetId } : {}), ...(operator ? { operator } : {}) }, this.now());
  }
  private async touch(unit: AccessUnit, session: Session) {
    await unit.saveSession({ ...session, lastActivityAt: this.now() });
  }
  async authorize(proof: Proof, admin = false, restricted = false): Promise<void> {
    await this.execute('read', () => this.store.run(async (unit) => { await this.principal(unit, proof, admin, restricted); }));
  }
  async runAuthorized<T>(proof: Proof, policy: AuthorizedPolicy, work: AuthorizedOperation<T>): Promise<T> {
    try {
      // Fail closed for untyped callers too; an unknown policy must not become staff access.
      if (policy !== 'staff' && policy !== 'administrator') throw new AccessError('FORBIDDEN', 'Access denied');
      return await this.store.run(async (unit) => {
        const { session, context } = await this.principal(unit, proof, policy === 'administrator');
        this.csrf(proof, session.csrfToken);
        await this.touch(unit, session);
        try { return await work({ installation: context, transaction: unit.context }); }
        catch (error) { throw new CallbackFailure(error); }
      });
    } catch (error) {
      // A rollback/commit failure replacing the callback marker is an infrastructure failure.
      if (error instanceof CallbackFailure) throw error.original;
      throw error instanceof AccessError ? error : new AccessError('UNAVAILABLE', 'Service unavailable');
    }
  }
  async bootstrap(proof: Proof) {
    return this.execute('read', () => this.store.run(async (unit) => {
      if (tokenDigest(proof.session)) {
        try {
          const { session } = await this.principal(unit, proof, false, true);
          await this.touch(unit, session);
          return { csrfToken: session.csrfToken };
        } catch (error) { if (!(error instanceof AccessError) || error.reason !== 'UNAUTHENTICATED') throw error; }
      }
      const preloginToken = token(); const csrfToken = token();
      await unit.savePrelogin({ digest: digest(preloginToken), csrfToken, expiresAt: new Date(this.now().getTime() + 10 * 60_000) });
      return { preloginToken, csrfToken };
    }));
  }
  private async reserve(unit: AccessUnit, kind: 'account' | 'source', key: string, max: number, duration: number, reservationId?: string) {
    const now = this.now();
    const old = await unit.getLimit(kind, key);
    const current = old && old.expiresAt.getTime() > now.getTime() ? old : undefined;
    if (current && current.attempts >= max) return Math.max(1, Math.ceil((current.expiresAt.getTime() - now.getTime()) / 1000));
    if (!old && await unit.countLimits(kind) >= 10_000) return 60;
    await unit.saveLimit({ kind, key, attempts: (current?.attempts ?? 0) + 1, expiresAt: current?.expiresAt ?? new Date(now.getTime() + duration), pendingIds: reservationId ? [...(current?.pendingIds ?? []), reservationId] : [] });
    return 0;
  }
  private async settleLogin(unit: AccessUnit, key: string, reservationId: string, success: boolean) {
    const limit = await unit.getLimit('account', key);
    if (!limit || limit.expiresAt.getTime() <= this.now().getTime() || !limit.pendingIds?.includes(reservationId)) return;
    const pendingIds = limit.pendingIds.filter((id) => id !== reservationId);
    // The ID makes repeated settlement safe even if a commit acknowledgement was lost.
    if (success && !pendingIds.length) await unit.deleteLimit('account', key);
    else await unit.saveLimit({ ...limit, pendingIds, attempts: success ? pendingIds.length : limit.attempts });
  }
  async login(value: unknown, proof: Proof, source: string) {
    return this.execute('login', async () => {
      const input = object(value, ['username', 'password']);
      const username = identity({ username: input.username }).username;
      const secret = password(input.password); const accountKey = digest(username); const reservationId = randomUUID();
      // Commit reservations even when denied; throwing inside this transaction would roll them back.
      const reservation = await this.store.run(async (unit) => {
        await this.prelogin(unit, proof);
        const context = await this.bound(unit);
        const sourceRetry = await this.reserve(unit, 'source', digest(source), 30, 60_000);
        if (sourceRetry) return { retry: sourceRetry };
        const retry = await this.reserve(unit, 'account', accountKey, 5, 15 * 60_000, reservationId);
        const account = retry ? undefined : await unit.findAccount(context.businessId, { username });
        return { retry, account };
      });
      if (reservation.retry) throw new AccessError('RATE_LIMITED', 'Try again later', reservation.retry);
      let completed = false;
      try {
        const candidate = reservation.account;
        const valid = candidate?.status === 'active' ? await this.hasher.verify(secret, candidate.passwordHash) : await this.hasher.dummy(secret);
        if (!valid || !candidate || candidate.status !== 'active') throw new AccessError('UNAUTHENTICATED', 'Invalid credentials');
        const result = await this.store.run(async (unit) => {
          const pre = await this.prelogin(unit, proof);
          const context = await this.bound(unit);
          const fresh = await unit.findAccount(context.businessId, { id: candidate.id });
          if (!fresh || fresh.status !== 'active' || fresh.passwordHash !== candidate.passwordHash || !fresh.branchIds.includes(context.branchId)) throw new AccessError('UNAUTHENTICATED', 'Invalid credentials');
          await this.business.validateBranchOwnership(context.businessId, context.branchId, unit.context);
          await unit.deletePrelogin(pre.digest);
          await this.settleLogin(unit, accountKey, reservationId, true);
          const oldDigest = tokenDigest(proof.session);
          if (oldDigest) {
            const old = await unit.getSession(oldDigest);
            if (old) await unit.saveSession({ ...old, revokedAt: this.now() });
          }
          const result = await this.issue(unit, fresh);
          await this.event(unit, 'login', fresh.id, fresh.id);
          return result;
        });
        completed = true;
        return result;
      } finally {
        if (!completed) await this.store.run((unit) => this.settleLogin(unit, accountKey, reservationId, false));
      }
    }, { proof });
  }
  async logout(proof: Proof) {
    return this.execute('logout', () => this.store.run(async (unit) => {
      const key = tokenDigest(proof.session); const session = key ? await unit.getSession(key) : undefined;
      // Pre-login proof must not turn an active-session logout into a no-op.
      if (session && sessionActive(session, this.now())) this.csrf(proof, session.csrfToken);
      if (session && sameToken(proof.csrf, session.csrfToken)) {
        // A retained expired/revoked session can prove an idempotent logout, but never authorize work.
        await unit.saveSession({ ...session, revokedAt: session.revokedAt ?? this.now() });
        await this.event(unit, 'logout', session.accountId, session.accountId);
      } else { await this.prelogin(unit, proof); }
    }), { proof });
  }
  async me(proof: Proof, contextOnly = false) {
    return this.execute('read', () => this.store.run(async (unit) => {
      const { session, account, context } = await this.principal(unit, proof);
      await this.touch(unit, session);
      return contextOnly ? context : safeAccount(account);
    }));
  }
  async list(proof: Proof) {
    return this.execute('read', () => this.store.run(async (unit) => {
      const { session, context } = await this.principal(unit, proof, true);
      await this.touch(unit, session);
      return (await unit.listAccounts(context.businessId)).map(safeAccount);
    }));
  }
  async create(value: unknown, proof: Proof) {
    return this.execute('staff.create', async () => {
      const input = object(value, ['username', 'displayName', 'role', 'branchId', 'password']);
      const profile = identity({ username: input.username, ...(input.displayName === undefined ? {} : { displayName: input.displayName }) });
      const desiredRole = role(input.role); const branchId = uuid(input.branchId);
      // Reject unauthorized hashing before spending CPU, then recheck in the mutation transaction.
      await this.store.run(async (unit) => { const { session } = await this.principal(unit, proof, true); this.csrf(proof, session.csrfToken); });
      const hash = await this.hasher.hash(password(input.password));
      return this.store.run(async (unit) => {
        const { session, account: actor, context } = await this.principal(unit, proof, true); this.csrf(proof, session.csrfToken);
        await this.branch(unit, context.businessId, context.branchId, branchId);
        if (await unit.findAccount(context.businessId, { username: profile.username })) throw new AccessError('CONFLICT', 'Username unavailable');
        const account: Account = { id: randomUUID(), businessId: context.businessId, ...profile, role: desiredRole, status: 'active', passwordChangeRequired: true, passwordHash: hash, branchIds: [branchId] };
        await unit.saveAccount(account); await this.touch(unit, session); await this.event(unit, 'staff.create', actor.id, account.id);
        return safeAccount(account);
      });
    }, { proof });
  }
  private async branch(unit: AccessUnit, businessId: string, installedBranch: string, requestedBranch: string) {
    if (installedBranch !== requestedBranch) throw new AccessError('NOT_FOUND', 'Resource not found');
    await this.business.validateBranchOwnership(businessId, requestedBranch, unit.context);
  }
  async patch(idValue: unknown, value: unknown, proof: Proof) {
    return this.execute('staff.update', async () => {
      const id = uuid(idValue); const input = object(value, ['displayName', 'role', 'branchId', 'status']);
      if (!Object.keys(input).length) throw new AccessError('INVALID_INPUT', 'Invalid input');
      return this.store.run(async (unit) => {
        const { session, account: actor, context } = await this.principal(unit, proof, true); this.csrf(proof, session.csrfToken);
        const target = await unit.findAccount(context.businessId, { id });
        if (!target) throw new AccessError('NOT_FOUND', 'Resource not found');
        const next = { ...target, branchIds: [...target.branchIds] };
        if (input.displayName !== undefined) next.displayName = identity({ username: target.username, displayName: input.displayName }).displayName;
        if (input.role !== undefined) next.role = role(input.role);
        if (input.status !== undefined) { if (input.status !== 'active' && input.status !== 'disabled') throw new AccessError('INVALID_INPUT', 'Invalid status'); next.status = input.status; }
        if (input.branchId !== undefined) { const branchId = uuid(input.branchId); await this.branch(unit, context.businessId, context.branchId, branchId); next.branchIds = [branchId]; }
        if (target.status === 'active' && target.role === 'administrator' && (next.status !== 'active' || next.role !== 'administrator')) {
          const admins = (await unit.listAccounts(context.businessId)).filter((account) => account.status === 'active' && account.role === 'administrator');
          if (admins.length <= 1) throw new AccessError('CONFLICT', 'Last administrator must remain active');
        }
        await unit.saveAccount(next);
        await this.touch(unit, session);
        if (input.role !== undefined || input.status !== undefined || input.branchId !== undefined) await unit.revokeSessions(target.id, this.now());
        await this.event(unit, 'staff.update', actor.id, target.id);
        return safeAccount(next);
      });
    }, { proof, targetId: idValue });
  }
  async reset(idValue: unknown, value: unknown, proof: Proof) {
    return this.execute('staff.password-reset', async () => {
      const id = uuid(idValue); const input = object(value, ['password']);
      await this.store.run(async (unit) => { const { session } = await this.principal(unit, proof, true); this.csrf(proof, session.csrfToken); });
      const hash = await this.hasher.hash(password(input.password));
      await this.store.run(async (unit) => {
        const { session, account: actor, context } = await this.principal(unit, proof, true); this.csrf(proof, session.csrfToken);
        const target = await unit.findAccount(context.businessId, { id });
        if (!target) throw new AccessError('NOT_FOUND', 'Resource not found');
        await unit.saveAccount({ ...target, passwordHash: hash, passwordChangeRequired: true });
        await this.touch(unit, session);
        await unit.revokeSessions(target.id, this.now());
        await this.event(unit, 'staff.password-reset', actor.id, target.id);
      });
    }, { proof, targetId: idValue });
  }
  async changePassword(value: unknown, proof: Proof) {
    return this.execute('password.change', async () => {
      const input = object(value, ['currentPassword', 'newPassword']);
      const currentPassword = password(input.currentPassword); const nextPassword = password(input.newPassword);
      const original = await this.store.run(async (unit) => { const principal = await this.principal(unit, proof, false, true); this.csrf(proof, principal.session.csrfToken); return principal.account; });
      if (!await this.hasher.verify(currentPassword, original.passwordHash)) throw new AccessError('UNAUTHENTICATED', 'Invalid credentials');
      if (currentPassword === nextPassword) throw new AccessError('INVALID_INPUT', 'New password must differ from current password');
      const hash = await this.hasher.hash(nextPassword);
      return this.store.run(async (unit) => {
        const { session, account } = await this.principal(unit, proof, false, true); this.csrf(proof, session.csrfToken);
        if (original.passwordHash !== account.passwordHash) throw new AccessError('UNAUTHENTICATED', 'Authentication required');
        const next = { ...account, passwordHash: hash, passwordChangeRequired: false };
        await unit.saveAccount(next); await unit.revokeSessions(account.id, this.now());
        const result = await this.issue(unit, next); await this.event(unit, 'password.change', account.id, account.id); return result;
      });
    }, { proof });
  }
  async recover(businessValue: unknown, accountValue: unknown, replacement: unknown, operator: string) {
    return this.execute('operator.recover', async () => {
      const businessId = uuid(businessValue); const id = uuid(accountValue);
      if (!operator || operator.length > 160 || /[\p{Cc}\p{Cs}]/u.test(operator)) throw new AccessError('INVALID_INPUT', 'Invalid operator identity');
      const hash = await this.hasher.hash(password(replacement));
      await this.store.run(async (unit) => {
        const context = await this.bound(unit);
        if (context.businessId !== businessId) throw new AccessError('NOT_FOUND', 'Resource not found');
        const target = await unit.findAccount(businessId, { id });
        if (!target || target.role !== 'administrator') throw new AccessError('NOT_FOUND', 'Resource not found');
        await this.business.validateBranchOwnership(businessId, context.branchId, unit.context);
        await unit.saveAccount({ ...target, status: 'active', passwordHash: hash, passwordChangeRequired: true, branchIds: [context.branchId] });
        await unit.revokeSessions(id, this.now()); await this.event(unit, 'operator.recover', undefined, id, operator);
      });
    }, { targetId: accountValue, operator });
  }
}
