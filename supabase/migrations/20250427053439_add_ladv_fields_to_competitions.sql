-- Add LADV fields to competitions table
ALTER TABLE "public"."competitions" 
    ADD COLUMN IF NOT EXISTS "veranstalter" TEXT,
    ADD COLUMN IF NOT EXISTS "ausrichter" TEXT,
    ADD COLUMN IF NOT EXISTS "sportstaette" TEXT,
    ADD COLUMN IF NOT EXISTS "ladv_description" TEXT,
    ADD COLUMN IF NOT EXISTS "ladv_data" JSONB,
    ADD COLUMN IF NOT EXISTS "ladv_id" INTEGER,
    ADD COLUMN IF NOT EXISTS "ladv_last_sync" TIMESTAMP WITH TIME ZONE;

-- Add index for ladv_id to improve lookup performance
CREATE INDEX IF NOT EXISTS "competitions_ladv_id_idx" ON "public"."competitions" ("ladv_id");

-- Update the registrations_with_details view to include new LADV fields
CREATE OR REPLACE VIEW "public"."registrations_with_details" AS
SELECT 
    r.id,
    r.member_id,
    r.competition_id,
    r.status,
    r.notes,
    r.created_at,
    r.updated_at,
    -- Member details
    m.name as member_name,
    e.email as member_email,
    m.has_ladv_startpass,
    -- Competition details
    c.name as competition_name,
    c.date as competition_date,
    c.location as competition_location,
    c.registration_deadline,
    c.race_type,
    c.championship_type,
    -- LADV details
    c.veranstalter,
    c.ausrichter,
    c.sportstaette,
    c.ladv_description,
    c.ladv_id,
    c.ladv_last_sync
FROM 
    registrations r
JOIN 
    members m ON r.member_id = m.id
JOIN 
    emails e ON m.id = e.member_id
JOIN 
    competitions c ON r.competition_id = c.id;
