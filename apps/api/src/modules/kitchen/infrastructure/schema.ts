import { sql } from 'drizzle-orm';
import { bigserial, check, integer, jsonb, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import type { OrderPreparation } from '../../orders/public.js';
import type { TicketState } from '../domain/preparation.js';
export const kitchenTickets = pgTable('kitchen_tickets', {
  id: uuid('id').primaryKey(), businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(), orderId: uuid('order_id').notNull(),
  position: bigserial('position', { mode: 'bigint' }).notNull(), preparation: jsonb('preparation').$type<OrderPreparation>().notNull(),
  state: varchar('state', { length: 16 }).$type<TicketState>().notNull(), revision: integer('revision').notNull(),
  dispatchedAt: varchar('dispatched_at', { length: 24 }).notNull(), dispatchedBy: uuid('dispatched_by').notNull(),
  preparingAt: varchar('preparing_at', { length: 24 }), preparingBy: uuid('preparing_by'),
  readyAt: varchar('ready_at', { length: 24 }), readyBy: uuid('ready_by'),
}, table => [
  unique('kitchen_order_scope').on(table.businessId, table.branchId, table.orderId),
  unique('kitchen_position_scope').on(table.businessId, table.branchId, table.position),
  check('kitchen_state_revision', sql`(${table.state} = 'queued' and ${table.revision} = 0 and ${table.preparingAt} is null and ${table.preparingBy} is null and ${table.readyAt} is null and ${table.readyBy} is null) or (${table.state} = 'preparing' and ${table.revision} = 1 and ${table.preparingAt} is not null and ${table.preparingBy} is not null and ${table.readyAt} is null and ${table.readyBy} is null) or (${table.state} = 'ready' and ${table.revision} = 2 and ${table.preparingAt} is not null and ${table.preparingBy} is not null and ${table.readyAt} is not null and ${table.readyBy} is not null)`),
  check('kitchen_preparation_identity', sql`jsonb_typeof(${table.preparation}) = 'object' and ${table.preparation}->>'orderId' is not null and ${table.preparation}->>'orderId' = ${table.orderId}::text`),
]);
