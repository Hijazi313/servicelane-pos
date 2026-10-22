import type { TransactionContext } from '../../../infrastructure/database/transaction.js';
import type { OrderPreparation } from '../../orders/public.js';
import type { TicketState } from '../domain/preparation.js';
export interface KitchenScope { businessId: string; branchId: string }
export interface TicketSummary {
  id: string; orderId: string; capturedAt: string; dispatchedAt: string; state: TicketState; revision: number;
}
export interface TicketView extends TicketSummary {
  preparation: OrderPreparation; preparingAt?: string; readyAt?: string;
}
export interface TicketRecord extends TicketView {
  dispatchedBy: string; preparingBy?: string; readyBy?: string;
}
export interface QueueEntry { position: string; summary: TicketSummary }
export abstract class KitchenStore {
  abstract get(scope: KitchenScope, id: string, transaction?: TransactionContext): Promise<TicketRecord | undefined>;
  abstract forOrder(scope: KitchenScope, orderId: string, transaction: TransactionContext): Promise<TicketRecord | undefined>;
  abstract insert(scope: KitchenScope, ticket: TicketRecord, transaction: TransactionContext): Promise<TicketRecord>;
  abstract advance(scope: KitchenScope, id: string, expectedRevision: number, target: 'preparing' | 'ready', actorId: string, at: string, transaction: TransactionContext): Promise<TicketRecord | undefined>;
  abstract maximum(scope: KitchenScope): Promise<string>;
  abstract page(scope: KitchenScope, after: string, fence: string, limit: number): Promise<QueueEntry[]>;
}
export function ticketView(ticket: TicketRecord): TicketView {
  return { id: ticket.id, orderId: ticket.orderId, capturedAt: ticket.capturedAt, dispatchedAt: ticket.dispatchedAt,
    state: ticket.state, revision: ticket.revision, preparation: ticket.preparation,
    ...(ticket.preparingAt ? { preparingAt: ticket.preparingAt } : {}), ...(ticket.readyAt ? { readyAt: ticket.readyAt } : {}) };
}
