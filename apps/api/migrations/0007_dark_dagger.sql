CREATE TABLE "cash_drawer_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"kind" varchar(32) NOT NULL,
	"actor_id" uuid NOT NULL,
	"occurred_at" varchar(24) NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "cash_event_payload_object" CHECK (jsonb_typeof("cash_drawer_events"."payload") = 'object'),
	CONSTRAINT "cash_sale_bill_identity" CHECK (("cash_drawer_events"."kind" <> 'cash-sale' or ("cash_drawer_events"."payload"->>'billId' is not null and "cash_drawer_events"."payload"->>'billId' <> '')))
);
--> statement-breakpoint
CREATE TABLE "cash_drawer_policies" (
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"self_close" boolean NOT NULL,
	"replacement_close" boolean NOT NULL,
	"replacement_ids" jsonb NOT NULL,
	CONSTRAINT "cash_drawer_policies_business_id_branch_id_pk" PRIMARY KEY("business_id","branch_id"),
	CONSTRAINT "cash_policy_revision" CHECK ("cash_drawer_policies"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "cash_drawer_policy_history" (
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"previous" jsonb,
	"next" jsonb NOT NULL,
	"actor_id" uuid NOT NULL,
	"changed_at" varchar(24) NOT NULL,
	"note" varchar(500) NOT NULL,
	CONSTRAINT "cash_drawer_policy_history_business_id_branch_id_revision_pk" PRIMARY KEY("business_id","branch_id","revision"),
	CONSTRAINT "cash_policy_history_revision" CHECK ("cash_drawer_policy_history"."revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "cash_drawer_retries" (
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"operation" varchar(32) NOT NULL,
	"retry_key" uuid NOT NULL,
	"request" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	CONSTRAINT "cash_drawer_retries_business_id_branch_id_operation_retry_key_pk" PRIMARY KEY("business_id","branch_id","operation","retry_key")
);
--> statement-breakpoint
CREATE TABLE "cash_drawer_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"drawer_id" uuid NOT NULL,
	"custodian_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"open" boolean NOT NULL,
	"state" jsonb NOT NULL,
	CONSTRAINT "cash_session_identity_scope" UNIQUE("business_id","branch_id","id"),
	CONSTRAINT "cash_session_identity" CHECK ((jsonb_typeof("cash_drawer_sessions"."state") = 'object' and "cash_drawer_sessions"."state"->>'id' = "cash_drawer_sessions"."id"::text and "cash_drawer_sessions"."state"->>'drawerId' = "cash_drawer_sessions"."drawer_id"::text and "cash_drawer_sessions"."state"->>'custodianId' = "cash_drawer_sessions"."custodian_id"::text and ("cash_drawer_sessions"."state"->>'revision')::integer = "cash_drawer_sessions"."revision" and (("cash_drawer_sessions"."state"->'closed') = 'null'::jsonb) = "cash_drawer_sessions"."open") is true)
);
--> statement-breakpoint
CREATE TABLE "cash_drawers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"label" varchar(120) NOT NULL,
	CONSTRAINT "cash_drawer_label_scope" UNIQUE("business_id","branch_id","label"),
	CONSTRAINT "cash_drawer_identity_scope" UNIQUE("business_id","branch_id","id")
);
--> statement-breakpoint
ALTER TABLE "cash_drawer_events" ADD CONSTRAINT "cash_event_session_scope" FOREIGN KEY ("business_id","branch_id","session_id") REFERENCES "public"."cash_drawer_sessions"("business_id","branch_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_drawer_sessions" ADD CONSTRAINT "cash_session_drawer_scope" FOREIGN KEY ("business_id","branch_id","drawer_id") REFERENCES "public"."cash_drawers"("business_id","branch_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cash_sale_bill_scope" ON "cash_drawer_events" USING btree ("business_id","branch_id",("payload"->>'billId')) WHERE "cash_drawer_events"."kind" = 'cash-sale';--> statement-breakpoint
CREATE UNIQUE INDEX "cash_drawer_one_open" ON "cash_drawer_sessions" USING btree ("business_id","branch_id","drawer_id") WHERE "cash_drawer_sessions"."open";--> statement-breakpoint
CREATE UNIQUE INDEX "cash_custodian_one_open" ON "cash_drawer_sessions" USING btree ("business_id","branch_id","custodian_id") WHERE "cash_drawer_sessions"."open";