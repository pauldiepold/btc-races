# Schritt 10 — PWA & Push-Notifications

_Stand: 2026-04-08_

---

## Wie dieser Plan zu nutzen ist

Jede Session bekommt dieses Dokument als Einstieg.
Sessions sind sequenziell — jede baut auf dem Output der vorherigen auf.
Abgeschlossene Sessions werden hier als ✅ markiert.

**Kontext-Files für alle Sessions:** `CLAUDE.md`, `planning/03-feature-spec.md`, `server/db/schema.ts`

**Nach jeder Session:**
1. Tests ausführen: `/test`
2. Wenn Tests grün: committen
3. Abschnitt im Plan mit ✅ markieren, Inhalt erhalten, kurze Abschluss-Notiz (`**Abschluss:**`) ergänzen

**Branch:** Alle Arbeiten auf `develop`.

---

## Konzept & Entscheidungen

### Ziel

Die Nuxt-App wird als PWA installierbar und sendet Web-Push-Notifications. Push und E-Mail sind **unabhängig voneinander konfigurierbar** (pro Nutzer, pro Kategorie). Für alle bisherigen E-Mail-Trigger gibt es auch einen Push-Trigger. Darüber hinaus gibt es Push-only-Trigger (z.B. neue Kommentare, neues Event angelegt) — die konkreten Kategorien werden in Session 10.6 festgelegt.

### Technologie-Entscheidungen

| Entscheidung | Gewählt | Begründung |
|---|---|---|
| PWA-Modul | `@vite-pwa/nuxt` | Standard für Nuxt, CF Pages kompatibel |
| Push-Infrastruktur | Self-hosted Web Push (VAPID) | Keine externe Abhängigkeit, alles in CF; 100 Nutzer = überschaubar |
| CF Workers WebCrypto | `@block65/webcrypto-web-push` | Node-`crypto`-freie Library, CF Workers kompatibel |
| Offline-Support | Keiner | Kein messbarer Nutzen für dieses Anwendungsszenario |

### iOS-Einschränkung

iOS unterstützt Web Push **ausschließlich aus installierten PWAs** (Add to Home Screen, ab iOS 16.4). Kein Workaround möglich. Der Opt-in-Flow muss das abfangen.

### Opt-in-Flow

```
Startseite: persistenter Banner "Push-Benachrichtigungen aktivieren"
  (verschwindet sobald Push aktiv ist oder der User ihn dauerhaft schließt)
  │
  └─► Klick → Modal öffnet sich
        │
        ├─► iOS, NICHT als PWA installiert
        │     → Installationsanleitung ("Teilen → Zum Home-Bildschirm")
        │       → nach Installation: Push-Aktivierung im nächsten Schritt
        │
        └─► Alle anderen (iOS-PWA, Android, Desktop)
              → Kategorie-Übersicht + "Aktivieren"-Button
              → OS-Permission-Dialog
              → Subscription in DB speichern
```

### Notification Preferences

Gespeichert als JSON-Feld `notification_preferences` auf der `users`-Tabelle:

```json
{
  "email": {
    "ladv_registered": true,
    "ladv_cancelled": true,
    "registration_confirmed": true,
    "event_cancelled": true
  },
  "push": {
    "ladv_registered": true,
    "ladv_cancelled": true,
    "registration_confirmed": true,
    "event_cancelled": true,
    "new_event": true,
    "new_comment": false
  }
}
```

Konkrete Kategorien und Defaults werden in Session 10.6 festgelegt. Die Struktur bleibt erweiterbar.

E-Mail und Push sind pro Kategorie mit je einem Toggle konfigurierbar. Wo Kategorien in beiden Channels existieren, werden sie in einer Zeile (zwei Toggles) dargestellt.

---

## Abhängigkeitsübersicht

```
10.1 DB-Schema (push_subscriptions + notification_preferences)
  └── 10.2 PWA-Setup (Manifest + Service Worker)
        └── 10.3 Push-Server-Infrastruktur (VAPID + Subscribe-API + Send-Service)
              └── 10.4 Opt-in-Flow UI (Banner + Modal + iOS-Detection)
                    └── 10.5 Notification-Preferences UI
                          └── 10.6 Notification-Events verdrahten [Kategorien TBD]
```

---

## Sessions

---

### 10.1 — DB-Schema

**Ziel:** Neue Tabelle `push_subscriptions` anlegen. Feld `notification_preferences` auf `users` ergänzen.

**Was zu tun ist:**

1. `server/db/schema.ts`:
   - Neue Tabelle `push_subscriptions`:
     - `id` — text PK (UUID)
     - `user_id` — text FK → `users.id`, CASCADE DELETE
     - `endpoint` — text NOT NULL
     - `keys_auth` — text NOT NULL (Base64url)
     - `keys_p256dh` — text NOT NULL (Base64url)
     - `device_hint` — text nullable (z.B. `"iOS"`, `"Android"`, `"Desktop"` — aus User-Agent abgeleitet, nur zur Orientierung)
     - `created_at` — integer (Unix-Timestamp)
   - Auf `users`: Feld `notification_preferences` — text nullable (JSON)
   - UNIQUE auf `push_subscriptions(user_id, endpoint)` — verhindert doppelte Subscriptions

