# Schritt 11 — Avatar-Caching: Browser-Admin-Script + D1

_Stand: 2026-04-08_

---

## Wie dieser Plan zu nutzen ist

Jede Session bekommt dieses Dokument als Einstieg.
Sessions sind sequenziell — jede baut auf dem Output der vorherigen auf.
Abgeschlossene Sessions werden hier als ✅ markiert.

**Kontext-Files für alle Sessions:** `CLAUDE.md`, `server/db/schema.ts`, `server/utils/sync-members.ts`, `app/components/UserMenu.vue`, `app/pages/meine-anmeldungen.vue`

**Nach jeder Session:**
1. Tests ausführen: `/test`
2. Wenn Tests grün: committen
3. Abschnitt im Plan mit ✅ markieren, Inhalt erhalten, kurze Abschluss-Notiz (`**Abschluss:**`) ergänzen

**Branch:** Alle Arbeiten auf `develop`.

---

## Ausgangssituation & Problemstellung

Profilbilder werden über externe Campai-API-Links geladen:
`https://api.campai.com/storage/download/{path}`

- Die API ist langsam (externe Requests bei jedem Seitenaufruf)
- Keine Kontrolle über Cache-Headers
- Bilder sind ~200 KB groß (quadratisches WebP), werden aber nur als 32–64px Thumbnails angezeigt
- Bei ~100 Usern entsteht unnötiger Traffic und schlechte UX

## Zielzustand

- Avatare werden **einmalig** von Campai geladen und klein (resized) in D1 gespeichert
- Ein API-Endpoint serviert sie mit langen Cache-Headern — Browser cached, kein Bild wird doppelt geladen
- Für die Profilseite (`meine-anmeldungen`) gibt es eine leicht größere Variante
- Keine externen Dienste, keine Kreditkarte, kein R2 benötigt

---

## Technische Entscheidungen

### Warum kein R2/Blob?
Cloudflare R2 erfordert eine hinterlegte Kreditkarte — nicht erwünscht.

### Warum kein externes CDN (Cloudinary etc.)?
Für 100 interne Club-Member ist eine dauerhafte externe Abhängigkeit vermeidbar und unnötig.

### Warum nicht serverseitig resizen?
Im Cloudflare Workers Runtime gibt es kein `sharp` und keinen nativen Canvas. WASM-Bibliotheken (z.B. `@cf-wasm/photon`) wären möglich, aber unverhältnismäßig aufwändig.

### Gewählter Ansatz: Browser-Admin-Script + D1 Base64

Der Browser hat nativen Canvas-Support. Ein Admin-Tool läuft einmalig im Browser des Admins, lädt alle Avatare über einen Server-Proxy (CORS-safe), resizet sie per Canvas und speichert das Ergebnis als JPEG-Base64 in D1.

**Größenrechnung:**
- 200 KB WebP → 64×64px JPEG (80% Qualität) → ~4 KB → Base64: ~5–6 KB
- 200 KB WebP → 128×128px JPEG (85% Qualität) → ~12 KB → Base64: ~16 KB
- 100 User × (6 + 16) KB = **~2,2 MB gesamt in D1** — problemlos

### Zwei Größen

| Größe | Spalte | Verwendung |
|-------|--------|------------|
| 64×64 JPEG | `avatar_small` | Überall (Header, Listen, Nav) |
| 128×128 JPEG | `avatar_large` | Profilseite (`meine-anmeldungen`) |

### Serving & Caching

- Neue Route `/api/avatar/[userId]?size=small|large`
- Header: `Cache-Control: public, max-age=31536000, immutable`
- ETag basierend auf einem Hash (oder Timestamp der letzten Änderung) → Browser revalidiert nur wenn sich der ETag ändert
- `UAvatar` bekommt die interne URL statt der Campai-URL

---

## Sessions

---

### ✅ 11.1 — DB-Schema + Serve-Endpoint

**Ziel:** Neue Spalten für Avatar-Daten in D1, Basis-Serve-Endpoint mit Cache-Headers.

**Was zu tun ist:**

1. **Schema-Änderung** in `server/db/schema.ts`:
   ```ts
   avatarSmall: text(),  // base64 JPEG, 64×64
   avatarLarge: text(),  // base64 JPEG, 128×128
   avatarUpdatedAt: text(), // ISO-Timestamp, für ETag
   ```

2. **Migration generieren:** `pnpm db:generate` (keine manuelle SQL-Datei!)

