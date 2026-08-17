ALTER TABLE "indicators" ADD COLUMN "is_north_star" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "target_value" numeric(18, 4);--> statement-breakpoint
CREATE UNIQUE INDEX "indicators_north_star_unique" ON "indicators" USING btree ("product_id") WHERE "indicators"."is_north_star" and "indicators"."archived_at" is null;