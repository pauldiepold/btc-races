-- Neue Enums für Wettkampftypen und Meisterschaften
CREATE TYPE "public"."race_type" AS ENUM (
    'TRACK',
    'ROAD'
);

CREATE TYPE "public"."championship_type" AS ENUM (
    'NO_CHAMPIONSHIP',
    'BBM',
    'NDM',
    'DM'
);

CREATE TYPE "public"."registration_type" AS ENUM (
    'INDEPENDENT',
    'LADV',
    'CLUB'
);

-- Neue Felder zur competitions Tabelle hinzufügen
ALTER TABLE "public"."competitions"
ADD COLUMN "registration_type" "public"."registration_type" DEFAULT 'INDEPENDENT' NOT NULL,
ADD COLUMN "race_type" "public"."race_type" DEFAULT 'TRACK' NOT NULL,
ADD COLUMN "championship_type" "public"."championship_type" DEFAULT 'NO_CHAMPIONSHIP' NOT NULL;

-- Neue Tabelle für Wettkampfdistanzen
CREATE TABLE IF NOT EXISTS "public"."competition_distances" (
    "id" bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "competition_id" bigint NOT NULL,
    "distance" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "competition_distances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "competition_distances_competition_id_fkey" FOREIGN KEY ("competition_id") 
        REFERENCES "public"."competitions"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "competition_distances_competition_id_distance_key" UNIQUE ("competition_id", "distance")
);

-- Trigger für updated_at
CREATE TRIGGER update_competition_distances_updated_at
    BEFORE UPDATE ON "public"."competition_distances"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_modified_column"();

-- RLS Policies
ALTER TABLE "public"."competition_distances" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users only" 
    ON "public"."competition_distances" 
    TO "authenticated" 
    USING (true);

CREATE POLICY "Enable read access for all users" 
    ON "public"."competition_distances" 
    FOR SELECT 
    USING (true);

-- Grants
GRANT ALL ON TABLE "public"."competition_distances" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON SEQUENCE "public"."competition_distances_id_seq" TO "postgres", "anon", "authenticated", "service_role";
