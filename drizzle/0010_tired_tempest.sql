ALTER TABLE "persons" DROP CONSTRAINT "persons_availability_requires_center";--> statement-breakpoint
ALTER TABLE "persons" DROP COLUMN "availability";--> statement-breakpoint
DROP TYPE "public"."person_availability";