3. **Serve-Endpoint** `server/api/avatar/[userId].get.ts`:
   - Query-Parameter `size`: `'small'` (default) oder `'large'`
   - User aus DB laden, entsprechende Spalte zurückgeben
   - Base64-String → Buffer → Response mit `Content-Type: image/jpeg`
   - Cache-Headers setzen:
     ```
     Cache-Control: public, max-age=31536000, immutable
     ETag: "{avatarUpdatedAt}"
     ```
   - Wenn kein Avatar gespeichert: `404` zurückgeben (Frontend fällt auf Initialen zurück)
   - Kein Auth-Guard nötig (Avatare sind nicht sensibel)

4. **Kein Frontend-Update in dieser Session** — Endpoint zuerst testen

**Testbar:** Endpoint mit Postman/curl testen (404 bei leerem Avatar erwartet).

**Abschluss (2026-04-08):** Schema-Änderung, Migration (0005_fat_sauron.sql) und Serve-Endpoint inklusive ETag/304-Support fertig. Typecheck und Linting sauber.

---

### ✅ 11.2 — Admin-Tool: Avatare verarbeiten

**Ziel:** Admin-seitige UI, die Avatare aller User herunterlädt, resizet und in D1 speichert.

**Was zu tun ist:**

1. **Proxy-Endpoint** `server/api/admin/avatar-proxy/[userId].get.ts`:
   - Nur für Admins (Auth-Guard: `role === 'admin' || role === 'superuser'`)
   - Liest `avatarUrl` des Users aus DB
   - Fetcht das Bild von der Campai-URL server-seitig (`$fetch` / `fetch`)
   - Gibt den rohen Image-Buffer zurück (`Content-Type: image/webp` oder whatever Campai liefert)
   - Zweck: CORS-Problem umgehen — Browser kann nicht direkt von `api.campai.com` laden

2. **Save-Endpoint** `server/api/admin/avatar-save/[userId].post.ts`:
   - Nur für Admins
   - Erwartet JSON-Body: `{ small: string, large: string }` (base64 JPEG, ohne Data-URL-Prefix)
   - Speichert beide Spalten + setzt `avatarUpdatedAt` auf `new Date().toISOString()`
   - Gibt `{ ok: true }` zurück

3. **Admin-UI-Komponente** `app/components/admin/AvatarProcessor.vue`:
   - Wird auf der bestehenden Admin-Seite oder in einem eigenen Admin-Bereich eingebunden
   - Zeigt alle User mit `avatarUrl` in einer Liste (Status: ausstehend / verarbeitet / Fehler)
   - "Alle verarbeiten"-Button startet sequenziell (nicht parallel — Rate-Limiting vermeiden):
     ```
     für jeden User:
       1. GET /api/admin/avatar-proxy/[userId] → ArrayBuffer
       2. Blob → <img> laden (Promise)
       3. Canvas 64×64 zeichnen → toBlob('image/jpeg', 0.80) → base64
       4. Canvas 128×128 zeichnen → toBlob('image/jpeg', 0.85) → base64
       5. POST /api/admin/avatar-save/[userId] mit { small, large }
       6. Status aktualisieren
     ```
   - Canvas-Logik (Browser-nativ, kein npm-Paket nötig):
     ```ts
     function resizeToBase64(blob: Blob, size: number, quality: number): Promise<string> {
       return new Promise((resolve) => {
         const img = new Image()
         const url = URL.createObjectURL(blob)
         img.onload = () => {
           const canvas = document.createElement('canvas')
           canvas.width = size
           canvas.height = size
           canvas.getContext('2d')!.drawImage(img, 0, 0, size, size)
           canvas.toBlob(
             (b) => {
               const reader = new FileReader()
               reader.onload = () => resolve((reader.result as string).split(',')[1])
               reader.readAsDataURL(b!)
             },
             'image/jpeg',
             quality
           )
           URL.revokeObjectURL(url)
         }
         img.src = url
       })
     }
     ```
   - Progress-Anzeige (z.B. `12/87 verarbeitet`)
   - Fehlerbehandlung: User überspringen, weitermachen, Fehler am Ende anzeigen

4. **Route/Page**: Komponente in eine bestehende Admin-Seite einbauen oder eigene Route `/admin/avatare`. Muss hinter dem Auth-Guard liegen.

**Abschluss (2026-04-08):** Proxy-, Save- und Users-Endpoint implementiert. Admin-UI mit sequenziellem Processing, Canvas-Resize (64×64 + 128×128), Progress-Anzeige und Fehlerbehandlung fertig. Campai-404 (veraltete Avatar-URLs) wird als `no-avatar`-Status behandelt und nicht als Fehler gezählt. Admin-Layout mit UTabs (Link-Variante, route-basiertes v-model) neu eingeführt — `/admin` leitet auf `/admin/ladv-todos` weiter, `/admin/avatare` eingebunden.

---

### ✅ 11.3 — Frontend-Integration

**Ziel:** `UAvatar` überall auf die internen Avatar-URLs umstellen, Fallback auf Initialen erhalten.

