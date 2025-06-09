-- Add recipients field to sent_emails table
ALTER TABLE "public"."sent_emails"
    ADD COLUMN "recipients" JSONB;

-- Add index for recipients to improve query performance
CREATE INDEX IF NOT EXISTS "sent_emails_recipients_idx" ON "public"."sent_emails" USING GIN ("recipients");

-- Update the sent_emails_with_details view to include the new recipients field
DROP VIEW IF EXISTS "public"."sent_emails_with_details";

CREATE VIEW "public"."sent_emails_with_details" AS
SELECT
    se.id,
    se.registration_id,
    se.email_type,
    se.subject,
    se.token,
    se.token_expires_at,
    se.token_verified_at,
    se.status,
    se.sent_at,
    se.error,
    se.retry_count,
    se.recipients,
    se.created_at,
    se.updated_at,
    -- Registrierungs- und Mitgliedsdaten
    r.member_id,
    m.name as member_name,
    e.email as recipient_email,
    c.name as competition_name,
    c.date as competition_date
FROM
    sent_emails se
JOIN
    registrations r ON se.registration_id = r.id
JOIN
    members m ON r.member_id = m.id
JOIN
    emails e ON m.id = e.member_id
JOIN
    competitions c ON r.competition_id = c.id;
