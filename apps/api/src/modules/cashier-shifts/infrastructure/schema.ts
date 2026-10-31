import { sql } from 'drizzle-orm';
import { boolean, check, foreignKey, integer, jsonb, pgTable, primaryKey, unique, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import type { DrawerSession } from '../domain/drawer-session.js';

export const cashDrawers = pgTable('cash_drawers', {
  id: uuid('id').primaryKey(), businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(),
  label: varchar('label', { length: 120 }).notNull(),
}, table => [unique('cash_drawer_label_scope').on(table.businessId, table.branchId, table.label),
  unique('cash_drawer_identity_scope').on(table.businessId, table.branchId, table.id)]);

export const cashDrawerSessions = pgTable('cash_drawer_sessions', {
  id: uuid('id').primaryKey(), businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(),
  drawerId: uuid('drawer_id').notNull(), custodianId: uuid('custodian_id').notNull(),
  revision: integer('revision').notNull(), open: boolean('open').notNull(),
  state: jsonb('state').$type<DrawerSession>().notNull(),
}, table => [
  uniqueIndex('cash_drawer_one_open').on(table.businessId, table.branchId, table.drawerId).where(sql`${table.open}`),
  uniqueIndex('cash_custodian_one_open').on(table.businessId, table.branchId, table.custodianId).where(sql`${table.open}`),
  unique('cash_session_identity_scope').on(table.businessId, table.branchId, table.id),
  foreignKey({ name: 'cash_session_drawer_scope', columns: [table.businessId, table.branchId, table.drawerId], foreignColumns: [cashDrawers.businessId, cashDrawers.branchId, cashDrawers.id] }),
  check('cash_session_identity', sql`(jsonb_typeof(${table.state}) = 'object' and ${table.state}->>'id' = ${table.id}::text and ${table.state}->>'drawerId' = ${table.drawerId}::text and ${table.state}->>'custodianId' = ${table.custodianId}::text and (${table.state}->>'revision')::integer = ${table.revision} and ((${table.state}->'closed') = 'null'::jsonb) = ${table.open}) is true`),
]);

export const cashDrawerPolicies = pgTable('cash_drawer_policies', {
  businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(), revision: integer('revision').notNull(),
  selfClose: boolean('self_close').notNull(), replacementClose: boolean('replacement_close').notNull(),
  replacementIds: jsonb('replacement_ids').$type<string[]>().notNull(),
}, table => [primaryKey({ columns: [table.businessId, table.branchId] }), check('cash_policy_revision', sql`${table.revision} >= 0`)]);

export const cashDrawerPolicyHistory = pgTable('cash_drawer_policy_history', {
  businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(), revision: integer('revision').notNull(),
  previous: jsonb('previous').$type<import('../application/drawer-store.js').DrawerPolicy | null>(),
  next: jsonb('next').$type<import('../application/drawer-store.js').DrawerPolicy>().notNull(),
  actorId: uuid('actor_id').notNull(), changedAt: varchar('changed_at', { length: 24 }).notNull(),
  note: varchar('note', { length: 500 }).notNull(),
}, table => [primaryKey({ columns: [table.businessId, table.branchId, table.revision] }),
  check('cash_policy_history_revision', sql`${table.revision} > 0`)]);

export const cashDrawerEvents = pgTable('cash_drawer_events', {
  id: uuid('id').primaryKey(), businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(),
  sessionId: uuid('session_id').notNull(), kind: varchar('kind', { length: 32 }).notNull(), actorId: uuid('actor_id').notNull(),
  occurredAt: varchar('occurred_at', { length: 24 }).notNull(), payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
}, table => [
  foreignKey({ name: 'cash_event_session_scope', columns: [table.businessId, table.branchId, table.sessionId], foreignColumns: [cashDrawerSessions.businessId, cashDrawerSessions.branchId, cashDrawerSessions.id] }),
  check('cash_event_payload_object', sql`jsonb_typeof(${table.payload}) = 'object'`),
  check('cash_sale_bill_identity', sql`(${table.kind} <> 'cash-sale' or (${table.payload}->>'billId' is not null and ${table.payload}->>'billId' <> ''))`),
  uniqueIndex('cash_sale_bill_scope').on(table.businessId, table.branchId, sql`(${table.payload}->>'billId')`).where(sql`${table.kind} = 'cash-sale'`),
]);

export const cashDrawerRetries = pgTable('cash_drawer_retries', {
  businessId: uuid('business_id').notNull(), branchId: uuid('branch_id').notNull(), operation: varchar('operation', { length: 32 }).notNull(),
  retryKey: uuid('retry_key').notNull(), request: jsonb('request').$type<Record<string, unknown>>().notNull(),
  result: jsonb('result').$type<Record<string, unknown>>().notNull(),
}, table => [primaryKey({ columns: [table.businessId, table.branchId, table.operation, table.retryKey] })]);
