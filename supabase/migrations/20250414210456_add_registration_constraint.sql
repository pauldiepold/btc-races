ALTER TABLE "public"."registrations"
ADD CONSTRAINT "registrations_member_competition_unique" UNIQUE ("member_id", "competition_id");
