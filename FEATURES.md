# Features

Hochrangige Übersicht aller implementierten Features. Details und Hintergrund in den verlinkten GitHub Issues. Wird durch den `/review`-Skill am Ende jeder Session aktualisiert.

---

## Auth

- Magic-Link-Login (passwordless, E-Mail → Token mit 15 min TTL → Session-Cookie, single-use)
- Session-Schutz: alle Routen außer `/login` und `/link-gesendet` erfordern Login (Client- + Server-Middleware)
- Login-Sperre für inaktive Mitglieder (`membershipStatus !== 'active'`) — kein Status-Leak nach außen — #33
- Login-Redirect-Flow: `?redirect=` Query-Parameter leitet nach Login auf Zielseite weiter — #33
- Fehlerfeedback beim Login: Inline-Alert statt Toast, inkl. 404 bei unbekannter E-Mail — #51
- Bot-Schutz via Cloudflare Turnstile (client- + serverseitig verifiziert) — #51
- Rate-Limiting: max. 10 Versuche pro IP / 5 Minuten (Fixed Window via KV) — #51

---

## Events

- Event-Liste (`GET /api/events`) mit Filterung nach Typ (`ladv`, `competition`, `training`, `social`) und Status; im Filter werden `ladv` und `competition` als "Wettkampf" zusammengefasst — #126
- Event-Listen-Filter: Toggle-Buttons für Typ, Zeitraum, Streckentyp, Meisterschaft, Priorität und WRC; Disziplin und Altersklasse als Selects — #124, #127
- Mobiler Filter-Toggle: Typ-Buttons immer sichtbar, restliche Filter per Toggle einblendbar — #127
- Sortierung: aktive Events aufsteigend nach Datum, vergangene Events absteigend
- Event-Detail-Seite mit LADV-Daten, Anhängen (direkt als Datei öffnen), Anmeldeformular und Admin-Sektion
- Event anlegen (Admin) und bearbeiten — inkl. Uhrzeit und Dauer — #18
- Event absagen und reaktivieren
- LADV-Event importieren via LADV-ID (`POST /api/events/ladv-import`)
- LADV-Daten synchronisieren (`POST /api/events/[id]/sync`)
- Nächtlicher LADV-Bulk-Sync: alle noch kommenden LADV-Events täglich via Cron aktualisiert; manuell überschriebene Felder bleiben erhalten (`detectLadvDiff`) — #136
- Google-Maps-Suchlink für LADV-Veranstaltungsort
- Event-Priorität A / B / C für `ladv`- und `competition`-Events — #23
- Öffentliche Event-Detailseite für nicht eingeloggte Gäste: Registrierungszähler sichtbar, Login-CTA statt Anmeldeformular — #36
- Kurze Event-URLs via Sqids (Integer-PKs, enkodierte Event-IDs in URLs, z. B. `/wrnk`) — #38
- Dynamische OG Images via `nuxt-og-image` (Satori, Edge-kompatibel): Default-Template für alle Seiten, Event-Template (Props-Verdrahtung ausstehend → #40) — #39

---

## Anmeldungen

- Anmeldung zu einem Event erstellen (Member meldet sich selbst an)
- Disziplinen zu einer Anmeldung hinzufügen und entfernen
- Anmeldung bearbeiten (Startnummer, Notiz, Altersklasse)
- LADV-Anmeldung und -Abmeldung über interne Proxy-Endpunkte
- Eigene Anmeldungen unter `/meine-anmeldungen` einsehen
- Admin-Proxy-Anmeldung: Admins können auf jeder Event-Detailseite Mitglieder direkt anmelden — User-Search + typ-spezifisches Formular, reaktiviert stornierte Anmeldungen, bei LADV optional sofortiger LADV-Stand — #118

---

## Admin

- Admin-Bereich (`/admin`) mit Übersicht offener LADV-Todos
- LADV-Todo-Liste: sortiert nach Meldefrist, gruppiert nach dringlich/normal — #20
- Anmeldeliste am LADV-Event: pro Person ein LADV-Status-Badge (ok / Diff / Abmelden offen / kein Stand) plus Summary-Zeile mit Zählern für Admins — #117
- Avatar-Verwaltung (`/admin/avatare`): Campai-Avatare über Browser-Proxy laden und in D1 cachen — #4
- Member-Sync manuell auslösen (ruft Campai-API auf, aktualisiert `users`-Tabelle)
- Mitglieder-Listen-Endpoint `GET /api/admin/members` (admin-only, aktive Mitglieder mit Avatar-Flag) — #118

---

## Member-Sync

- Automatische Synchronisation aktiver Mitglieder von der Campai-API in die lokale `users`-Tabelle
- Ausgelöst per Cron (`POST /api/cron/sync-members`, Bearer-Token) oder manuell über Admin-UI
- `avatarNeedsResync`-Flag: wird gesetzt wenn Campai-Avatar-URL sich ändert

---

## Superuser

- Seed-Endpunkt (`POST /api/superuser/seed`) für Entwicklungs- und Preview-Daten
- Superuser-Seite (`/superuser`) mit Seed-Trigger und Push-Test-Trigger

---

## Benachrichtigungen

- Zentrales Notification-System als Abstraktionsschicht zwischen Trigger und Zustellkanal — Epic #55
- DB-Tabellen: `notification_jobs`, `notification_deliveries`, `notification_preferences`, `push_subscriptions` — #56
- `notificationService.enqueue()` legt Jobs (`status='pending'`) in die D1-Queue — API-Handler blockieren nur für den INSERT (<50ms), Zustellung erfolgt asynchron
- Preference-Resolution (mandatory > user override > default) und Per-Delivery-Logging beim Versand — #57
- E-Mail-Templates für alle Notification-Typen in `app/emails/` — #58
- Preferences-UI unter `/profil/benachrichtigungen` (E-Mail/Push-Toggles pro Kategorie, mandatory-Toggles disabled, zusammengehörige Typen in einer Gruppe) — #63, #140
- Trigger zentral in `server/notifications/triggers.ts` (alle als `triggerXxxNotification`) — Endpoints rufen synchron awaited auf, damit der Job-INSERT in Cloudflare Workers nicht durch Response-Termination verloren geht — #133
- Verdrahtete Trigger in API-Handlern (legen jeweils einen Queue-Job an) — #64, #119, #129
  - N-01 LADV-Meldung bestätigt → Mitglied (mit lesbaren Disziplin-/AK-Labels)
  - N-02 LADV-Meldung zurückgezogen → Mitglied
  - N-03 Athlet storniert Anmeldung nach erfolgter LADV-Meldung → alle Admins (`athlete_canceled_after_ladv`) — #129
  - N-03b Athlet ändert Wunschstand nach erfolgter LADV-Meldung → alle Admins (`athlete_changed_after_ladv`)
  - N-04 Event abgesagt → alle aktiv Angemeldeten
  - N-05 Neues Event (manuell oder via LADV-Import) → alle aktiven Mitglieder
  - N-09 Anmeldebestätigung bei Anmeldung zu LADV-Wettkampf → Mitglied (`registration_confirmation`) — #129
  - Admin meldet Mitglied an (`admin_registered_member`) → Mitglied; bei sofortigem LADV-Stand stattdessen N-01; inkl. Admin-Name in E-Mail — #119, #129
  - Admin ändert Anmeldung eines Mitglieds (`admin_changed_member_registration`) → Mitglied; inkl. Admin-Name in E-Mail — #119, #129
  - `silent`-Flag in `PATCH /api/registrations/[id]`: unterdrückt die generische `admin_changed_member_registration`-Notification wenn der Aufrufer bereits eine spezifischere Notification verschickt hat — #140
  - Admin-E-Mails (`athlete_canceled_after_ladv`, `athlete_changed_after_ladv`, `reminder_deadline_admin`) verwenden "Liebe Coaches" als Anrede — #140
- Queue-Worker `processQueue()` verarbeitet `pending | failed` Jobs parallel per `Promise.allSettled` (Recipients × Channels), mit Exponential-Backoff (max. 3 Versuche), 15 s Per-Send-Timeout pro Email/Push und Timeout-Reset für >5 min hängende `processing`-Jobs — #133
- Cron-Endpoints (Bearer-Auth via `NUXT_CRON_TOKEN`): — #65
  - `POST /api/cron/process-notifications` — Queue abarbeiten (jede Minute)
  - `POST /api/cron/send-reminders` — N-06 (Meldefrist Athlet, 5 Tage, inkl. Wunsch-Disziplinen in der E-Mail), N-07 (Meldefrist Admin, 3 Tage), N-08 (Event in 2 Tagen) inkl. Deduplizierung über `notification_jobs` — #140
  - `POST /api/cron/cleanup-notifications` — löscht `done`-Jobs älter als 90 Tage (Deliveries via Cascade)
- Cron-Trigger via separaten Cloudflare-Worker (`cron-worker/`) — pingt die Nuxt-Cron-Endpoints gemäß Schedule (`* * * * *`, `0 7 * * *`, `0 2 * * 0`, `0 1 * * *`), weil Cloudflare Pages keine nativen Cron-Triggers hat
- Superuser-Dashboard `/superuser/notifications` — Liste aller Jobs mit Status-/Typ-Filtern, Paginierung, expandierbaren Delivery-Details und Retry-Button für `failed`-Jobs — #66

---

## PWA

- Installierbare PWA via `@vite-pwa/nuxt` (Manifest, Service Worker, Icons) — Voraussetzung für Web Push auf iOS — #59
- `injectManifest`-Strategie mit eigenem Service Worker (`app/service-worker/sw.ts`) — `push` + `notificationclick` + minimaler `precacheAndRoute` für Nuxt-Update-Manifest
- PWA-Icons (192/512, maskable, Apple-Touch-Icon 180) in `public/icons/` bzw. `public/apple-touch-icon.png`
- Theme-Color `#ffb700` (BTC Yellow), Background `#18181b` (Zinc 900), Display `standalone`

---

## Push Notifications

- VAPID-basierter Push-Service via `@block65/webcrypto-web-push` (Cloudflare-Workers-kompatibel) — #60
- Subscription-API: `POST /api/push/subscribe` (Upsert), `DELETE /api/push/subscribe`, `GET /api/push/vapid-public-key`
- Per-Endpoint-Zustellung mit automatischem Aufräumen abgelaufener Subscriptions (HTTP 410/404)
- Composable `usePushNotifications` mit Support-/Permission-/Subscription-/iOS-/PWA-Detection und subscribe/unsubscribe — #61
- Abgleich Browser-Push mit D1 auf `/profil/benachrichtigungen` (`reconcileWithServer`), Push-Toggles nur bei erfolgreichem Server-Sync — #109
- Persistenter Top-Banner (`PushBanner.vue`) für nicht-abonnierte User, dismiss-Persistenz via localStorage
- Modal (`PushModal.vue`) mit drei Modi: iOS-Installationsanleitung, Browser-blockiert-Hinweis, Aktivierungs-Flow mit Kategorie-Übersicht
- Test-Push-Endpoint `POST /api/superuser/test-push` (sendet an alle Geräte des Superusers)
