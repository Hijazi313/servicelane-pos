import { sql } from 'drizzle-orm';
import { boolean, check, foreignKey, pgTable, primaryKey, unique, uuid, varchar, text } from 'drizzle-orm/pg-core';
// Business/branch ownership is validated through Business's public operation in the same transaction.

export const staffAccounts = pgTable('staff_accounts', {
  id: uuid('id').primaryKey(),
  businessId: uuid('business_id').notNull(),
  username: varchar('username', { length: 64 }).notNull(),
  displayName: varchar('display_name', { length: 120 }).notNull(),
  status: varchar('status', { length: 16 }).notNull(),
  role: varchar('role', { length: 16 }).notNull(),
  passwordChangeRequired: boolean('password_change_required').notNull(),
}, (table) => [
  unique('staff_business_identity').on(table.businessId, table.id),
  unique('staff_business_username').on(table.businessId, table.username),
  check('staff_username_format', sql`${table.username} ~ '^[a-z0-9._-]{3,64}$'`),
  check('staff_display_name_nonempty', sql`length(trim(${table.displayName})) > 0`),
  check('staff_status_values', sql`${table.status} in ('active', 'disabled')`),
  check('staff_role_values', sql`${table.role} in ('administrator', 'staff')`),
]);

export const staffCredentials = pgTable('staff_credentials', {
  accountId: uuid('account_id').primaryKey().references(() => staffAccounts.id),
  passwordHash: text('password_hash').notNull(),
});

export const staffBranchGrants = pgTable('staff_branch_grants', {
  businessId: uuid('business_id').notNull(),
  accountId: uuid('account_id').notNull(),
  branchId: uuid('branch_id').notNull(),
}, (table) => [
  primaryKey({ columns: [table.accountId, table.branchId] }),
  foreignKey({ name: 'grant_staff_ownership', columns: [table.businessId, table.accountId], foreignColumns: [staffAccounts.businessId, staffAccounts.id] }),
]);
