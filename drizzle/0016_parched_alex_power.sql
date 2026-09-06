CREATE TYPE "public"."identity_provider" AS ENUM('google', 'microsoft');--> statement-breakpoint
CREATE TABLE "domain_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"provider" "identity_provider" NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "domain_identities_provider_value_unique" UNIQUE("provider","value")
);
--> statement-breakpoint
CREATE TABLE "super_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"identity_provider" "identity_provider",
	"external_id" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "super_admins_provider_requires_external_id" CHECK (("super_admins"."identity_provider" is null) or ("super_admins"."external_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "identity_provider" "identity_provider";--> statement-breakpoint
ALTER TABLE "domain_identities" ADD CONSTRAINT "domain_identities_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domain_identities_domain_id_idx" ON "domain_identities" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "super_admins_email_unique" ON "super_admins" USING btree (lower("email"));--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_identity_provider_requires_external_id" CHECK (("persons"."identity_provider" is null) or ("persons"."external_id" is not null));