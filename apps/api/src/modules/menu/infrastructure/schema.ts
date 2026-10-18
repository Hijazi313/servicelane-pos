import { sql } from 'drizzle-orm';
import { check, foreignKey, integer, jsonb, pgTable, primaryKey, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import type { Offering } from '../domain/catalogue.js';
export const menuOfferings = pgTable('menu_offerings', {
  id: uuid('id').primaryKey(), businessId: uuid('business_id').notNull(),
  revision: integer('revision').notNull(), definition: jsonb('definition').$type<Offering>().notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull(), scale: integer('scale').notNull(),
}, table => [
  unique('menu_offering_ownership').on(table.businessId, table.id),
  check('menu_positive_revision', sql`${table.revision} > 0`),
  check('menu_currency_scale', sql`${table.scale} between 0 and 4 and ${table.currencyCode} ~ '^[A-Z]{3}$'`),
  check('menu_definition_identity', sql`jsonb_typeof(${table.definition}) = 'object' and (${table.definition}->>'id') = ${table.id}::text and (${table.definition}->>'revision')::integer = ${table.revision} and (${table.definition}->>'currencyCode') = ${table.currencyCode} and (${table.definition}->>'scale')::integer = ${table.scale}`),
]);
export const menuVariants = pgTable('menu_variants', {
  businessId: uuid('business_id').notNull(), id: uuid('id').notNull(), offeringId: uuid('offering_id').notNull(),
}, table => [
  primaryKey({ columns: [table.businessId, table.id] }),
  foreignKey({ name: 'menu_variant_owner', columns: [table.businessId, table.offeringId], foreignColumns: [menuOfferings.businessId, menuOfferings.id] }),
]);
export const menuReferences = pgTable('menu_references', {
  businessId: uuid('business_id').notNull(), offeringId: uuid('offering_id').notNull(), variantId: uuid('variant_id').notNull(),
}, table => [
  primaryKey({ columns: [table.businessId, table.offeringId, table.variantId] }),
  foreignKey({ name: 'menu_reference_owner', columns: [table.businessId, table.offeringId], foreignColumns: [menuOfferings.businessId, menuOfferings.id] }),
  foreignKey({ name: 'menu_reference_variant', columns: [table.businessId, table.variantId], foreignColumns: [menuVariants.businessId, menuVariants.id] }),
]);
