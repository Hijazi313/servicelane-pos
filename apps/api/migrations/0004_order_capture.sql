CREATE TABLE "captured_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"retry_key" varchar(128) NOT NULL,
	"request" jsonb NOT NULL,
	"snapshot" jsonb NOT NULL,
	CONSTRAINT "captured_order_retry_scope" UNIQUE("business_id","branch_id","retry_key"),
	CONSTRAINT "captured_order_retry_key" CHECK ("captured_orders"."retry_key" ~ '^[A-Za-z0-9_-]{16,128}$'),
	CONSTRAINT "captured_order_snapshot_identity" CHECK (jsonb_typeof("captured_orders"."request") = 'object' and jsonb_typeof("captured_orders"."snapshot") = 'object' and "captured_orders"."snapshot"->>'id' is not null and "captured_orders"."snapshot"->>'state' is not null and "captured_orders"."snapshot"->>'id' = "captured_orders"."id"::text and "captured_orders"."snapshot"->>'state' = 'captured')
);
--> statement-breakpoint
CREATE TABLE "order_capture_policies" (
	"business_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"max_lines" integer NOT NULL,
	"max_quantity" integer NOT NULL,
	CONSTRAINT "order_capture_policies_business_id_pk" PRIMARY KEY("business_id"),
	CONSTRAINT "order_policy_bounds" CHECK ("order_capture_policies"."revision" > 0 and "order_capture_policies"."max_lines" between 1 and 500 and "order_capture_policies"."max_quantity" between 1 and 1000)
);
