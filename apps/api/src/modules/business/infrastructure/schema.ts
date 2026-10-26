import { sql } from 'drizzle-orm';
import { check, foreignKey, integer, jsonb, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  timezone: varchar('timezone', { length: 100 }).notNull(),
}, (table) => [
  check('business_name_nonempty', sql`length(trim(${table.name})) > 0`),
  check('business_currency_format', sql`${table.currencyCode} ~ '^[A-Z]{3}$'`),
]);

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  name: varchar('name', { length: 120 }).notNull(),
  address: varchar('address', { length: 500 }),
  displayRevision: integer('display_revision').notNull().default(0),
}, (table) => [
  unique('branch_business_identity').on(table.businessId, table.id),
  check('branch_display_revision_nonnegative', sql`${table.displayRevision} >= 0`),
  check('branch_name_nonempty', sql`length(trim(${table.name})) > 0`),
]);

export const installationBinding = pgTable('installation_binding', {
  singleton: integer('singleton').primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  branchId: uuid('branch_id').notNull(),
}, (table) => [
  check('installation_singleton', sql`${table.singleton} = 1`),
  foreignKey({ name: 'installation_branch_ownership', columns: [table.businessId, table.branchId], foreignColumns: [branches.businessId, branches.id] }),
]);

export const businessDisplayHistory = pgTable('business_display_history', {
  id: uuid('id').primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  branchId: uuid('branch_id').notNull(),
  revision: integer('revision').notNull(),
  actorId: uuid('actor_id').notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull(),
  before: jsonb('before').notNull(),
  after: jsonb('after').notNull(),
}, table => [
  unique('business_display_history_revision').on(table.businessId, table.branchId, table.revision),
  foreignKey({ name: 'business_display_history_branch', columns: [table.businessId, table.branchId], foreignColumns: [branches.businessId, branches.id] }),
  check('business_display_history_revision_positive', sql`${table.revision} > 0`),
]);
