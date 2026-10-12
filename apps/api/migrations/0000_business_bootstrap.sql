CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"address" varchar(500),
	CONSTRAINT "branch_business_identity" UNIQUE("business_id","id"),
	CONSTRAINT "branch_name_nonempty" CHECK (length(trim("branches"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"timezone" varchar(100) NOT NULL,
	CONSTRAINT "business_name_nonempty" CHECK (length(trim("businesses"."name")) > 0),
	CONSTRAINT "business_currency_format" CHECK ("businesses"."currency_code" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "installation_binding" (
	"singleton" integer PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	CONSTRAINT "installation_singleton" CHECK ("installation_binding"."singleton" = 1)
);
--> statement-breakpoint
CREATE TABLE "staff_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"username" varchar(64) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"status" varchar(16) NOT NULL,
	"role" varchar(16) NOT NULL,
	"password_change_required" boolean NOT NULL,
	CONSTRAINT "staff_business_identity" UNIQUE("business_id","id"),
	CONSTRAINT "staff_business_username" UNIQUE("business_id","username"),
	CONSTRAINT "staff_username_format" CHECK ("staff_accounts"."username" ~ '^[a-z0-9._-]{3,64}$'),
	CONSTRAINT "staff_display_name_nonempty" CHECK (length(trim("staff_accounts"."display_name")) > 0),
	CONSTRAINT "staff_status_values" CHECK ("staff_accounts"."status" in ('active', 'disabled')),
	CONSTRAINT "staff_role_values" CHECK ("staff_accounts"."role" in ('administrator', 'staff'))
);
--> statement-breakpoint
CREATE TABLE "staff_branch_grants" (
	"business_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	CONSTRAINT "staff_branch_grants_account_id_branch_id_pk" PRIMARY KEY("account_id","branch_id")
);
--> statement-breakpoint
CREATE TABLE "staff_credentials" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installation_binding" ADD CONSTRAINT "installation_binding_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installation_binding" ADD CONSTRAINT "installation_branch_ownership" FOREIGN KEY ("business_id","branch_id") REFERENCES "public"."branches"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_branch_grants" ADD CONSTRAINT "grant_staff_ownership" FOREIGN KEY ("business_id","account_id") REFERENCES "public"."staff_accounts"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_credentials" ADD CONSTRAINT "staff_credentials_account_id_staff_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."staff_accounts"("id") ON DELETE no action ON UPDATE no action;