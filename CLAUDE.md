# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BTC Wettkampfanmeldung** — Wettkampf-Anmeldesystem für den Berlin Track Club. Nuxt 4 Full-Stack-App (SSR + API-Routes via Nitro), deployed auf Cloudflare Pages mit D1-Datenbank via NuxtHub.

## Commands

```bash
pnpm dev              # Dev-Server starten (localhost:3000, wendet Migrationen automatisch an)
pnpm build            # Production build
pnpm typecheck        # TypeScript-Typen prüfen
pnpm lint             # ESLint
pnpm lint:fix         # ESLint mit Auto-Fix

# Datenbank
pnpm db:generate      # Migrationen aus Schema-Änderungen generieren
pnpm db:migrate       # Migrationen lokal anwenden
pnpm db:remote:migrate # Migrationen auf Cloudflare D1 (Produktion) anwenden

```

## Architecture

### Stack
- **Frontend**: Nuxt 4, Vue 3, @nuxt/ui (Tailwind-basiert), Pinia + @pinia/colada
- **Backend**: Nitro (Nuxt Server Engine) mit API-Routes und Tasks
- **Datenbank**: Cloudflare D1 (SQLite) via NuxtHub, ORM: Drizzle
- **Auth**: Passwordless Magic-Link via `nuxt-auth-utils` (Cookie-Session)
- **Email**: Provider-Pattern — Console (dev) oder Azure Communication Services (prod)
- **Deployment**: Cloudflare Pages via NuxtHub

### Verzeichnisstruktur
- `app/` — Frontend (pages, components, middleware, email-templates, assets)
- `server/` — Backend (api-routes, db-schema, tasks, email-service, external APIs)
- `shared/` — Typen, die server- und clientseitig geteilt werden

### Datenbank (Drizzle + NuxtHub)

Schema liegt in `server/db/schema.ts`. Zugriff im Server-Code:
```ts
import { db, schema } from 'hub:db'
```

**Workflow bei Schema-Änderungen:**
1. Schema in `server/db/schema.ts` anpassen
2. `pnpm db:generate` — Migration automatisch generieren lassen
3. `pnpm db:migrate` — lokal anwenden (oder einfach `pnpm dev`)
4. **Niemals** manuell SQL-Migrationsdateien in `server/db/migrations/` erstellen

Typen für client/server-sharing in `shared/types/` ablegen (auto-importiert):
```ts
export type User = typeof schema.users.$inferSelect
```

### Authentication

Magic-Link-Flow:
1. `POST /api/auth/login` — prüft ob E-Mail in `users`-Tabelle existiert, erstellt Token in `authTokens` (15 min TTL), sendet E-Mail
2. `GET /verify?token=...` — validiert Token, setzt Session via `setUserSession()`
3. `POST /api/auth/logout` — löscht Session

Session-Objekt: `{ id, email, firstName, lastName, role, sections, avatarUrl, loggedInAt }`

Schutz:
- Client: `app/middleware/auth.global.ts` — alle Routen außer `/login` und `/link-gesendet`
- Server: `server/middleware/auth.ts` — schützt `/events/`-Routen

### Email-Service

Singleton in `server/email/service.ts`, Provider werden über `nuxt.config.ts` (`emailProvider`) konfiguriert. Eigene E-Mail-Templates sind Vue-Komponenten in `app/emails/` und werden via `nuxt-email-renderer` gerendert.

### Member-Synchronisation

Nitro-Task `server/tasks/sync-members.ts`: Synct aktive Mitglieder von der Campai-API in die lokale `users`-Tabelle. Wird per `POST /api/cron/sync-members` (Bearer-Token) ausgelöst.

### Externe APIs

- **Campai**: Mitgliederverwaltung — `server/external-apis/campai-contacts/`
- **LADV**: Wettkampf-Daten (Schema vorhanden, noch nicht vollständig implementiert)
- Typen manuell in `server/utils/ladv.ts` (LADV) und `server/external-apis/campai-contacts/contacts.service.ts` (Campai) definiert

## Testing

Setup: `vitest` — nur Unit Tests für pure Business-Logik.

```bash
pnpm test        # einmalig ausführen
pnpm test:watch  # watch mode
```

Tests liegen in `test/unit/`. Nach einer Feature-Session: `/test` aufrufen.

### Was getestet wird
- Pure Funktionen in `server/utils/` (kein DB-Zugriff, kein HTTP)
- Daten-Mapping und Transformations-Logik
- Zod-Schema-Validierungen und Business-Rules

### Was NICHT getestet wird
- Nitro Event Handler / API-Routen
- Drizzle-Queries / Datenbankzugriffe
- Vue-Komponenten

### Hinweis beim Implementieren
Am Ende jeder Feature-Session prüfen: Enthält der neue Code pure, testbare Logik? Falls ja, kurz darauf hinweisen und `/test` anbieten.

## Umgebungsvariablen

Siehe (`.env.example`)

## Implementierungsplan-Pflege

Der Implementierungsplan liegt in `planning/09-implementierungsplan.md`. Nach jeder abgeschlossenen Session:
1. Überschrift mit `✅` markieren (z.B. `### ✅ 9.1 — ...`)
2. Inhalt der Session erhalten — nichts löschen
3. `**Abschluss (DATUM):**`-Notiz direkt vor dem abschließenden `---` ergänzen — kurzes Fazit: was geklappt hat, ob es Schwierigkeiten gab
