CREATE TYPE "public"."persona_kind" AS ENUM('primary', 'secondary');--> statement-breakpoint
CREATE TYPE "public"."persona_trait_kind" AS ENUM('goal', 'pain', 'expectation');--> statement-breakpoint
CREATE TABLE "persona_traits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"kind" "persona_trait_kind" NOT NULL,
	"label" text NOT NULL,
	"position" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"summary" text,
	"image_url" text,
	"kind" "persona_kind" DEFAULT 'secondary' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "persona_traits" ADD CONSTRAINT "persona_traits_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_traits" ADD CONSTRAINT "persona_traits_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_traits" ADD CONSTRAINT "persona_traits_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persona_traits_domain_id_idx" ON "persona_traits" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "persona_traits_persona_id_idx" ON "persona_traits" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "personas_domain_id_idx" ON "personas" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "personas_product_id_idx" ON "personas" USING btree ("product_id");