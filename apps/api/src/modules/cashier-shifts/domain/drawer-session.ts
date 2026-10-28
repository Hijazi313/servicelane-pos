/** Framework-independent rules for cash accountability. Amounts are integer minor units. */
export class DrawerError extends Error {
  constructor(readonly code: string) { super(code); }
}

export interface Handover {
  readonly id: string;
  readonly initiatorId: string;
  readonly outgoingId: string;
  readonly recipientId: string;
}
export interface DrawerSession {
  readonly id: string;
  readonly drawerId: string;
  readonly custodianId: string;
  readonly currencyCode: string;
  readonly scale: number;
  readonly openedBy: string;
  readonly openedAt: string;
  readonly openingMinor: string;
  readonly cashSalesMinor: string;
  readonly cashInMinor: string;
  readonly cashOutMinor: string;
  readonly revision: number;
  readonly handover: Handover | null;
  readonly closed: { readonly countedMinor: string; readonly expectedMinor: string;
    readonly varianceMinor: string; readonly reason: string | null; readonly actorId: string } | null;
}
export interface ClosePolicy {
  readonly selfClose: boolean;
  readonly replacementClose: boolean;
  readonly replacementIds: readonly string[];
}

const LIMIT = 10n ** 24n - 1n;
function minor(value: string, positive = false): bigint {
  if (!/^(0|[1-9][0-9]{0,23})$/.test(value)) throw new DrawerError('INVALID_AMOUNT');
  const amount = BigInt(value);
  if (positive && amount === 0n) throw new DrawerError('INVALID_AMOUNT');
  return amount;
}
function safe(amount: bigint): string {
  if (amount < 0n || amount > LIMIT) throw new DrawerError('AMOUNT_CAPACITY');
  return amount.toString();
}
function reason(value: string | null, required: boolean): string | null {
  const normalized = value?.trim() ?? '';
  if (Array.from(normalized).length > 500 || (required && !normalized)) throw new DrawerError('INVALID_REASON');
  return normalized || null;
}
function mutate(session: DrawerSession, revision: number): number {
  if (session.closed) throw new DrawerError('DRAWER_CLOSED');
  if (session.revision !== revision) throw new DrawerError('STALE_DRAWER');
  if (revision >= 2_147_483_647) throw new DrawerError('REVISION_CAPACITY');
  return revision + 1;
}
function current(session: DrawerSession, actorId: string): void {
  if (session.custodianId !== actorId) throw new DrawerError('NOT_CUSTODIAN');
  if (session.handover) throw new DrawerError('HANDOVER_PENDING');
}
export function openDrawer(input: { id: string; drawerId: string; actorId: string; currencyCode: string;
  scale: number; openingMinor: string; openedAt: string }): DrawerSession {
  minor(input.openingMinor);
  if (!input.id || !input.drawerId || !input.actorId || !/^[A-Z]{3}$/.test(input.currencyCode)
    || !Number.isInteger(input.scale) || input.scale < 0 || input.scale > 9
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.openedAt)
    || !Number.isFinite(Date.parse(input.openedAt)) || new Date(input.openedAt).toISOString() !== input.openedAt) {
    throw new DrawerError('INVALID_OPEN');
  }
  return { id: input.id, drawerId: input.drawerId, custodianId: input.actorId, currencyCode: input.currencyCode,
    scale: input.scale, openedBy: input.actorId, openedAt: input.openedAt, openingMinor: input.openingMinor,
    cashSalesMinor: '0', cashInMinor: '0', cashOutMinor: '0', revision: 0, handover: null, closed: null };
}
export function expectedCash(session: DrawerSession): string {
  return safe(minor(session.openingMinor) + minor(session.cashSalesMinor) + minor(session.cashInMinor) - minor(session.cashOutMinor));
}
export function recordCashSale(session: DrawerSession, actorId: string, amountMinor: string, revision: number): DrawerSession {
  const next = mutate(session, revision);
  current(session, actorId);
  const cashSalesMinor = safe(minor(session.cashSalesMinor) + minor(amountMinor, true));
  const updated = { ...session, revision: next, cashSalesMinor };
  expectedCash(updated);
  return updated;
}
export function recordCashMovement(session: DrawerSession, actorId: string, direction: 'in' | 'out',
  amountMinor: string, movementReason: string, revision: number): DrawerSession {
  const next = mutate(session, revision);
  current(session, actorId);
  reason(movementReason, true);
  const amount = minor(amountMinor, true);
  if (direction !== 'in' && direction !== 'out') throw new DrawerError('INVALID_DIRECTION');
  if (direction === 'out' && amount > minor(expectedCash(session))) throw new DrawerError('INSUFFICIENT_CASH');
  const updated = direction === 'in'
    ? { ...session, revision: next, cashInMinor: safe(minor(session.cashInMinor) + amount) }
    : { ...session, revision: next, cashOutMinor: safe(minor(session.cashOutMinor) + amount) };
  expectedCash(updated);
  return updated;
}
export function beginHandover(session: DrawerSession, actorId: string, administrator: boolean,
  recipientId: string, handoverId: string, revision: number): DrawerSession {
  const next = mutate(session, revision);
  if (session.handover) throw new DrawerError('HANDOVER_PENDING');
  if (!administrator && session.custodianId !== actorId) throw new DrawerError('FORBIDDEN');
  if (!recipientId || !handoverId || recipientId === session.custodianId) throw new DrawerError('INVALID_HANDOVER');
  return { ...session, revision: next, handover: { id: handoverId, initiatorId: actorId,
    outgoingId: session.custodianId, recipientId } };
}
export function cancelHandover(session: DrawerSession, actorId: string, administrator: boolean,
  handoverId: string, revision: number): DrawerSession {
  const next = mutate(session, revision);
  if (!session.handover || session.handover.id !== handoverId) throw new DrawerError('INVALID_HANDOVER');
  if (!administrator && session.custodianId !== actorId) throw new DrawerError('FORBIDDEN');
  return { ...session, revision: next, handover: null };
}
export function acceptHandover(session: DrawerSession, actorId: string, handoverId: string,
  countedMinor: string, varianceReason: string | null, revision: number): {
    session: DrawerSession; expectedMinor: string; varianceMinor: string; reason: string | null;
  } {
  const next = mutate(session, revision);
  if (!session.handover || session.handover.id !== handoverId || session.handover.recipientId !== actorId) throw new DrawerError('INVALID_HANDOVER');
  const expectedMinor = expectedCash(session);
  const variance = minor(countedMinor) - minor(expectedMinor);
  const explanation = reason(varianceReason, variance !== 0n);
  return { session: { ...session, revision: next, custodianId: actorId, handover: null },
    expectedMinor, varianceMinor: variance.toString(), reason: explanation };
}
export function closeDrawer(session: DrawerSession, actorId: string, administrator: boolean,
  policy: ClosePolicy, countedMinor: string, varianceReason: string | null, revision: number): DrawerSession {
  const next = mutate(session, revision);
  if (session.handover) throw new DrawerError('HANDOVER_PENDING');
  if (!administrator && !(policy.selfClose && session.custodianId === actorId)
    && !(policy.replacementClose && policy.replacementIds.includes(actorId))) throw new DrawerError('FORBIDDEN');
  const expectedMinor = expectedCash(session);
  const variance = minor(countedMinor) - minor(expectedMinor);
  return { ...session, revision: next, closed: { countedMinor, expectedMinor, varianceMinor: variance.toString(),
    reason: reason(varianceReason, variance !== 0n), actorId } };
}
