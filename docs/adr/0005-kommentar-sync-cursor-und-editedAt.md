# Kommentar-Sync-Cursor auf `updatedAt`; `editedAt` fürs „bearbeitet"-Label

Für das Live-Propagieren von Edits, Soft-Deletes und (Un-)Pins in andere offene Tabs (siehe `CONTEXT.md`, „Beiträge & Kommentare") trägt `updatedAt` genau eine Bedeutung: „Row zuletzt berührt". Jede Mutation an einem Kommentar — Insert, Body-Edit, Soft-Delete, Pin, Unpin — hebt `updatedAt`. Das Polling holt Kommentare per **einem** Delta `updatedAt >= since` (Cursor = `max(updatedAt)` der gehaltenen Liste) und merged sie clientseitig **per `id` ersetzend**. Das „(bearbeitet)"-Label liest ein separates `editedAt`, das ausschließlich der Body-Edit setzt.

## Considered Options

**Was treibt den Sync-Cursor?**
1. **`updatedAt` = „Row berührt" + neues `editedAt` fürs Label** *(gewählt)* — ein Delta erfasst neu/bearbeitet/gelöscht/gepinnt. Der bisherige `keepUpdatedAt`-Hack (Pin bewahrte `updatedAt`, damit kein falsches „bearbeitet") entfällt. Preis: Schema-Spalte `editedAt` + Backfill.
2. **Zwei Deltas (`createdAt` + `updatedAt`), Pin-Hack bleibt** — der ursprüngliche Issue-Vorschlag. Scheitert am Kernziel: Pin/Unpin bewahren `updatedAt` bewusst, fallen also durch den `updatedAt`-Delta — der „Wichtig"-Block aktualisiert sich gerade *nicht* live.
3. **OR-Query inkl. `pinnedAt`** — kein Schema-Change, aber **Unpin** setzt `pinnedAt = null` und hebt nichts, bleibt also unsichtbar. Korrektheitsloch.

Schema-frei *und* korrekt geht nicht: Pin und Unpin müssen einen monotonen Cursor anheben, und sobald `updatedAt` das tut, braucht „bearbeitet" ein eigenes Signal.

**Client-Merge:** ersetzen per `id` (gewählt) statt nur anhängen — sonst landen Body-/Pin-/Delete-Änderungen an Bestandskommentaren nie im View. Sortierung bleibt `createdAt` (Edits/Pins verschieben einen Kommentar nicht).

## Consequences

- Migration + Backfill: `editedAt := updatedAt WHERE updatedAt > createdAt AND deletedAt IS NULL`. Korrekt, weil der alte Hack `updatedAt` bei reinem Pinnen bewahrte — erhöhtes `updatedAt` an nicht-gelöschten Kommentaren markiert also echte Edits.
- `setCommentPin` verliert den `keepUpdatedAt`-Parameter; Pin/Unpin bumpen `updatedAt` wie jede andere Mutation. Die Tests `pin-comment.test.ts` („does not bump updatedAt") kehren sich um: Pin hebt `updatedAt`, lässt `editedAt` aber `null`.
- Jeder Poll re-fetcht den `updatedAt`-Randkommentar (`gte`, Sekunden-Auflösung) — wie bisher beim `createdAt`-Cursor; der id-Replace macht das idempotent.
- Tombstones bleiben Teil der Liste (Body redigiert), ihr `updatedAt` hält den Cursor über Löschungen hinweg konsistent.
