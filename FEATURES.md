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

- Event-Liste (`GET /api/events`) mit Filterung nach Typ (`ladv`, `competition`, `training`, `social`) und Status
- Sortierung: aktive Events aufsteigend nach Datum, vergangene Events absteigend
- Event-Detail-Seite mit LADV-Daten, Anhängen (direkt als Datei öffnen), Anmeldeformular und Admin-Sektion
- Event anlegen (Admin) und bearbeiten — inkl. Uhrzeit und Dauer — #18
- Event absagen und reaktivieren
- LADV-Event importieren via LADV-ID (`POST /api/events/ladv-import`)
- LADV-Daten synchronisieren (`POST /api/events/[id]/sync`)
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

---

## Admin

- Admin-Bereich (`/admin`) mit Übersicht offener LADV-Todos
- LADV-Todo-Liste: sortiert nach Meldefrist, gruppiert nach dringlich/normal — #20
- Avatar-Verwaltung (`/admin/avatare`): Campai-Avatare über Browser-Proxy laden und in D1 cachen — #4
- Member-Sync manuell auslösen (ruft Campai-API auf, aktualisiert `users`-Tabelle)

---

## Member-Sync

- Automatische Synchronisation aktiver Mitglieder von der Campai-API in die lokale `users`-Tabelle
- Ausgelöst per Cron (`POST /api/cron/sync-members`, Bearer-Token) oder manuell über Admin-UI
- `avatarNeedsResync`-Flag: wird gesetzt wenn Campai-Avatar-URL sich ändert

---

## Superuser

- Seed-Endpunkt (`POST /api/superuser/seed`) für Entwicklungs- und Preview-Daten
- Superuser-Seite (`/superuser`) mit Seed-Trigger
