CREATE TYPE "public"."tagging_plan_status" AS ENUM('draft', 'current', 'stale');--> statement-breakpoint
CREATE TYPE "public"."tracking_status" AS ENUM('planned', 'active', 'partial', 'stopped');--> statement-breakpoint
CREATE TABLE "product_trackings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"status" "tracking_status" NOT NULL,
	"scope" text,
	"property_url" text,
	"verified_on" date,
	"note" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "tagging_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"status" "tagging_plan_status" NOT NULL,
	"updated_on" date NOT NULL,
	"note" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "product_trackings" ADD CONSTRAINT "product_trackings_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_trackings" ADD CONSTRAINT "product_trackings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_trackings" ADD CONSTRAINT "product_trackings_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_trackings" ADD CONSTRAINT "product_trackings_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tagging_plans" ADD CONSTRAINT "tagging_plans_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tagging_plans" ADD CONSTRAINT "tagging_plans_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tagging_plans" ADD CONSTRAINT "tagging_plans_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_trackings_domain_id_idx" ON "product_trackings" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "product_trackings_product_id_idx" ON "product_trackings" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_trackings_tool_id_idx" ON "product_trackings" USING btree ("tool_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_trackings_tool_unique" ON "product_trackings" USING btree ("product_id","tool_id") WHERE "product_trackings"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "tagging_plans_domain_id_idx" ON "tagging_plans" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tagging_plans_product_unique" ON "tagging_plans" USING btree ("product_id") WHERE "tagging_plans"."archived_at" is null;