2. `pnpm db:generate` → Migration prüfen → `pnpm db:migrate`

3. Shared Types in `shared/types/`:
   - `PushSubscription` (`$inferSelect` von `push_subscriptions`)
   - `NotificationPreferences` — TypeScript-Interface (channel × kategorie → boolean), als zentrale Typdefinition für Client + Server

**Output:** Migration applied, Shared Types verfügbar  
**Kontext-Files:** `server/db/schema.ts`, `shared/types/`

---

### 10.2 — PWA-Setup

**Ziel:** App ist installierbar (Web App Manifest, Service Worker). Service Worker behandelt `push`-Events. Kein Offline-Caching.

**Was zu tun ist:**

1. `@vite-pwa/nuxt` installieren (`pnpm add -D @vite-pwa/nuxt`)

2. `nuxt.config.ts` — PWA-Modul einbinden und konfigurieren:
   - `name`, `short_name`, `description`
   - `theme_color` (aus Design System: Yellow-Primary), `background_color`
   - Icons (verschiedene Größen) — in `public/icons/` ablegen
   - `display: 'standalone'`
   - `start_url: '/'`
   - Service Worker Strategy: `injectManifest` mit eigenem SW (damit volle Kontrolle über Push-Handling)
   - Workbox-Precaching **deaktivieren** (nur Push, kein Caching gewünscht)

3. Service Worker `app/service-worker.ts` anlegen:
   - `push`-Event-Listener: Notification aus Payload darstellen (`self.registration.showNotification(...)`)
   - `notificationclick`-Event-Listener: Klick öffnet die App und navigiert zur richtigen Route (URL aus Payload)
   - Kein Workbox-Caching-Code

4. Installierbarkeit im Browser prüfen (Chrome DevTools → Application → Manifest)

**Output:** App zeigt "Installieren"-Prompt im Browser, Service Worker registriert  
**Kontext-Files:** `nuxt.config.ts`, `app/service-worker.ts`, `public/icons/`

---

### 10.3 — Push-Server-Infrastruktur

**Ziel:** Server kann Push-Subscriptions verwalten und Pushes versenden. VAPID-Setup. CF-Workers-kompatible Implementierung.

**Was zu tun ist:**

1. VAPID-Keys generieren (einmalig, z.B. via `npx web-push generate-vapid-keys`) → in `.env` und `.env.example` eintragen:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (mailto: oder URL)

2. `@block65/webcrypto-web-push` installieren (`pnpm add @block65/webcrypto-web-push`)

3. Push-Service `server/push/service.ts` anlegen (Singleton-Pattern analog zu `server/email/service.ts`):
   - `sendPush(subscription, payload: PushPayload)` — versendet eine Notification an einen Endpoint
   - `sendPushToUser(userId, payload)` — lädt alle aktiven Subscriptions des Users und sendet an alle
   - `sendPushToUsers(userIds, payload)` — Broadcast an mehrere User
   - Fehlerbehandlung: abgelaufene/ungültige Subscriptions (HTTP 410 Gone → aus DB löschen)
   - `PushPayload`-Typ: `{ title, body, url?, icon? }`

4. API-Routes:
   - `GET /api/push/vapid-public-key` — gibt `VAPID_PUBLIC_KEY` zurück (für `applicationServerKey` im Frontend)
   - `POST /api/push/subscribe` — speichert neue Subscription (auth-geschützt), Upsert auf `(user_id, endpoint)`
   - `DELETE /api/push/subscribe` — löscht Subscription anhand `endpoint` (auth-geschützt)

**Output:** Push-Service importierbar, Subscribe/Unsubscribe-API funktionsfähig  
**Kontext-Files:** `server/push/service.ts`, `server/api/push/`, `.env.example`

---

### 10.4 — Opt-in-Flow UI

**Ziel:** User kann Push-Notifications aktivieren. Korrekte Behandlung von iOS (nicht-installiert vs. PWA).

**Was zu tun ist:**

1. Composable `app/composables/usePushNotifications.ts`:
   - `isIos()` — User-Agent-Check
   - `isInstalledPwa()` — `window.matchMedia('(display-mode: standalone)')` oder `navigator.standalone`
   - `isPushSupported()` — Feature-Detection (`'PushManager' in window && 'serviceWorker' in navigator`)
   - `isPushGranted()` — `Notification.permission === 'granted'`
   - `subscribe()` — Service Worker warten, `pushManager.subscribe(...)`, Public Key vom Server holen, Subscription an API schicken
   - `unsubscribe()` — lokale Subscription kündigen + API-Call

