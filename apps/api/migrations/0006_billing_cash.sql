CREATE TABLE "billing_policies" (
	"business_id" uuid PRIMARY KEY NOT NULL,
	"revision" integer NOT NULL,
	"policy" jsonb NOT NULL,
	CONSTRAINT "billing_policy_revision" CHECK ("billing_policies"."revision" > 0 and "billing_policies"."policy"->>'revision' = "billing_policies"."revision"::text)
);
--> statement-breakpoint
CREATE TABLE "billing_policy_history" (
	"business_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"previous" jsonb NOT NULL,
	"next" jsonb NOT NULL,
	"actor_id" uuid NOT NULL,
	"changed_at" varchar(24) NOT NULL,
	"configuration_note" varchar(500) NOT NULL,
	CONSTRAINT "billing_policy_history_business_id_revision_pk" PRIMARY KEY("business_id","revision"),
	CONSTRAINT "billing_history_revision" CHECK ("billing_policy_history"."revision" > 0 and "billing_policy_history"."next"->>'revision' = "billing_policy_history"."revision"::text and ("billing_policy_history"."previous"->>'revision')::integer = "billing_policy_history"."revision" - 1)
);
--> statement-breakpoint
CREATE TABLE "billing_settlements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"retry_key" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"bill" jsonb NOT NULL,
	"request" jsonb NOT NULL,
	CONSTRAINT "billing_order_scope" UNIQUE("business_id","branch_id","order_id"),
	CONSTRAINT "billing_retry_scope" UNIQUE("business_id","branch_id","retry_key"),
	CONSTRAINT "billing_settlement_identity" CHECK (jsonb_typeof("billing_settlements"."bill") = 'object' and jsonb_typeof("billing_settlements"."request") = 'object' and "billing_settlements"."bill"->>'id' is not null and "billing_settlements"."bill"->>'id' = "billing_settlements"."id"::text and "billing_settlements"."bill"->>'orderId' is not null and "billing_settlements"."bill"->>'orderId' = "billing_settlements"."order_id"::text and "billing_settlements"."request"->>'orderId' = "billing_settlements"."order_id"::text and "billing_settlements"."request"->>'retryKey' = "billing_settlements"."retry_key"::text),
	CONSTRAINT "billing_cash_full_positive" CHECK ("billing_settlements"."bill"->'payment'->>'method' is not null and "billing_settlements"."bill"->'payment'->>'method' = 'cash' and "billing_settlements"."bill"->>'payableMinor' ~ '^[1-9][0-9]{0,23}$' and "billing_settlements"."bill"->'payment'->>'amountMinor' is not null and "billing_settlements"."bill"->'payment'->>'amountMinor' = "billing_settlements"."bill"->>'payableMinor')
);
--> statement-breakpoint
CREATE TABLE "business_display_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"actor_id" uuid NOT NULL,
	"changed_at" timestamp with time zone NOT NULL,
	"before" jsonb NOT NULL,
	"after" jsonb NOT NULL,
	CONSTRAINT "business_display_history_revision" UNIQUE("business_id","branch_id","revision"),
	CONSTRAINT "business_display_history_revision_positive" CHECK ("business_display_history"."revision" > 0)
);
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "display_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "business_display_history" ADD CONSTRAINT "business_display_history_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_display_history" ADD CONSTRAINT "business_display_history_branch" FOREIGN KEY ("business_id","branch_id") REFERENCES "public"."branches"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branch_display_revision_nonnegative" CHECK ("branches"."display_revision" >= 0);