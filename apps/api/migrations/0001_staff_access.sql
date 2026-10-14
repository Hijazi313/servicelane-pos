CREATE TABLE "access_limits" (
	"kind" varchar(16) NOT NULL,
	"key" varchar(64) NOT NULL,
	"attempts" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "access_limits_kind_key_pk" PRIMARY KEY("kind","key"),
	CONSTRAINT "limit_kind_values" CHECK ("access_limits"."kind" in ('account', 'source')),
	CONSTRAINT "limit_positive_attempts" CHECK ("access_limits"."attempts" > 0)
);
--> statement-breakpoint
CREATE TABLE "access_prelogins" (
	"digest" varchar(64) PRIMARY KEY NOT NULL,
	"csrf_token" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "prelogin_digest_format" CHECK ("access_prelogins"."digest" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "access_security_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"action" varchar(64) NOT NULL,
	"success" boolean NOT NULL,
	"actor_id" uuid,
	"target_id" uuid,
	"operator" text,
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_sessions" (
	"digest" varchar(64) PRIMARY KEY NOT NULL,
	"business_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"csrf_token" varchar(64) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "session_digest_format" CHECK ("access_sessions"."digest" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "session_activity_order" CHECK ("access_sessions"."last_activity_at" >= "access_sessions"."created_at")
);
--> statement-breakpoint
ALTER TABLE "access_sessions" ADD CONSTRAINT "session_staff_ownership" FOREIGN KEY ("business_id","account_id") REFERENCES "public"."staff_accounts"("business_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "limit_expiry" ON "access_limits" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "prelogin_expiry" ON "access_prelogins" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "security_event_time" ON "access_security_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "session_account" ON "access_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "session_last_activity" ON "access_sessions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "session_created" ON "access_sessions" USING btree ("created_at");