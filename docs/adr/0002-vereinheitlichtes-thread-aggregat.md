# Vereinheitlichtes Thread-Aggregat; berechnete Kommentar-Empfänger

Der Kommentar-Bereich (Beiträge & Kommentare, siehe `CONTEXT.md`) hat genau ein Aggregat: `threads`. Ein Thread mit gesetztem `eventId` ist der Kommentar-Stream eines Events, ein Thread ohne `eventId` ist ein eigenständiger **Beitrag**. Kommentare hängen immer an einem Thread — es gibt keine separaten `event_comments`. Die Empfänger einer Kommentar-Notification werden zum Sendezeitpunkt aus dem aktuellen Zustand berechnet (Thread-Autor, bisherige Kommentatoren, Event-Teilnehmer); es gibt **keine** materialisierte Subscription-Tabelle, nur eine schlanke Override-Tabelle für explizites Stummschalten/Folgen.

## Considered Options

**Thread-Modell:**
1. **Vereinheitlicht** *(gewählt)* — eine `threads`-Tabelle, `eventId` nullable UNIQUE. Ein Kommentar-Mechanismus, eine Komponenten-Familie, ein Endpoint-Set. Preis: Diskriminator-Verzweigung (Titel/URL/Body je nach `eventId`).
2. **Getrennt** — `event_comments` direkt am Event plus eigenständige `threads`. Kein Diskriminator, aber zwei Mechanismen und doppelte UI.

**Empfänger-Modell:**
1. **Berechnet + Override-Tabelle** *(gewählt)* — Empfänger werden bei jedem Versand aufgelöst. Eine Tabelle speichert nur explizite Abweichungen (`muted`/`following`). Vereinsgröße (~200 Mitglieder) macht die Auflösung billig.
2. **Volle Subscription-Tabelle** — eine positive Row pro Empfänger, Auto-Subscribe-Hooks an mehreren Stellen, Mandatory-Sonderpfad. Mehr Schema, und Auto-Subscribe re-abonniert versehentlich einen gemuteten Thread.

## Consequences

- Event-Threads entstehen eager bei Event-Anlage; jedes Event hat per Invariante genau einen Thread. Ein Backfill für Bestands-Events ist nötig.
- Weil Empfänger zum Sendezeitpunkt berechnet werden, fällt ein Mitglied bei Status `no`/`canceled` automatisch aus dem Verteiler — kein Storno-Hook nötig.
- Ein Mitglied, das nach Anlage eines Ankündigungs-Threads neu dazukommt, wird über *dessen* Folge-Kommentare nicht rückwirkend benachrichtigt — akzeptiert.
