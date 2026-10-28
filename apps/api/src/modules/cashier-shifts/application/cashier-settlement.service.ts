import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuthorizedScope } from '../../authentication/public.js';
import { DrawerError, recordCashSale } from '../domain/drawer-session.js';
import { DrawerStore } from './drawer-store.js';

/** Called by Billing only after its own successful-retry lookup, in its authorized transaction. */
@Injectable()
export class CashierSettlementService {
  constructor(private readonly store: DrawerStore) {}

  async attribute(scope: AuthorizedScope, input: { sessionId: string; billId: string; amountMinor: string;
    currencyCode: string; scale: number; occurredAt: string }): Promise<void> {
    const session = await this.store.session(scope.installation, input.sessionId, scope.transaction);
    if (!session) throw new DrawerError('DRAWER_NOT_FOUND');
    if (session.currencyCode !== input.currencyCode || session.scale !== input.scale) throw new DrawerError('CURRENCY_MISMATCH');
    const next = recordCashSale(session, scope.actorId, input.amountMinor, session.revision);
    if (!await this.store.updateSession(scope.installation, next, session.revision, scope.transaction)) throw new DrawerError('STALE_DRAWER');
    await this.store.appendEvent(scope.installation, { id: randomUUID(), sessionId: session.id, kind: 'cash-sale',
      actorId: scope.actorId, occurredAt: input.occurredAt, payload: { billId: input.billId, amountMinor: input.amountMinor } }, scope.transaction);
  }
}
