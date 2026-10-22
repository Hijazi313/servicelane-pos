import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccessService, type Proof } from '../../authentication/public.js';
import { OrderPreparationService } from '../../orders/public.js';
import { KitchenStore, ticketView, type KitchenScope, type TicketRecord, type TicketSummary } from './kitchen-store.js';
import { KitchenError, identifier, object, queueRequest, transition, TICKET_RESPONSE_BYTES } from '../domain/preparation.js';

export function ticketFits(ticket: TicketRecord): boolean {
  // Reserve both future timestamps; provenance is persisted but not exposed over HTTP.
  return Buffer.byteLength(JSON.stringify({ ...ticketView(ticket), state: 'ready', revision: 2,
    preparingAt: '9999-12-31T23:59:59.999Z', readyAt: '9999-12-31T23:59:59.999Z' }), 'utf8') <= TICKET_RESPONSE_BYTES;
}
@Injectable()
export class KitchenService {
  constructor(private readonly access: AccessService, private readonly orders: OrderPreparationService, private readonly store: KitchenStore) {}
  private async storage<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); } catch (error) {
      if (error instanceof KitchenError) throw error;
      throw new KitchenError('KITCHEN_UNAVAILABLE');
    }
  }
  private async context(proof: Proof): Promise<KitchenScope> {
    const context = await this.access.me(proof, true);
    if (!('business' in context)) throw new KitchenError('KITCHEN_UNAVAILABLE');
    return { businessId: context.businessId, branchId: context.branchId };
  }
  async dispatch(proof: Proof, value: unknown) {
    const row = object(value, ['orderId']), orderId = identifier(row.orderId);
    return this.access.runAuthorized(proof, 'staff', scope => this.storage(async () => {
      const existing = await this.store.forOrder(scope.installation, orderId, scope.transaction);
      if (existing) return ticketView(existing);
      const preparation = await this.orders.get(scope, orderId);
      if (!preparation) throw new KitchenError('ORDER_NOT_FOUND');
      const ticket: TicketRecord = { id: randomUUID(), orderId, capturedAt: preparation.capturedAt,
        dispatchedAt: new Date().toISOString(), dispatchedBy: scope.actorId, state: 'queued', revision: 0, preparation };
      if (!ticketFits(ticket)) throw new KitchenError('TICKET_CAPACITY');
      return ticketView(await this.store.insert(scope.installation, ticket, scope.transaction));
    }));
  }
  async get(proof: Proof, value: unknown) {
    const id = identifier(value), scope = await this.context(proof);
    return this.storage(async () => {
      const ticket = await this.store.get(scope, id);
      if (!ticket) throw new KitchenError('TICKET_NOT_FOUND');
      return ticketView(ticket);
    });
  }
  async advance(proof: Proof, value: unknown, body: unknown) {
    const id = identifier(value), { target, expectedRevision } = transition(body);
    return this.access.runAuthorized(proof, 'staff', scope => this.storage(async () => {
      const current = await this.store.get(scope.installation, id, scope.transaction);
      if (!current) throw new KitchenError('TICKET_NOT_FOUND');
      if (current.state === target && current.revision === expectedRevision + 1) return ticketView(current);
      const allowed = current.revision === expectedRevision && ((current.state === 'queued' && target === 'preparing') || (current.state === 'preparing' && target === 'ready'));
      if (!allowed) throw new KitchenError('STALE_TICKET', { state: current.state, revision: current.revision });
      const updated = await this.store.advance(scope.installation, id, expectedRevision, target, scope.actorId, new Date().toISOString(), scope.transaction);
      if (!updated) throw new KitchenError('STALE_TICKET', { state: current.state, revision: current.revision });
      return ticketView(updated);
    }));
  }
  async list(proof: Proof, value: unknown): Promise<{ tickets: TicketSummary[]; nextCursor?: string }> {
    const request = queueRequest(value), scope = await this.context(proof);
    return this.storage(async () => {
      const maximum = await this.store.maximum(scope), fence = request.fence ?? maximum;
      if (BigInt(fence) > BigInt(maximum)) throw new KitchenError('INVALID_KITCHEN_INPUT');
      const rows = await this.store.page(scope, request.after, fence, request.limit + 1);
      const visible = rows.slice(0, request.limit), last = visible.at(-1);
      return { tickets: visible.map(row => row.summary), ...(rows.length > request.limit && last ? { nextCursor: `${last.position}:${fence}` } : {}) };
    });
  }
}
