# Schritt 4 — Design System & Layout: Code-Vorbereitung

_Stand: 2026-04-01_

## Kontext

Alle Design-Entscheidungen sind in `.impeccable.md` dokumentiert (Navigation-Pattern, UserMenu-Struktur, Badge-Farbtokens, Komponenten-Philosophie). Dieses File ist die **Code-Checkliste** für die Implementierungs-Session.

Relevante Kontext-Files für den nächsten Chat:
- `.impeccable.md` — Design-Entscheidungen und Tokens
- `app/app.vue` — App-Shell (Header, Footer)
- `app/components/UserMenu.vue` — UserMenu (Desktop-Popover + Mobile-Expanded)
- `app/pages/index.vue` — Startseite (Event-Liste, Demo-Stand)

---

## Was zu tun ist

### 1. UserMenu erweitern (`app/components/UserMenu.vue`)

**Ziel:** Link "Meine Anmeldungen" in das Popover (Desktop) und den Expanded-Bereich (Mobile) einfügen.

**Position:** Zwischen User-Info-Block und Color-Mode-Toggle — in beiden Varianten (Desktop-Popover und Mobile-Expanded).

**Route:** `/meine-anmeldungen` (Seite existiert noch nicht — Link trotzdem einbauen, Seite kommt später)

**Kontext:** UserMenu hat zwei Template-Branches:
- `v-if="expanded"` → Mobile Drawer (ab Zeile 21 in UserMenu.vue)
- `UPopover` → Desktop (ab Zeile 71)
Beide müssen angepasst werden.

---

### 2. Admin-Link im Footer (`app/app.vue`)

**Ziel:** Im Footer-Right-Slot einen Link zum Admin-Bereich hinzufügen, der **nur für `role === 'admin'`** sichtbar ist.

**Route:** `/admin` (Seite existiert noch nicht — Link trotzdem einbauen)

**Kontext:** Footer-Right hat aktuell nur den GitHub-Button. Admin-Link davor einfügen, per `v-if="user?.role === 'admin'"`.

Session-Objekt hat `role` verfügbar: `const { user } = useUserSession()`

---

### 3. `BasePage` und `BaseLayer` entfernen

**Entscheidung:** Beide Komponenten werden nicht weitergebaut (Begründung in `.impeccable.md`).

**Vorgehen:**
- `app/components/base/Page.vue` löschen
- `app/components/base/Layer.vue` löschen
- `app/pages/events.vue` prüfen — nutzt beide noch als Placeholder. Den Inhalt durch direkte Struktur ersetzen (oder leer lassen, kommt in Schritt 10)
- Sicherstellen, dass sonst nichts mehr auf `BasePage` / `BaseLayer` referenziert

---

### 4. Color-Mode-Button im Footer prüfen

Der Footer hat aktuell `<UColorModeButton />` im `#left`-Slot. Das UserMenu hat ebenfalls einen Color-Mode-Toggle.

**Entscheidung:** Footer-Button bleibt — er ist der Fallback für nicht eingeloggte Nutzer (Login-Seite sieht kein UserMenu). Keine Änderung nötig, nur bewusst so gelassen.

---

### 5. `events.vue` als Placeholder klären

`app/pages/events.vue` ist ein minimaler Placeholder, der noch `BasePage` / `BaseLayer` nutzt. Nach dem Löschen der Komponenten (Punkt 3): Inhalt auf ein einfaches `<div>Events (kommt bald)</div>` oder ähnlich reduzieren — keine echte Implementierung hier, das ist Schritt 10.

---

## Was bewusst NICHT hier gemacht wird

- Keine Implementierung der Event-Liste (Schritt 10)
- Keine Route `/meine-anmeldungen` implementieren — nur verlinken
- Keine Route `/admin` implementieren — nur verlinken
- Kein Badge-Komponent bauen — kommt wenn gebraucht
- `index.vue` bleibt as-is (Demo-Stand mit Skeleton)

---

## Akzeptanzkriterien für diese Session

- [x] UserMenu zeigt "Meine Anmeldungen"-Link (Desktop + Mobile)
- [x] Footer zeigt Admin-Link für Admins
- [x] `BasePage` / `BaseLayer` gelöscht, `events.vue` bereinigt
- [x] App startet ohne Fehler (`pnpm dev`)
- [x] Kein TypeScript-Fehler (`pnpm typecheck`)

**Status: Abgeschlossen** — 2026-04-01