2. `app/components/PushBanner.vue` — persistenter Hinweis-Banner:
   - Zeigt sich wenn: Push unterstützt + noch nicht aktiviert + nicht dauerhaft geschlossen
   - "Dauerhaft schließen"-State in `localStorage` speichern
   - Klick öffnet `PushOptinModal`

3. `app/components/PushOptinModal.vue`:
   - **iOS, nicht installiert:** Schritt-für-Schritt-Anleitung "Teilen → Zum Home-Bildschirm" mit Screenshots/Icons
   - **Alle anderen:** Kurze Erklärung + "Benachrichtigungen aktivieren"-Button → ruft `subscribe()` auf → OS-Dialog
   - Nach erfolgreichem Opt-in: Modal schließt sich, Banner verschwindet

4. Banner in `app/layouts/default.vue` einbinden (unter Navbar)

**Output:** User kann Push aktivieren, Flow funktioniert auf iOS-PWA + Android + Desktop  
**Kontext-Files:** `app/composables/usePushNotifications.ts`, `app/components/PushBanner.vue`, `app/components/PushOptinModal.vue`, `app/layouts/default.vue`

---

### 10.5 — Notification Preferences UI

**Ziel:** User kann Push- und E-Mail-Benachrichtigungen pro Kategorie konfigurieren. Einstellungen werden gespeichert und beim nächsten Login geladen.

**Was zu tun ist:**

1. API-Routes:
   - `GET /api/user/notification-preferences` — gibt aktuelle Preferences zurück (mit Defaults für neue Kategorien)
   - `PUT /api/user/notification-preferences` — speichert neue Preferences (Zod-Validierung)

2. `app/composables/useNotificationPreferences.ts` — lädt und speichert Preferences via `@pinia/colada`-Query/Mutation

3. Preferences-Abschnitt auf `/profil` (oder eigenständige `/einstellungen`-Route, je nach Stand von F-06 zum Zeitpunkt der Session):
   - Tabelle: eine Zeile pro Kategorie, zwei Toggle-Spalten (E-Mail | Push)
   - Push-Spalte nur aktiv wenn Push überhaupt aktiviert ist (sonst greyed out mit Hinweis)
   - Kategorien werden als Platzhalter angelegt — finale Liste kommt in 10.6

4. Kategorie-Konstanten zentral in `shared/types/notifications.ts` definieren:
   - `NOTIFICATION_CATEGORIES` — Array mit `id`, `label`, `channels: ('email' | 'push')[]`
   - Basis für UI und Validierung

**Output:** User kann Preferences konfigurieren und speichern  
**Kontext-Files:** `server/api/user/notification-preferences.ts`, `shared/types/notifications.ts`, `/profil`-Seite

---

### 10.6 — Notification Events verdrahten `[Kategorien TBD]`

**Ziel:** Alle definierten Notification-Kategorien sind verdrahtet — d.h. die richtigen Server-Events lösen Push (und ggf. E-Mail) aus.

**Voraussetzung:** Kategorie-Liste wird vor dieser Session in einem separaten Gespräch festgelegt und hier ergänzt.

**Was zu tun ist (generisch):**

1. Finale Kategorien in `NOTIFICATION_CATEGORIES` eintragen (löst 10.5-Platzhalter ab)

2. Push-Versand in die bestehenden Action-Handler einbauen:
   - Analog zu den E-Mail-Calls in den API-Routen
   - Fehler beim Push-Versand dürfen die Hauptaktion nicht blockieren (fire-and-forget mit Error-Logging — gleiche Strategie wie E-Mail)

3. Für Broadcast-Kategorien (z.B. "Neues Event angelegt → alle Mitglieder"):
   - Alle User mit `push.new_event = true` aus DB holen (JSON-Extract-Query auf `notification_preferences`)
   - Deren aktive Subscriptions laden und Push versenden

4. Manuelle Tests für alle Trigger

**Offene Punkte (vor Session klären):**
- Welche Kategorien gibt es exakt? (inkl. Push-only vs. E-Mail+Push)
- Default-Werte pro Kategorie (opt-in vs. opt-out)
- Soll es auch einen Admin-only-Push geben (z.B. "Dringende Anmeldung < 3 Tage vor Frist")?

**Kontext-Files:** `server/push/service.ts`, alle relevanten API-Routen, `shared/types/notifications.ts`

---

## Feature-Coverage

| Feature | Status |
|---|---|
| PWA installierbar | — |
| Push-Subscription (Subscribe/Unsubscribe) | — |
| Opt-in-Flow (Banner + Modal + iOS-Handling) | — |
| Notification Preferences (E-Mail + Push, pro Kategorie) | — |
| Push-Versand aus Server-Actions | — |
| Kategorien & Defaults definiert | 🔲 Vor 10.6 klären |
