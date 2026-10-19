import { sql } from 'drizzle-orm';
import { check, integer, jsonb, pgTable, primaryKey, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import type { CaptureRequest, OrderSnapshot } from '../application/order-store.js';
export const capturedOrders = pgTable('captured_orders', {
  id: uuid('id').primaryKey(), businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(),
  retryKey: varchar('retry_key', { length: 128 }).notNull(), request: jsonb('request').$type<CaptureRequest>().notNull(),
  snapshot: jsonb('snapshot').$type<OrderSnapshot>().notNull(),
}, table => [unique('captured_order_retry_scope').on(table.businessId, table.branchId, table.retryKey),
  check('captured_order_retry_key', sql`${table.retryKey} ~ '^[A-Za-z0-9_-]{16,128}$'`),
  check('captured_order_snapshot_identity', sql`jsonb_typeof(${table.request}) = 'object' and jsonb_typeof(${table.snapshot}) = 'object' and ${table.snapshot}->>'id' is not null and ${table.snapshot}->>'state' is not null and ${table.snapshot}->>'id' = ${table.id}::text and ${table.snapshot}->>'state' = 'captured'`),
]);
export const orderCapturePolicies = pgTable('order_capture_policies', {
  businessId: uuid('business_id').notNull(), revision: integer('revision').notNull(),
  maxLines: integer('max_lines').notNull(), maxQuantity: integer('max_quantity').notNull(),
}, table => [primaryKey({ columns: [table.businessId] }),
  check('order_policy_bounds', sql`${table.revision} > 0 and ${table.maxLines} between 1 and 500 and ${table.maxQuantity} between 1 and 1000`),
]);
