# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BTC Wettkampfanmeldung** — Wettkampf-Anmeldesystem für den Berlin Track Club. Nuxt 4 Full-Stack-App (SSR + API-Routes via Nitro), deployed auf Cloudflare Pages mit D1-Datenbank via NuxtHub.

## Commands

```bash
pnpm dev              # Dev-Server starten (localhost:3000, wendet Migrationen automatisch an)
pnpm build            # Production build
pnpm typecheck        # TypeScript-Typen prüfen — immer mit Exit-Code prüfen: `pnpm typecheck 2>&1; echo "Exit: $?"`
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
- `btc-races-v1/` — Altes Vorgänger-Projekt (eingefroren, nicht anfassen)
- [`FEATURES.md`](./FEATURES.md) — Hochrangige Übersicht aller implementierten Features

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

## Commit & GitHub

Am Ende jeder Session `/commit` aufrufen — der Skill übernimmt Issue-Anlage, FEATURES.md-Update und Commit.


## Neue E-Mail Templates

- Email-Templates: "Dev-Server nach neuen Templates neu starten" ist ein nicht-offensichtlicher Gotcha