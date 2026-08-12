CREATE TYPE "public"."activity_family" AS ENUM('framing', 'research', 'design', 'evaluation', 'measurement', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."activity_state" AS ENUM('planned', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."budget_unit" AS ENUM('days');--> statement-breakpoint
CREATE TYPE "public"."domain_role" AS ENUM('domain_manager', 'member');--> statement-breakpoint
CREATE TYPE "public"."domain_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."event_target_type" AS ENUM('project', 'activity', 'resource', 'result', 'indicator_reading', 'member');--> statement-breakpoint
CREATE TYPE "public"."event_verb" AS ENUM('created', 'updated', 'state_changed', 'linked', 'archived');--> statement-breakpoint
CREATE TYPE "public"."indicator_direction" AS ENUM('higher_is_better', 'lower_is_better');--> statement-breakpoint
CREATE TYPE "public"."person_kind" AS ENUM('center', 'stakeholder');--> statement-breakpoint
CREATE TYPE "public"."person_source" AS ENUM('directory', 'manual');--> statement-breakpoint
CREATE TYPE "public"."product_kind" AS ENUM('product', 'internal');--> statement-breakpoint
CREATE TYPE "public"."project_status_nature" AS ENUM('framing', 'active', 'paused', 'done');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('powerpoint', 'word', 'excel', 'pdf', 'figma', 'sharepoint', 'link');--> statement-breakpoint
CREATE TYPE "public"."sync_mode" AS ENUM('manual', 'api');--> statement-breakpoint
CREATE TYPE "public"."tool_kind" AS ENUM('audit', 'analytics', 'budget', 'other');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"activity_type_id" uuid NOT NULL,
	"approach_id" uuid,
	"objective" text,
	"state" "activity_state" DEFAULT 'planned' NOT NULL,
	"period_start" date,
	"period_end" date,
	"is_unscheduled" boolean DEFAULT false NOT NULL,
	"cancellation_reason" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "activities_done_requires_period_end" CHECK ("activities"."state" <> 'done' or "activities"."period_end" is not null),
	CONSTRAINT "activities_planned_requires_period_or_unscheduled" CHECK ("activities"."state" <> 'planned' or "activities"."is_unscheduled" or "activities"."period_start" is not null),
	CONSTRAINT "activities_cancelled_requires_reason" CHECK ("activities"."state" <> 'cancelled' or "activities"."cancellation_reason" is not null),
	CONSTRAINT "activities_period_order" CHECK ("activities"."period_start" is null or "activities"."period_end" is null or "activities"."period_end" >= "activities"."period_start")
);
--> statement-breakpoint
CREATE TABLE "activity_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "activity_participants_activity_person_unique" UNIQUE("activity_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "activity_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" numeric(10, 2) DEFAULT '0' NOT NULL,
	"family" "activity_family" NOT NULL,
	"produces_result" boolean DEFAULT false NOT NULL,
	"default_tool_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "approaches" (
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
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"allocated" numeric(18, 4),
	"consumed" numeric(18, 4),
	"unit" "budget_unit" DEFAULT 'days' NOT NULL,
	"measured_on" date,
	"tool_id" uuid,
	"external_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "budgets_project_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"competence_center_name" text NOT NULL,
	"status" "domain_status" DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
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
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"project_id" uuid,
	"product_id" uuid,
	"actor_id" uuid,
	"verb" "event_verb" NOT NULL,
	"target_type" "event_target_type" NOT NULL,
	"target_id" uuid,
	"summary" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "indicator_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"indicator_id" uuid NOT NULL,
	"value" numeric(18, 4) NOT NULL,
	"read_on" date NOT NULL,
	"source_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"label" text NOT NULL,
	"unit" text,
	"direction" "indicator_direction" NOT NULL,
	"source" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jobs" (
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
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"source" "person_source" NOT NULL,
	"external_id" text,
	"full_name" text NOT NULL,
	"email" text,
	"job_id" uuid,
	"kind" "person_kind" NOT NULL,
	"has_access" boolean DEFAULT false NOT NULL,
	"domain_role" "domain_role",
	"is_active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "persons_domain_external_id_unique" UNIQUE("domain_id","external_id"),
	CONSTRAINT "persons_external_id_requires_directory" CHECK (("persons"."source" = 'directory') or ("persons"."external_id" is null)),
	CONSTRAINT "persons_role_requires_access" CHECK (("persons"."has_access" and "persons"."domain_role" is not null) or (not "persons"."has_access" and "persons"."domain_role" is null))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"name" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" "product_kind" DEFAULT 'product' NOT NULL,
	"description" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "project_approaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"approach_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "project_approaches_project_approach_unique" UNIQUE("project_id","approach_id")
);
--> statement-breakpoint
CREATE TABLE "project_indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"indicator_id" uuid NOT NULL,
	"baseline_value" numeric(18, 4),
	"target_value" numeric(18, 4),
	"final_value" numeric(18, 4),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "project_indicators_project_indicator_unique" UNIQUE("project_id","indicator_id")
);
--> statement-breakpoint
CREATE TABLE "project_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "project_jobs_project_job_unique" UNIQUE("project_id","job_id")
);
--> statement-breakpoint
CREATE TABLE "project_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"from_project_id" uuid NOT NULL,
	"to_project_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "project_links_from_to_unique" UNIQUE("from_project_id","to_project_id"),
	CONSTRAINT "project_links_no_self_link" CHECK ("project_links"."from_project_id" <> "project_links"."to_project_id")
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"is_contributor" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "project_members_project_person_unique" UNIQUE("project_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "project_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" numeric(10, 2) DEFAULT '0' NOT NULL,
	"nature" "project_status_nature" NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"objective" text,
	"sponsor" text,
	"status_id" uuid NOT NULL,
	"started_on" date,
	"expected_end_on" date,
	"last_activity_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"activity_id" uuid,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"source_updated_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" numeric(18, 4),
	"unit" text,
	"measured_on" date NOT NULL,
	"tool_id" uuid,
	"external_url" text,
	"external_ref" text,
	"sync_mode" "sync_mode" DEFAULT 'manual' NOT NULL,
	"synced_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "results_activity_unique" UNIQUE("activity_id")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "tool_kind" NOT NULL,
	"base_url" text,
	"sync_mode" "sync_mode" DEFAULT 'manual' NOT NULL,
	"api_config" jsonb,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_activity_type_id_activity_types_id_fk" FOREIGN KEY ("activity_type_id") REFERENCES "public"."activity_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_approach_id_approaches_id_fk" FOREIGN KEY ("approach_id") REFERENCES "public"."approaches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_types" ADD CONSTRAINT "activity_types_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_types" ADD CONSTRAINT "activity_types_default_tool_id_tools_id_fk" FOREIGN KEY ("default_tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_types" ADD CONSTRAINT "activity_types_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approaches" ADD CONSTRAINT "approaches_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approaches" ADD CONSTRAINT "approaches_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_actor_id_persons_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicator_readings" ADD CONSTRAINT "indicator_readings_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicator_readings" ADD CONSTRAINT "indicator_readings_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicator_readings" ADD CONSTRAINT "indicator_readings_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_approaches" ADD CONSTRAINT "project_approaches_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_approaches" ADD CONSTRAINT "project_approaches_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_approaches" ADD CONSTRAINT "project_approaches_approach_id_approaches_id_fk" FOREIGN KEY ("approach_id") REFERENCES "public"."approaches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_approaches" ADD CONSTRAINT "project_approaches_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_indicators" ADD CONSTRAINT "project_indicators_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_indicators" ADD CONSTRAINT "project_indicators_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_indicators" ADD CONSTRAINT "project_indicators_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_indicators" ADD CONSTRAINT "project_indicators_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_jobs" ADD CONSTRAINT "project_jobs_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_jobs" ADD CONSTRAINT "project_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_jobs" ADD CONSTRAINT "project_jobs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_jobs" ADD CONSTRAINT "project_jobs_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_from_project_id_projects_id_fk" FOREIGN KEY ("from_project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_to_project_id_projects_id_fk" FOREIGN KEY ("to_project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_statuses" ADD CONSTRAINT "project_statuses_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_statuses" ADD CONSTRAINT "project_statuses_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_status_id_project_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."project_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_created_by_persons_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_domain_id_idx" ON "activities" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "activities_project_id_idx" ON "activities" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "activities_activity_type_id_idx" ON "activities" USING btree ("activity_type_id");--> statement-breakpoint
CREATE INDEX "activities_state_idx" ON "activities" USING btree ("state");--> statement-breakpoint
CREATE INDEX "activity_participants_domain_id_idx" ON "activity_participants" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "activity_participants_person_id_idx" ON "activity_participants" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "activity_types_domain_id_idx" ON "activity_types" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "activity_types_default_tool_id_idx" ON "activity_types" USING btree ("default_tool_id");--> statement-breakpoint
CREATE INDEX "approaches_domain_id_idx" ON "approaches" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "budgets_domain_id_idx" ON "budgets" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "budgets_tool_id_idx" ON "budgets" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "entities_domain_id_idx" ON "entities" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "events_domain_id_idx" ON "events" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "events_project_id_idx" ON "events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "events_product_id_idx" ON "events" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "events_occurred_at_idx" ON "events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "indicator_readings_domain_id_idx" ON "indicator_readings" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "indicator_readings_indicator_id_idx" ON "indicator_readings" USING btree ("indicator_id");--> statement-breakpoint
CREATE INDEX "indicators_domain_id_idx" ON "indicators" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "indicators_product_id_idx" ON "indicators" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "jobs_domain_id_idx" ON "jobs" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "persons_domain_id_idx" ON "persons" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "persons_job_id_idx" ON "persons" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "products_domain_id_idx" ON "products" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "products_entity_id_idx" ON "products" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "project_approaches_domain_id_idx" ON "project_approaches" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "project_indicators_domain_id_idx" ON "project_indicators" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "project_indicators_indicator_id_idx" ON "project_indicators" USING btree ("indicator_id");--> statement-breakpoint
CREATE INDEX "project_jobs_domain_id_idx" ON "project_jobs" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "project_links_domain_id_idx" ON "project_links" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "project_links_to_project_id_idx" ON "project_links" USING btree ("to_project_id");--> statement-breakpoint
CREATE INDEX "project_members_domain_id_idx" ON "project_members" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "project_members_person_id_idx" ON "project_members" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "project_statuses_domain_id_idx" ON "project_statuses" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "projects_domain_id_idx" ON "projects" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "projects_product_id_idx" ON "projects" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "projects_status_id_idx" ON "projects" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "projects_last_activity_at_idx" ON "projects" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "resources_domain_id_idx" ON "resources" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "resources_project_id_idx" ON "resources" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "resources_activity_id_idx" ON "resources" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "results_domain_id_idx" ON "results" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "results_tool_id_idx" ON "results" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tools_domain_id_idx" ON "tools" USING btree ("domain_id");