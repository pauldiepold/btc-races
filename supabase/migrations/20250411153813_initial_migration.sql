create table "public"."competitions" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "date" date not null,
    "location" text,
    "registration_deadline" date not null,
    "announcement_link" text,
    "description" text,
    "is_archived" boolean default false,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."competitions" enable row level security;

CREATE UNIQUE INDEX competitions_pkey ON public.competitions USING btree (id);

alter table "public"."competitions" add constraint "competitions_pkey" PRIMARY KEY using index "competitions_pkey";

alter table "public"."competitions" add constraint "competitions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."competitions" validate constraint "competitions_created_by_fkey";

grant delete on table "public"."competitions" to "anon";

grant insert on table "public"."competitions" to "anon";

grant references on table "public"."competitions" to "anon";

grant select on table "public"."competitions" to "anon";

grant trigger on table "public"."competitions" to "anon";

grant truncate on table "public"."competitions" to "anon";

grant update on table "public"."competitions" to "anon";

grant delete on table "public"."competitions" to "authenticated";

grant insert on table "public"."competitions" to "authenticated";

grant references on table "public"."competitions" to "authenticated";

grant select on table "public"."competitions" to "authenticated";

grant trigger on table "public"."competitions" to "authenticated";

grant truncate on table "public"."competitions" to "authenticated";

grant update on table "public"."competitions" to "authenticated";

grant delete on table "public"."competitions" to "service_role";

grant insert on table "public"."competitions" to "service_role";

grant references on table "public"."competitions" to "service_role";

grant select on table "public"."competitions" to "service_role";

grant trigger on table "public"."competitions" to "service_role";

grant truncate on table "public"."competitions" to "service_role";

grant update on table "public"."competitions" to "service_role";

create policy "Authentifizierte Benutzer dürfen Competitions bearbeiten"
on "public"."competitions"
as permissive
for all
to authenticated
using ((auth.role() = 'authenticated'::text))
with check ((auth.role() = 'authenticated'::text));


create policy "Competitions sind öffentlich lesbar"
on "public"."competitions"
as permissive
for select
to public
using (true);



