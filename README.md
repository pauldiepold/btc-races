# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# pnpm
pnpm build
```

Locally preview production build:

```bash
# pnpm
pnpm preview
```


Hier ist das vollständige Dokument im Markdown-Format. Du kannst den Inhalt einfach kopieren und als `MIGRATION.md` oder `README_V2.md` in deinem neuen Projekt speichern.

---

# Blueprint & Migrationsplan: BTC Wettkampfanmeldung V2

Dieses Dokument dient als Master-Leitfaden für die Migration der bestehenden Anwendung von Supabase/PostgreSQL zu einer Edge-nativen Architektur mit **NuxtHub**, **Cloudflare D1** und **Drizzle ORM**.

## 1. Zentrale Design-Entscheidungen

* **Plattform:** Vollständiges Deployment auf Cloudflare via NuxtHub (Pages + D1 + Blob).
* **Datenbank:** Wechsel zu SQLite (Cloudflare D1). Autorisierung erfolgt im Server-Code, nicht mehr über Row Level Security (RLS).
* **Authentifizierung:** Passwortloser Login via **Magic Link**. Die E-Mail-Adresse ist die primäre Identität.
* **Admin-Zugang:** Hybrid-Modell. Erste Admins werden über die Umgebungsvariable `ADMIN_EMAILS` (kommagetrennt) definiert. Zusätzliche Admins können später über ein `role`-Feld in der Datenbank verwaltet werden.
* **Data Handling:** SQLite speichert Zeitstempel als Integer. Drizzle übernimmt die Konvertierung in JS-Date-Objekte.

---

## 2. Der Migrationsplan (Checklist)

### Phase 1: Foundation (Das Fundament)

* [x] **Initialisierung:** Neues Projekt mit `npx nuxi@latest init`.
* [x] **Module:** NuxtHub und Nuxt-Auth-Utils installieren (`npx nuxi@latest module add hub auth`).
* [x] **Cloudflare Bindung:** D1 Datenbank erstellen und in der `nuxt.config.ts` unter `hub.database` verknüpfen.
* [x] **Drizzle Setup:** Schema-Datei unter `server/database/schema.ts` anlegen und erste Migration generieren (`npx nuxthub db generate`).

### Phase 2: Identity & Auth (Magic Link)

* [x] **User Bootstrap:** Variable `NUXT_ADMIN_EMAILS` in den Cloudflare/Vercel ENV-Settings hinterlegen.
* [x] **Login-Logik:** `POST /api/login` erstellen (Prüfung gegen `users`-Tabelle, Token-Generierung, E-Mail-Versand via Azure).
* [x] **Verify-Logik:** `GET /api/auth/verify` erstellen (Token-Validierung und Session-Erstellung via `setUserSession`).
* [x] **E-Mail Service:** Bestehende Azure-Integration portieren (Secrets in Cloudflare ENV hinterlegen).

### Phase 3: Core Domain & UI

* [x] **Admin-Schutz:** `defineAdminHandler` Utility implementieren (siehe Code-Snippet).
* [ ] **Wettkampf-CRUD:** API-Endpunkte für die Verwaltung von Wettkämpfen migrieren.
* [ ] **Anmeldeprozess:** Logik für `registrations` auf Drizzle umstellen.
* [ ] **Frontend-Portierung:** Bestehende Nuxt UI Komponenten übernehmen und an die neuen API-Schnittstellen anbinden.

---

## 3. Technisches Grundgerüst (Code Snippets)

### A. Das Drizzle Schema

Speicherung unter `server/database/schema.ts`.

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Zentrales User-Modell
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID oder Campai-ID
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').$type<'admin' | 'member'>().default('member'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Tokens für Magic Links
export const authTokens = sqliteTable('auth_tokens', {
  token: text('token').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

// Wettkämpfe
export const competitions = sqliteTable('competitions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ladvId: text('ladv_id'),
  title: text('title').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  deadline: integer('deadline', { mode: 'timestamp' }).notNull(),
  isMeldepflichtig: integer('is_meldepflichtig', { mode: 'boolean' }).default(false),
});

// Anmeldungen
export const registrations = sqliteTable('registrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => users.id),
  competitionId: integer('competition_id').references(() => competitions.id),
  status: text('status').$type<'pending' | 'confirmed' | 'cancelled'>().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

```

### B. Admin-Schutz Wrapper

Speicherung unter `server/utils/adminHandler.ts`.

```typescript
import type { EventHandler, EventHandlerRequest } from 'h3'

export const defineAdminHandler = <T extends EventHandlerRequest, D>(
  handler: EventHandler<T, D>
): EventHandler<T, D> =>
  defineEventHandler<T>(async (event) => {
    const { user } = await getUserSession(event)
    
    const adminEmails = (process.env.NUXT_ADMIN_EMAILS || '').split(',')
    const isHardcodedAdmin = user?.email && adminEmails.includes(user.email)
    const isDbAdmin = user?.role === 'admin'

    if (!isHardcodedAdmin && !isDbAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Unauthorized: Administrator access required.'
      })
    }

    return handler(event)
  })

```

---

## 4. Wichtige Hinweise für die Umsetzung

1. **Date Handling:** Achte darauf, dass alle Datumsangaben in der Datenbank als UTC-Timestamp (Integer) landen. Nutze im Frontend `Intl.DateTimeFormat` oder `dayjs` zur Anzeige.
2. **Secrets:** Hinterlege `NUXT_SESSION_PASSWORD` (min. 32 Zeichen) und `AZURE_CONNECTION_STRING` direkt im Cloudflare Pages Dashboard unter *Settings -> Variables*.
3. **LADV Sync:** Da Cloudflare Workers ein Ausführungslimit haben, sollte ein großer Import von Wettkämpfen eventuell in Batches aufgeteilt werden.
4. **Security:** Da wir kein RLS mehr nutzen, muss jeder Endpunkt unter `/api/my/...` explizit mit `where(eq(table.userId, session.user.id))` filtern.

---

**Nächster Schritt:** Erstelle das neue Nuxt-Projekt und beginne mit der Implementierung des `authTokens` Schemas und des `login.post.ts` Endpunkts. Soll ich dir dabei helfen, den ersten Magic-Link-Endpoint konkret auszuformulieren?
