-- Tables
CREATE TABLE IF NOT EXISTS "public"."competitions" (
    "id" bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "name" "text" NOT NULL,
    "location" "text",
    "description" "text",
    "date" "date" NOT NULL,
    "registration_deadline" "date" NOT NULL,
    "announcement_link" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "competitions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id")
);

CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "has_left" boolean DEFAULT false NOT NULL,
    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."emails" (
    "id" bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "member_id" bigint NOT NULL,
    CONSTRAINT "emails_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "emails_email_key" UNIQUE ("email"),
    CONSTRAINT "emails_member_id_key" UNIQUE ("member_id"),
    CONSTRAINT "emails_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "member_id" bigint NOT NULL,
    "competition_id" bigint NOT NULL,
    "status" "public"."registration_status" DEFAULT 'pending'::"public"."registration_status",
    "notes" "text",
    "verification_token" "text" NOT NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "registrations_verification_token_key" UNIQUE ("verification_token"),
    CONSTRAINT "registrations_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "registrations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

-- Triggers
CREATE TRIGGER update_competitions_updated_at
    BEFORE UPDATE ON "public"."competitions"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_modified_column"();

CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON "public"."members"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_modified_column"();

CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON "public"."registrations"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_modified_column"();

-- RLS Policies
ALTER TABLE "public"."competitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."emails" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users only" ON "public"."members" TO "authenticated" USING (true);
CREATE POLICY "Enable all access for authenticated users only" ON "public"."competitions" TO "authenticated" USING (true);
CREATE POLICY "Enable all access for authenticated users only" ON "public"."emails" TO "authenticated" USING (true);
CREATE POLICY "Enable all access for authenticated users only" ON "public"."registrations" TO "authenticated" USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."competitions" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."members" FOR SELECT USING (true);

-- Grants
GRANT USAGE ON SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";

-- Default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
GRANT ALL ON TABLES TO "postgres", "anon", "authenticated", "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
GRANT ALL ON SEQUENCES TO "postgres", "anon", "authenticated", "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
GRANT ALL ON FUNCTIONS TO "postgres", "anon", "authenticated", "service_role";
