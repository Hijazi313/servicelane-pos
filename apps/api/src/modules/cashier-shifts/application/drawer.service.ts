import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CURRENCY_PRECISION } from '../../../common/currency-precision.js';
import { AccessService, type CashierAuthorizedScope, type Proof } from '../../authentication/public.js';
import { DrawerError, openDrawer, recordCashMovement, beginHandover, acceptHandover, cancelHandover, closeDrawer, type DrawerSession } from '../domain/drawer-session.js';
import { DrawerStore, type DrawerPolicy } from './drawer-store.js';

function fields(value: unknown, keys: readonly string[]): Map<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DrawerError('INVALID_INPUT');
  const entries = Object.entries(value);
  if (entries.length !== keys.length || entries.some(([key]) => !keys.includes(key))) throw new DrawerError('INVALID_INPUT');
  return new Map(entries);
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new DrawerError('INVALID_INPUT');
  return value.toLowerCase();
}
function revision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 2_147_483_647) throw new DrawerError('INVALID_INPUT');
  return value;
}
function amount(value: unknown): string {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,23})$/.test(value)) throw new DrawerError('INVALID_INPUT');
  return value;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string') throw new DrawerError('INVALID_INPUT');
  const normalized = value.trim();
  if (!normalized || Array.from(normalized).length > max || /[\p{Cc}\p{Cs}]/u.test(normalized)) throw new DrawerError('INVALID_INPUT');
  return normalized;
}
function nullableReason(value: unknown): string | null { return value === null ? null : text(value, 500); }
function bool(value: unknown): boolean { if (typeof value !== 'boolean') throw new DrawerError('INVALID_INPUT'); return value; }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  const encoded = JSON.stringify(value); if (encoded === undefined) throw new DrawerError('INVALID_INPUT'); return encoded;
}
function view(session: DrawerSession): Record<string, unknown> {
  return { id: session.id, drawerId: session.drawerId, status: session.closed ? 'closed' : 'open', currencyCode: session.currencyCode,
    scale: session.scale, openingMinor: session.openingMinor, openedAt: session.openedAt, openedBy: session.openedBy,
    currentCustodianId: session.custodianId, revision: session.revision,
    pendingHandover: session.handover && { id: session.handover.id, recipientStaffId: session.handover.recipientId,
      initiatedBy: session.handover.initiatorId, initiatedAt: session.handover.initiatedAt },
    closed: session.closed && { countedMinor: session.closed.countedMinor, expectedMinor: session.closed.expectedMinor,
      varianceMinor: session.closed.varianceMinor, varianceReason: session.closed.reason,
      closedAt: session.closed.closedAt, closedBy: session.closed.actorId } };
}
function policyView(policy: DrawerPolicy | undefined): Record<string, unknown> {
  return policy ? { revision: policy.revision, configured: true, selfClose: policy.selfClose, replacementClose: policy.replacementClose,
    replacementStaffIds: policy.replacementIds } : { revision: 0, configured: false, selfClose: true, replacementClose: false, replacementStaffIds: [] };
}
@Injectable()
export class DrawerService {
  constructor(private readonly access: AccessService, private readonly store: DrawerStore) {}
  private async mutate(proof: Proof, operation: string, retryKey: string, request: Record<string, unknown>,
    admin: boolean, work: (scope: CashierAuthorizedScope) => Promise<Record<string, unknown>>): Promise<Record<string, unknown>> {
    return this.access.runCashierAuthorized(proof, admin ? 'administrator' : 'staff', async scope => {
      const normalized = { ...request, actorId: scope.actorId };
      const saved = await this.store.retry(scope.installation, operation, retryKey, scope.transaction);
      if (saved) {
        if (canonical(saved.request) !== canonical(normalized)) throw new DrawerError('RETRY_CONFLICT');
        return saved.result;
      }
      const result = await work(scope);
      await this.store.saveRetry(scope.installation, operation, retryKey, { request: normalized, result }, scope.transaction);
      return result;
    });
  }
  private async session(scope: CashierAuthorizedScope, sessionId: string): Promise<DrawerSession> {
    const session = await this.store.session(scope.installation, sessionId, scope.transaction);
    if (!session) throw new DrawerError('DRAWER_NOT_FOUND');
    return session;
  }
  private async update(scope: CashierAuthorizedScope, previous: DrawerSession, next: DrawerSession, kind: string,
    payload: Record<string, unknown>, occurredAt: string): Promise<void> {
    if (!await this.store.updateSession(scope.installation, next, previous.revision, scope.transaction)) throw new DrawerError('STALE_DRAWER');
    await this.store.appendEvent(scope.installation, { id: randomUUID(), sessionId: next.id, kind, actorId: scope.actorId, occurredAt, payload }, scope.transaction);
  }
  async createDrawer(proof: Proof, input: unknown): Promise<Record<string, unknown>> {
    const f = fields(input, ['label', 'retryKey']); const label = text(f.get('label'), 120); const retryKey = id(f.get('retryKey'));
    return this.mutate(proof, 'create-drawer', retryKey, { label }, true, async scope => {
      if (await this.store.drawerByLabel(scope.installation, label, scope.transaction)) throw new DrawerError('DRAWER_EXISTS');
      if ((await this.store.drawers(scope.installation, scope.transaction)).length >= 100) throw new DrawerError('DRAWER_CAPACITY');
      const drawer = { id: randomUUID(), label }; await this.store.insertDrawer(scope.installation, drawer, scope.transaction); return drawer;
    });
  }
  async listDrawers(proof: Proof): Promise<{ id: string; label: string }[]> {
    const context = await this.access.cashierReadContext(proof);
    const drawers = await this.store.drawers(context.installation);
    if (drawers.length > 100) throw new DrawerError('DRAWER_CAPACITY');
    return drawers;
  }
  async open(proof: Proof, drawerIdInput: unknown, input: unknown): Promise<Record<string, unknown>> {
    const drawerId = id(drawerIdInput); const f = fields(input, ['openingMinor', 'retryKey']);
    const openingMinor = amount(f.get('openingMinor')); const retryKey = id(f.get('retryKey'));
    return this.mutate(proof, 'open', retryKey, { drawerId, openingMinor }, false, async scope => {
      if (!await this.store.drawer(scope.installation, drawerId, scope.transaction)) throw new DrawerError('DRAWER_NOT_FOUND');
      if (!await this.store.policy(scope.installation, scope.transaction)) throw new DrawerError('POLICY_UNCONFIGURED');
      if (await this.store.openForDrawer(scope.installation, drawerId, scope.transaction) || await this.store.current(scope.installation, scope.actorId, scope.transaction)) throw new DrawerError('DRAWER_BUSY');
      const currencyCode = scope.installation.business.currencyCode; const scale = CURRENCY_PRECISION[currencyCode];
      if (scale === undefined) throw new DrawerError('CURRENCY_MISMATCH');
      const now = new Date().toISOString(); const session = openDrawer({ id: randomUUID(), drawerId, actorId: scope.actorId, currencyCode, scale, openingMinor, openedAt: now });
      await this.store.insertSession(scope.installation, session, scope.transaction);
      await this.store.appendEvent(scope.installation, { id: randomUUID(), sessionId: session.id, kind: 'open', actorId: scope.actorId, occurredAt: now, payload: { openingMinor } }, scope.transaction);
      return view(session);
    });
  }
  async current(proof: Proof): Promise<Record<string, unknown> | null> {
    const context = await this.access.cashierReadContext(proof); const session = await this.store.current(context.installation, context.actorId);
    return session ? view(session) : null;
  }
  async get(proof: Proof, sessionIdInput: unknown): Promise<Record<string, unknown>> {
    const sessionId = id(sessionIdInput); const context = await this.access.cashierReadContext(proof);
    const session = await this.store.session(context.installation, sessionId);
    const policy = await this.store.policy(context.installation);
    if (!session || (context.actorRole !== 'administrator' && session.custodianId !== context.actorId
      && !(policy?.replacementClose && policy.replacementIds.includes(context.actorId)))) throw new DrawerError('DRAWER_NOT_FOUND');
    return view(session);
  }
  async getPolicy(proof: Proof): Promise<Record<string, unknown>> {
    const context = await this.access.cashierReadContext(proof); return policyView(await this.store.policy(context.installation));
  }
  async replacePolicy(proof: Proof, input: unknown): Promise<Record<string, unknown>> {
    const f = fields(input, ['selfClose', 'replacementClose', 'replacementStaffIds', 'expectedRevision', 'note']);
    const selfClose = bool(f.get('selfClose')), replacementClose = bool(f.get('replacementClose'));
    const raw = f.get('replacementStaffIds'); if (!Array.isArray(raw) || raw.length > 100) throw new DrawerError('INVALID_INPUT');
    const replacementIds = raw.map(id).sort(); if (new Set(replacementIds).size !== replacementIds.length) throw new DrawerError('INVALID_INPUT');
    const expectedRevision = revision(f.get('expectedRevision')), note = text(f.get('note'), 500);
    return this.access.runCashierAuthorized(proof, 'administrator', async scope => {
      const previous = await this.store.policy(scope.installation, scope.transaction);
      if ((previous?.revision ?? 0) !== expectedRevision) throw new DrawerError('STALE_POLICY');
      for (const target of replacementIds) if (!await scope.staffEligible(target)) throw new DrawerError('INVALID_REPLACEMENT');
      if (previous && previous.selfClose === selfClose && previous.replacementClose === replacementClose && JSON.stringify(previous.replacementIds) === JSON.stringify(replacementIds)) return policyView(previous);
      if (expectedRevision === 2_147_483_647) throw new DrawerError('REVISION_CAPACITY');
      const next = { revision: expectedRevision + 1, selfClose, replacementClose, replacementIds };
      if (!await this.store.replacePolicy(scope.installation, { previous: previous ?? null, next, actorId: scope.actorId, changedAt: new Date().toISOString(), note }, scope.transaction)) throw new DrawerError('STALE_POLICY');
      return policyView(next);
    });
  }
  async move(proof: Proof, sessionIdInput: unknown, input: unknown): Promise<Record<string, unknown>> {
    const sessionId = id(sessionIdInput), f = fields(input, ['direction', 'amountMinor', 'reason', 'expectedRevision', 'retryKey']);
    const direction = f.get('direction'); if (direction !== 'in' && direction !== 'out') throw new DrawerError('INVALID_INPUT');
    const amountMinor = amount(f.get('amountMinor')), reason = text(f.get('reason'), 500), expectedRevision = revision(f.get('expectedRevision')), retryKey = id(f.get('retryKey'));
    return this.mutate(proof, 'move', retryKey, { sessionId, direction, amountMinor, reason, expectedRevision }, false, async scope => {
      const session = await this.session(scope, sessionId); const next = recordCashMovement(session, scope.actorId, direction, amountMinor, reason, expectedRevision);
      const occurredAt = new Date().toISOString(), movement = { id: randomUUID(), sessionId, direction, amountMinor, reason, actorId: scope.actorId, occurredAt };
      if (!await this.store.updateSession(scope.installation, next, session.revision, scope.transaction)) throw new DrawerError('STALE_DRAWER');
      await this.store.appendEvent(scope.installation, { id: movement.id, sessionId, kind: 'movement', actorId: scope.actorId, occurredAt, payload: { direction, amountMinor, reason } }, scope.transaction);
      return movement;
    });
  }
  async beginHandover(proof: Proof, sessionIdInput: unknown, input: unknown): Promise<Record<string, unknown>> {
    const sessionId = id(sessionIdInput), f = fields(input, ['recipientStaffId', 'expectedRevision', 'retryKey']);
    const recipientStaffId = id(f.get('recipientStaffId')), expectedRevision = revision(f.get('expectedRevision')), retryKey = id(f.get('retryKey'));
    return this.mutate(proof, 'handover', retryKey, { sessionId, recipientStaffId, expectedRevision }, false, async scope => {
      const session = await this.session(scope, sessionId);
      if (scope.actorRole !== 'administrator' && session.custodianId !== scope.actorId) throw new DrawerError('FORBIDDEN');
      if (!await scope.staffEligible(recipientStaffId)) throw new DrawerError('INVALID_RECIPIENT');
      if (await this.store.current(scope.installation, recipientStaffId, scope.transaction)) throw new DrawerError('DRAWER_BUSY');
      const now = new Date().toISOString(), handoverId = randomUUID();
      const next = beginHandover(session, scope.actorId, scope.actorRole === 'administrator', recipientStaffId, handoverId, expectedRevision, now);
      await this.update(scope, session, next, 'handover-start', { handoverId, outgoingId: session.custodianId, recipientId: recipientStaffId,
        outgoingAcknowledged: scope.actorId === session.custodianId }, now); return view(next);
    });
  }
  async acceptHandover(proof: Proof, sessionIdInput: unknown, handoverIdInput: unknown, input: unknown): Promise<Record<string, unknown>> {
    const sessionId = id(sessionIdInput), handoverId = id(handoverIdInput), f = fields(input, ['countedMinor', 'varianceReason', 'expectedRevision', 'retryKey']);
    const countedMinor = amount(f.get('countedMinor')), varianceReason = nullableReason(f.get('varianceReason')), expectedRevision = revision(f.get('expectedRevision')), retryKey = id(f.get('retryKey'));
    return this.mutate(proof, 'accept-handover', retryKey, { sessionId, handoverId, countedMinor, varianceReason, expectedRevision }, false, async scope => {
      const session = await this.session(scope, sessionId);
      if (await this.store.current(scope.installation, scope.actorId, scope.transaction)) throw new DrawerError('DRAWER_BUSY');
      const accepted = acceptHandover(session, scope.actorId, handoverId, countedMinor, varianceReason, expectedRevision);
      await this.update(scope, session, accepted.session, 'handover-accept', { handoverId, outgoingId: session.custodianId, recipientId: scope.actorId,
        initiatorId: session.handover?.initiatorId, countedMinor, expectedMinor: accepted.expectedMinor, varianceMinor: accepted.varianceMinor, reason: accepted.reason }, new Date().toISOString());
      return view(accepted.session);
    });
  }
  async cancelHandover(proof: Proof, sessionIdInput: unknown, handoverIdInput: unknown, input: unknown): Promise<Record<string, unknown>> {
    const sessionId = id(sessionIdInput), handoverId = id(handoverIdInput), f = fields(input, ['expectedRevision', 'retryKey']);
    const expectedRevision = revision(f.get('expectedRevision')), retryKey = id(f.get('retryKey'));
    return this.mutate(proof, 'cancel-handover', retryKey, { sessionId, handoverId, expectedRevision }, false, async scope => {
      const session = await this.session(scope, sessionId), now = new Date().toISOString();
      const next = cancelHandover(session, scope.actorId, scope.actorRole === 'administrator', handoverId, expectedRevision);
      await this.update(scope, session, next, 'handover-cancel', { handoverId }, now); return view(next);
    });
  }
  async close(proof: Proof, sessionIdInput: unknown, input: unknown): Promise<Record<string, unknown>> {
    const sessionId = id(sessionIdInput), f = fields(input, ['countedMinor', 'varianceReason', 'expectedRevision', 'retryKey']);
    const countedMinor = amount(f.get('countedMinor')), varianceReason = nullableReason(f.get('varianceReason')), expectedRevision = revision(f.get('expectedRevision')), retryKey = id(f.get('retryKey'));
    return this.mutate(proof, 'close', retryKey, { sessionId, countedMinor, varianceReason, expectedRevision }, false, async scope => {
      const session = await this.session(scope, sessionId); const policy = await this.store.policy(scope.installation, scope.transaction);
      if (!policy) throw new DrawerError('POLICY_UNCONFIGURED');
      const now = new Date().toISOString(), next = closeDrawer(session, scope.actorId, scope.actorRole === 'administrator', policy, countedMinor, varianceReason, expectedRevision, now);
      await this.update(scope, session, next, 'close', { countedMinor, expectedMinor: next.closed?.expectedMinor, varianceMinor: next.closed?.varianceMinor, reason: next.closed?.reason }, now);
      return view(next);
    });
  }
}
