CREATE TABLE "context_markers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"project_id" uuid,
	"happened_on" date NOT NULL,
	"label" text NOT NULL,
	"note" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "context_markers" ADD CONSTRAINT "context_markers_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_markers" ADD CONSTRAINT "context_markers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_markers" ADD CONSTRAINT "context_markers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_markers" ADD CONSTRAINT "context_markers_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "context_markers_domain_id_idx" ON "context_markers" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "context_markers_product_id_idx" ON "context_markers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "context_markers_project_id_idx" ON "context_markers" USING btree ("project_id");