**Was zu tun ist:**

1. **Composable** `app/composables/useAvatarUrl.ts`:
   ```ts
   export function useAvatarUrl(userId: string, size: 'small' | 'large' = 'small') {
     return `/api/avatar/${userId}?size=${size}`
   }
   ```
   Einfach gehalten — gibt immer die interne URL zurück. Der Endpoint gibt 404 wenn kein Avatar vorhanden, `UAvatar` zeigt dann Initialen (per `alt`-Prop).

2. **Session-Objekt aufräumen:**
   - `avatarUrl` (Campai-URL) aus der Session entfernen oder leer lassen — nicht mehr nötig
   - Session enthält `id`, daraus wird die Avatar-URL im Frontend berechnet
   - `shared/types/auth.d.ts` anpassen: `avatarUrl` entfernen oder deprecaten
   - `server/routes/verify.get.ts` anpassen: `avatarUrl` nicht mehr in Session setzen

3. **`app/components/UserMenu.vue`** anpassen:
   - `useAvatarUrl(user.id, 'small')` für die Nav-Avatare (3 Stellen: Sidebar, Header, Popover)

4. **`app/pages/meine-anmeldungen.vue`** anpassen:
   - `useAvatarUrl(user.id, 'large')` für das Profil-Avatar (128px)

5. **`UAvatar` Fehlerverhalten prüfen:**
   - Nuxt UI `UAvatar` zeigt bei 404 nichts an — `alt`-Prop (Initialen) übernimmt dann.
   - Sicherstellen dass `alt` oder `#default`-Slot mit Initialen korrekt greift.

**Abschluss (2026-04-08):** Composable `useAvatarUrl` erstellt. `avatarUrl` aus Session-Typ und `verify.get.ts` entfernt. `UserMenu.vue` (3 Stellen) und `meine-anmeldungen.vue` auf interne `/api/avatar/[userId]?size=...`-URLs umgestellt. `alt`-Prop mit vollem Namen überall gesetzt → Nuxt UI erzeugt daraus zwei Großbuchstaben als Fallback. `@nuxt/image` entfernt (IPX blockierte interne API-Pfade mit 403). Avatare zusätzlich in `EventRegistrationList`, `EventAdminLadvTodos` und `LadvTodoModal` ergänzt.

---

### 11.4 — Sync-Cleanup: Resync-Flag

**Ziel:** Wenn Campai eine neue `avatarUrl` liefert, soll das Admin-Tool sichtbar machen, dass ein Re-Caching nötig ist — ohne das bereits gecachte Bild zu löschen.

**Entscheidung:** `avatarUrl` in der DB **behalten** — wird im Admin-Tool als Quelle für das Processing gebraucht.

**Ansatz:** Flag statt Löschen — das gecachte Bild bleibt erhalten bis ein neues da ist.

**Was zu tun ist:**

1. **Schema:** Neue Spalte `avatarNeedsResync: integer` (0/1, default 0) in `users`

2. **`server/utils/sync-members.ts`:** Beim Update prüfen ob sich `avatarUrl` geändert hat → `avatarNeedsResync: 1` setzen. Gecachte Bilder bleiben unberührt.

3. **`server/api/admin/avatar-save/[userId].post.ts`:** Nach erfolgreichem Speichern `avatarNeedsResync: 0` zurücksetzen.

4. **`server/api/admin/users-with-avatar.get.ts`:** `avatarNeedsResync` ins Select aufnehmen.

5. **`app/components/admin/AvatarProcessor.vue`:**
   - Neuer Status `'outdated'` für User mit gecachtem Bild aber gesetztem Flag
   - Badge: gelb, "Veraltet — Avatar-URL geändert"
   - `processable` schließt auch `outdated`-User ein

**Abschluss (2026-04-08):** `avatarNeedsResync`-Flag implementiert. Sync-Task erkennt `avatarUrl`-Änderungen und setzt das Flag, ohne gecachte Bilder zu löschen. Admin-Tool zeigt veraltete User mit gelbem Badge und "Neu cachen"-Button. `@nuxt/image` aus `package.json` entfernt. Migration `0006_wild_vengeance.sql` generiert.

---

## Nicht in diesem Plan

- Automatisches Re-Processing bei Campai-Avatar-Änderungen (zu selten, manuell reicht)
- Upload eigener Profilbilder durch User (anderes Feature)
- Animierte Avatare / weitere Formate

---

## Feature-Coverage

| Feature | Session |
|---------|---------|
| DB-Spalten + Serve-Endpoint | 11.1 |
| Admin-Tool: Proxy + Save + UI | 11.2 |
| Frontend-Umstellung | 11.3 |
| Sync-Cleanup | 11.4 (optional) |
