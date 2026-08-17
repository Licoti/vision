CREATE TYPE "public"."person_availability" AS ENUM('available', 'partial', 'unavailable');--> statement-breakpoint
CREATE TABLE "person_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "person_skills_person_skill_unique" UNIQUE("person_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "skill_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"label" text NOT NULL,
	"rank" smallint NOT NULL,
	"position" numeric(10, 2) DEFAULT '0' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" numeric(10, 2) DEFAULT '0' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "availability" "person_availability";--> statement-breakpoint
ALTER TABLE "person_skills" ADD CONSTRAINT "person_skills_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_skills" ADD CONSTRAINT "person_skills_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_skills" ADD CONSTRAINT "person_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_skills" ADD CONSTRAINT "person_skills_level_id_skill_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."skill_levels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_skills" ADD CONSTRAINT "person_skills_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_levels" ADD CONSTRAINT "skill_levels_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_levels" ADD CONSTRAINT "skill_levels_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "person_skills_domain_id_idx" ON "person_skills" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "person_skills_person_id_idx" ON "person_skills" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "person_skills_skill_id_idx" ON "person_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_levels_domain_id_idx" ON "skill_levels" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "skills_domain_id_idx" ON "skills" USING btree ("domain_id");--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_availability_requires_center" CHECK ("persons"."availability" is null or "persons"."kind" = 'center');