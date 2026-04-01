# Schritt 2 — Interview: Scope & neue Anforderungen

_Geführt am 2026-03-31 mit Paul_

---

## Auth & Zugang

- **Kein anonymer Flow mehr.** Alles hinter Login — keine öffentlichen Seiten, keine E-Mail-Eingabe ohne Account.
- Magic-Link bleibt das Auth-Verfahren (bereits in v2 implementiert).
- Anmeldung zu einem Event: direkt als eingeloggter User, kein separater Bestätigungs-Flow per Token nötig.
- **Admin-Rolle:** ~10 Personen. Umsetzung offen — boolean in `users`-Tabelle oder Attribut aus Campai. Wird bei Implementierung ausgearbeitet.

---

## Event-Typen (zentrales Datenmodell-Thema)

Drei grundlegende Typen, die im Datenmodell von Anfang an berücksichtigt werden sollen:

| Typ             | Beschreibung                                                                 | Anmeldung                     | Bestätigung durch Admin |
|-----------------|------------------------------------------------------------------------------|-------------------------------|-------------------------|
| **LADV**        | Externer Wettkampf mit LADV-Ausschreibungs-ID, Daten via LADV-API            | Pflicht (mit Disziplin)       | Ja (nach manueller LADV-Meldung) |
| **Wettkampf**   | Normaler Vereinswettkampf ohne LADV, manuell angelegt                        | Pflicht                       | Optional / einfacher    |
| **Training / Vereinsevent** | Training, Teamevents, sonstiges — **Can-Feature**, aber im Datenmodell vorsehen | Freiwillig (Ja/Nein/Vielleicht) | Nein                  |

- Training/Vereinsevents: keine Bestätigung nötig, nur Sichtbarkeit wer kommt.
- "Vielleicht"-Status sinnvoll für alle Typen **außer LADV**.

---

## LADV-Daten & Matching

- Matching über **Ausschreibungs-ID** (1:1, eindeutig).
- Rohdaten als JSON in der DB speichern (`ladv_data`).
- Bestimmte Felder existieren sowohl in LADV-Daten als auch bei normalen Events: Name, Datum, Location usw.
- **Offene Frage für spätere Ausarbeitung:** Welche Felder haben Präzedenz — LADV-Daten oder manuelle Überschreibung durch Admin? Soll beides möglich sein?

---

## Disziplinen & Altersklassen

- **Disziplinen:** Bei LADV-Events durch die Ausschreibung vorgegeben (Liste aus LADV-Daten). Athlet wählt bei Anmeldung aus dieser Liste.
- **Altersklassen:** User trägt selbst ein. Automatische Berechnung aus Geburtsdatum wäre nett, aber zu komplex für v2 — vorerst Freitext oder Auswahl.

---

## Anmeldung & Notizen

- **Notiz-Feld** (`notes`) bleibt erhalten — dient als Info an Admins (z.B. besondere Hinweise).
- Registrierungs-Status für LADV-Events: `pending` → `confirmed` (nach Admin-Nachpflege) / `canceled`.
- Für Training/Vereinsevents: `yes` / `no` / `maybe`.

---

## LADV-Workflow (Admin)

- Kevin meldet Teilnehmer **manuell auf der LADV-Website** an/ab.
- Danach **Nachpflege in der App** (Status setzen: angemeldet / abgemeldet bei LADV).
- Die App protokolliert Coach-Name + Zeitpunkt (wie in v1).
- Auf Basis dieser Statusänderung können **Notifications** an Teilnehmer rausgehen.

---

## Kommentare & Ankündigungen

- **Öffentliche Kommentare** auf Events: alle eingeloggten Mitglieder können kommentieren.
- Emoji-Reaktionen (WhatsApp-Stil): **Bonus-Feature**, nicht essentiell.
- **Admin-Ankündigungen / Notizen** auf Events: wichtig — eigener Typ, von Admins verfasst, für alle sichtbar.

---

## E-Mail-Benachrichtigungen

### Synchron (Must)
| Auslöser                          | Empfänger      |
|-----------------------------------|----------------|
| Anmeldung zu Event                | Teilnehmer     |
| Abmeldung                         | Teilnehmer     |
| Admin meldet bei LADV an          | Teilnehmer     |
| Admin meldet bei LADV ab          | Teilnehmer     |
| Dringende Anmeldung (< 3 Tage)    | Coaches/Admins |

### Asynchron / Cronjob (Can — niedrige Prio)
- 5 Tage vor Meldefrist: Erinnerung an Teilnehmer
- 3 Tage vor Meldefrist: Hinweis an Coaches
- 2 Tage vor Event: Info an Teilnehmer
- 3 Tage nach Anmeldung ohne Bestätigung: Nachfrage

---

## Architektur-Hinweise

- **Weniger Abstraktion:** In v1 waren Service-Layer und API-Clients unnötig komplex für ein Solo-Projekt. v2 soll bewusst einfacher gehalten werden — direkter Code, keine spekulativen Abstraktionen.
- Rohdaten (LADV JSON) direkt speichern statt zu normalisieren, solange es nicht nötig ist.

---

## Offene Punkte für spätere Ausarbeitung

1. **LADV-Feldpräzedenz:** Welche Felder können durch Admin überschrieben werden, welche kommen immer aus LADV?
2. **Admin-Rolle:** Boolean vs. Campai-Attribut — bei Implementierung entscheiden.
3. **Altersklassen:** Automatik aus Geburtsdatum als späteres Enhancement möglich.
4. **Emoji-Reaktionen:** Bonus-Feature, nach MVP.
5. **Training/Vereinsevents:** Can-Feature, Datenmodell aber von Anfang an vorbereiten.
