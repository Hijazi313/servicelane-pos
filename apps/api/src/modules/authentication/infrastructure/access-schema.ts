import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { staffAccounts } from "./schema.js";

export const accessSessions = pgTable(
  "access_sessions",
  {
    digest: varchar("digest", { length: 64 }).primaryKey(),
    businessId: uuid("business_id").notNull(),
    accountId: uuid("account_id").notNull(),
    csrfToken: varchar("csrf_token", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    lastActivityAt: timestamp("last_activity_at", {
      withTimezone: true,
    }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "session_staff_ownership",
      columns: [table.businessId, table.accountId],
      foreignColumns: [staffAccounts.businessId, staffAccounts.id],
    }),
    index("session_account").on(table.accountId),
    index("session_last_activity").on(table.lastActivityAt),
    index("session_created").on(table.createdAt),
    check("session_digest_format", sql`${table.digest} ~ '^[a-f0-9]{64}$'`),
    check(
      "session_activity_order",
      sql`${table.lastActivityAt} >= ${table.createdAt}`,
    ),
  ],
);
export const accessPrelogins = pgTable(
  "access_prelogins",
  {
    digest: varchar("digest", { length: 64 }).primaryKey(),
    csrfToken: varchar("csrf_token", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("prelogin_expiry").on(table.expiresAt),
    check("prelogin_digest_format", sql`${table.digest} ~ '^[a-f0-9]{64}$'`),
  ],
);
export const accessLimits = pgTable(
  "access_limits",
  {
    kind: varchar("kind", { length: 16 })
      .$type<"account" | "source">()
      .notNull(),
    key: varchar("key", { length: 64 }).notNull(),
    attempts: integer("attempts").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.kind, table.key] }),
    index("limit_expiry").on(table.expiresAt),
    check("limit_kind_values", sql`${table.kind} in ('account', 'source')`),
    check("limit_positive_attempts", sql`${table.attempts} > 0`),
  ],
);
export const accessSecurityEvents = pgTable(
  "access_security_events",
  {
    id: uuid("id").primaryKey(),
    action: varchar("action", { length: 64 }).notNull(),
    success: boolean("success").notNull(),
    actorId: uuid("actor_id"),
    targetId: uuid("target_id"),
    operator: text("operator"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("security_event_time").on(table.occurredAt)],
);
