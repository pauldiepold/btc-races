# Schritt 3 — User Stories, Priorisierung & Kevin-Review: Kontext

Dieses File ist der vollständige Einstieg für den nächsten Chat.
Ziel: User Stories formulieren, MoSCoW-priorisieren, Abhängigkeiten markieren, Kevin-Abschnitt anhängen.
Output: `planning/03-user-stories.md`

---

## Was bereits feststeht

### Rollen
| Rolle   | Beschreibung |
|---------|-------------|
| Athlet  | BTC-Mitglied, eingeloggt via Magic-Link |
| Admin   | ~10 Personen (Kevin + Vereinsverantwortliche), verwalten Events und LADV-Meldungen |
| System  | Automatische Prozesse (Campai-Sync, E-Mail-Cronjobs) |

### Event-Typen
| Typ          | Disziplin-Auswahl | Bestätigung durch Admin | Status-Werte                        |
|--------------|-------------------|------------------------|-------------------------------------|
| `ladv`       | Ja (aus LADV-Daten) | Ja (LADV-Tracking)   | `registered` \| `canceled`          |
| `competition`| Optional          | Optional / einfacher   | `registered` \| `canceled` \| `maybe` |
| `training`   | Nein              | Nein                   | `yes` \| `no` \| `maybe`            |

`training` deckt vorerst Training + Teamevents ab — spätere Feindifferenzierung möglich.

### Beschlossenes Datenmodell (Kurzfassung)
Vollständig in `planning/02b-datenmodell-entwurf.md`. Relevante Kerntabellen:
- `events` — eine Tabelle, type-Feld, LADV-Felder nullable
- `registrations` — status (user-kontrolliert) + ladv_registered/canceled_at/by (admin-kontrolliert) + discipline + age_class (nullable)
- `event_comments` — type: `comment` | `announcement`
- `reactions` — Bonus-Feature, Schema vorbereitet

### Auth & Zugang
- Alles hinter Login, kein anonymer Flow
- Magic-Link für alle Mitglieder (bereits implementiert)
- Admin-Rolle: boolean in `users.role` (bereits implementiert als `'admin' | 'member'`)

---

## Feature-Rohlist (aus v1-Analyse + Interview)

### Bereits in v2 implementiert (nicht als Story nötig)
- Magic-Link-Auth (Login, Verify, Logout)
- Campai-Sync (Mitglieder-Sync via Nitro-Task + Cron)
- User-Session-Handling

### Zu formulierende Features

**Events — Athlet**
- Event-Liste anzeigen (mit Filterung nach Typ / Datum)
- Event-Detailseite anzeigen
- Zu Event anmelden (mit Disziplin-Auswahl bei LADV, Notiz optional)
- Anmeldung stornieren
- `maybe`-Interesse signalisieren (competition + training)
- Eigene Anmeldungen / Status einsehen
- Kommentar auf Event schreiben
- Reaktion auf Kommentar setzen (Bonus)

**Events — Admin**
- Event manuell anlegen (competition, training)
- Event aus LADV importieren (per LADV-URL/ID)
- Event bearbeiten
- LADV-Sync manuell auslösen (aktualisiert `ladv_data` + `ladv_last_sync`)
- Hinweis anzeigen wenn LADV-Daten von normalisierten Feldern abweichen (Frontend-Diff)
- Event absagen / löschen
- Anmeldungen aller Teilnehmer einsehen
- Teilnehmer bei LADV anmelden (protokolliert `ladv_registered_at/by`)
- Teilnehmer bei LADV abmelden (protokolliert `ladv_canceled_at/by`)
- Admin-Announcement auf Event verfassen

**E-Mail-Benachrichtigungen — synchron (Must)**
| Auslöser                          | Empfänger      |
|-----------------------------------|----------------|
| Anmeldung zu Event                | Teilnehmer     |
| Stornierung                       | Teilnehmer     |
| Admin meldet bei LADV an          | Teilnehmer     |
| Admin meldet bei LADV ab          | Teilnehmer     |
| Dringende Anmeldung (< 3 Tage)    | Alle Admins    |

**E-Mail-Benachrichtigungen — asynchron / Cronjob (Can)**
- 5 Tage vor Meldefrist: Erinnerung an Teilnehmer mit pending-Anmeldungen
- 3 Tage vor Meldefrist: Hinweis an Admins
- 2 Tage vor Event: Info an Teilnehmer
- 3 Tage nach Anmeldung ohne Bestätigung: Nachfrage (relevant wenn LADV-Tracking noch aussteht)

**System**
- Campai-Sync (bereits implementiert)
- E-Mail-Log / `sent_emails`-Tabelle (in v1 vorhanden, in v2 noch nicht im Schema — muss entschieden werden)

---

## Offene Punkte für den Story-Chat

1. **`sent_emails`-Tabelle:** In v1 vorhanden, in v2 noch nicht. Brauchen wir eine vollständige E-Mail-Protokollierung, oder reicht ein einfacheres Log? Hat Einfluss auf den Schema-Scope.

2. **LADV-Startpass:** In v1 gab es `has_ladv_startpass` pro Mitglied — bei LADV-Events war eine Anmeldung ohne Startpass gesperrt. In v2 ist das Feld nicht im `users`-Schema. Brauchen wir das noch, oder ist das Kevin's Verantwortung außerhalb der App?

3. **Event-Absage vs. Löschen:** Soll ein Event absagbar sein (sichtbar mit `cancelled_at`) oder auch löschbar? Bestimmt ob `DELETE` oder nur `cancelled_at`-Setzen.

4. **Disziplinen bei normalen Wettkämpfen:** ADR-004 hält fest: optional via `disciplines`-JSON-Feld an `events` ergänzbar. Ob wir das als User Story aufnehmen (Could) oder weglassen (Won't für v2) — Entscheidung beim Story-Writing.

---

## Vorgeschlagenes Output-Format für `03-user-stories.md`

```
| ID    | Rolle   | Als ... möchte ich ... damit ...  | Priorität | Abhängigkeiten |
|-------|---------|-----------------------------------|-----------|----------------|
| US-01 | Athlet  | ...                               | Must      | —              |
```

Anschließend: Kevin-Abschnitt mit non-technischer Feature-Übersicht + gezielten Fragen an Kevin (max. 5–6, konkret und entscheidbar).

---

## Referenz-Files
- `planning/01-analyse-v1.md` — Feature-Bestand v1
- `planning/02-interview-notizen.md` — Scope-Entscheidungen
- `planning/02b-datenmodell-entwurf.md` — Vollständiges Datenmodell mit ADRs
