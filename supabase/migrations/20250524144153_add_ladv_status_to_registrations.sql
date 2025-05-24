-- Add LADV status to registrations table
ALTER TABLE "public"."registrations" 
    ADD COLUMN IF NOT EXISTS "ladv_registered_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "ladv_canceled_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "ladv_registered_by" text;

-- Drop the existing view first
DROP VIEW IF EXISTS "public"."registrations_with_details";

-- Create the view with the new column
CREATE VIEW "public"."registrations_with_details" AS
SELECT 
    r.id,
    r.member_id,
    r.competition_id,
    r.status,
    r.notes,
    r.ladv_registered_at,
    r.ladv_canceled_at,
    r.ladv_registered_by,
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
