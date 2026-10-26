import { sql } from 'drizzle-orm';
import { check, integer, jsonb, pgTable, primaryKey, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import type { BillView, PolicyView, SettlementRequest } from '../domain/billing.js';

export const billingPolicies = pgTable('billing_policies', {
  businessId: uuid('business_id').primaryKey(),
  revision: integer('revision').notNull(),
  policy: jsonb('policy').$type<PolicyView>().notNull(),
}, table => [check('billing_policy_revision', sql`${table.revision} > 0 and ${table.policy}->>'revision' = ${table.revision}::text`)]);

export const billingPolicyHistory = pgTable('billing_policy_history', {
  businessId: uuid('business_id').notNull(), revision: integer('revision').notNull(),
  previous: jsonb('previous').$type<PolicyView>().notNull(), next: jsonb('next').$type<PolicyView>().notNull(),
  actorId: uuid('actor_id').notNull(), changedAt: varchar('changed_at', { length: 24 }).notNull(),
  configurationNote: varchar('configuration_note', { length: 500 }).notNull(),
}, table => [primaryKey({ columns: [table.businessId, table.revision] }),
  check('billing_history_revision', sql`${table.revision} > 0 and ${table.next}->>'revision' = ${table.revision}::text and (${table.previous}->>'revision')::integer = ${table.revision} - 1`)]);

// One immutable aggregate owns the singular full-cash payment and successful retry.
export const billingSettlements = pgTable('billing_settlements', {
  id: uuid('id').primaryKey(), businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(),
  orderId: uuid('order_id').notNull(), retryKey: uuid('retry_key').notNull(), actorId: uuid('actor_id').notNull(),
  bill: jsonb('bill').$type<BillView>().notNull(), request: jsonb('request').$type<SettlementRequest>().notNull(),
}, table => [unique('billing_order_scope').on(table.businessId, table.branchId, table.orderId),
  unique('billing_retry_scope').on(table.businessId, table.branchId, table.retryKey),
  check('billing_settlement_identity', sql`jsonb_typeof(${table.bill}) = 'object' and jsonb_typeof(${table.request}) = 'object' and ${table.bill}->>'id' is not null and ${table.bill}->>'id' = ${table.id}::text and ${table.bill}->>'orderId' is not null and ${table.bill}->>'orderId' = ${table.orderId}::text and ${table.request}->>'orderId' = ${table.orderId}::text and ${table.request}->>'retryKey' = ${table.retryKey}::text`),
  check('billing_cash_full_positive', sql`${table.bill}->'payment'->>'method' is not null and ${table.bill}->'payment'->>'method' = 'cash' and ${table.bill}->>'payableMinor' ~ '^[1-9][0-9]{0,23}$' and ${table.bill}->'payment'->>'amountMinor' is not null and ${table.bill}->'payment'->>'amountMinor' = ${table.bill}->>'payableMinor'`),
]);
