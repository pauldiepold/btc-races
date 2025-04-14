-- Deaktiviere alle Trigger temporär
SET session_replication_role = 'replica';

-- Lösche alle Tabellen in der public Schema
DROP TABLE IF EXISTS "public"."registrations" CASCADE;
DROP TABLE IF EXISTS "public"."emails" CASCADE;
DROP TABLE IF EXISTS "public"."members" CASCADE;
DROP TABLE IF EXISTS "public"."competitions" CASCADE;

-- Lösche alle Funktionen
DROP FUNCTION IF EXISTS "public"."update_modified_column"() CASCADE;

-- Lösche alle Typen
DROP TYPE IF EXISTS "public"."registration_status" CASCADE;

-- Lösche alle Extensions
DROP EXTENSION IF EXISTS "pg_graphql" CASCADE;
DROP EXTENSION IF EXISTS "pg_stat_statements" CASCADE;
DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
DROP EXTENSION IF EXISTS "pgjwt" CASCADE;
DROP EXTENSION IF EXISTS "supabase_vault" CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- Lösche alle Policies
DROP POLICY IF EXISTS "Enable all access for authenticated users only" ON "public"."members";
DROP POLICY IF EXISTS "Enable all access for authenticated users only" ON "public"."competitions";
DROP POLICY IF EXISTS "Enable all access for authenticated users only" ON "public"."emails";
DROP POLICY IF EXISTS "Enable all access for authenticated users only" ON "public"."registrations";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."competitions";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."members";

-- Aktiviere Trigger wieder
SET session_replication_role = 'origin';

-- Lösche alle Berechtigungen
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "postgres", "anon", "authenticated", "service_role";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "postgres", "anon", "authenticated", "service_role";
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM "postgres", "anon", "authenticated", "service_role";
REVOKE USAGE ON SCHEMA "public" FROM "postgres", "anon", "authenticated", "service_role"; 