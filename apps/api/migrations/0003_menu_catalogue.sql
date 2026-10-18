CREATE TABLE "menu_offerings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"scale" integer NOT NULL,
	CONSTRAINT "menu_offering_ownership" UNIQUE("business_id","id"),
	CONSTRAINT "menu_positive_revision" CHECK ("menu_offerings"."revision" > 0),
	CONSTRAINT "menu_currency_scale" CHECK ("menu_offerings"."scale" between 0 and 4 and "menu_offerings"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "menu_definition_identity" CHECK (jsonb_typeof("menu_offerings"."definition") = 'object' and ("menu_offerings"."definition"->>'id') = "menu_offerings"."id"::text and ("menu_offerings"."definition"->>'revision')::integer = "menu_offerings"."revision" and ("menu_offerings"."definition"->>'currencyCode') = "menu_offerings"."currency_code" and ("menu_offerings"."definition"->>'scale')::integer = "menu_offerings"."scale")
);
--> statement-breakpoint
CREATE TABLE "menu_references" (
	"business_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	CONSTRAINT "menu_references_business_id_offering_id_variant_id_pk" PRIMARY KEY("business_id","offering_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "menu_variants" (
	"business_id" uuid NOT NULL,
	"id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	CONSTRAINT "menu_variants_business_id_id_pk" PRIMARY KEY("business_id","id")
);
--> statement-breakpoint
ALTER TABLE "menu_references" ADD CONSTRAINT "menu_reference_owner" FOREIGN KEY ("business_id","offering_id") REFERENCES "public"."menu_offerings"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_references" ADD CONSTRAINT "menu_reference_variant" FOREIGN KEY ("business_id","variant_id") REFERENCES "public"."menu_variants"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_variants" ADD CONSTRAINT "menu_variant_owner" FOREIGN KEY ("business_id","offering_id") REFERENCES "public"."menu_offerings"("business_id","id") ON DELETE no action ON UPDATE no action;