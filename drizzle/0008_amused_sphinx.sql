CREATE TYPE "public"."starter_kind" AS ENUM('tool', 'method', 'resource');--> statement-breakpoint
CREATE TABLE "starters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"label" text NOT NULL,
	"summary" text NOT NULL,
	"guidance" text,
	"kind" "starter_kind" NOT NULL,
	"tool_id" uuid,
	"position" numeric(10, 2) DEFAULT '0' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "starters" ADD CONSTRAINT "starters_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "starters" ADD CONSTRAINT "starters_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "starters" ADD CONSTRAINT "starters_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "starters_domain_id_idx" ON "starters" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "starters_tool_id_idx" ON "starters" USING btree ("tool_id");