# Domain-Kontext

Geteilte Sprache für Architektur-Entscheidungen und Code-Reviews. Wenn ein Term hier nicht steht, gehört er entweder noch nicht zur Domäne — oder wir müssen ihn schärfen und ergänzen.

## Event-Typ

**Event-Typ** *(`EventType`)* — diskriminiert Domain-Verhalten und UI-Form eines Events. Heute vier Werte: `ladv`, `competition`, `training`, `social`.

**Event-Typ-Capabilities** — der SSOT für *was ein Event-Typ kann/braucht*. Lebt in `shared/utils/event-types/capabilities.ts` als `Record<EventType, EventTypeCapabilities>`. Felder:

- `source` — Stammdaten kommen `'manual'` (vom Mitglied angelegt) oder `'ladv'` (per LADV-Sync gepflegt).
- `isPubliclyVisible` — sichtbar ohne Login.
- `hasCompetitionMetadata` — `priority`, `raceType`, `championshipType` werden gepflegt.
- `hasWishDisciplines` — Athlet pflegt **Wunschstand**.
- `hasLadvStandManagement` — Coach pflegt **LADV-Stand** (Coach-Modal, Stand-Harmonisierung, N-01/N-02/N-03). Impliziert `hasWishDisciplines` *und* `source === 'ladv'`.
- `status` — Lifecycle: `initial`, `validInitial`, `validNext`.
- `showsRegistrationDeadline` — Frist wird in der UI angezeigt.
- `enforcesDeadline` — Frist ist ein harter Cutoff für Non-Admin. Impliziert `showsRegistrationDeadline`.
- `label`, `newLabel` — Anzeige-Strings.

Regeln, die *nicht* in den Caps liegen (universell, im Helper):
- Admin-Aktor umgeht jede Deadline (`isDeadlineEnforcedFor` in `server/registration/rules.ts`).
- `cancel` wird nie durch die Deadline geblockt.
- `change-wish` wird nur enforced, wenn der Typ `hasWishDisciplines` hat.

Neuer Event-Typ = **ein Eintrag** in der Tabelle. UI- und Server-Branches lesen aus den Caps (Migration läuft schrittweise via Issues #188, #189, #190, #191, #192).

## Anmeldung

**Anmeldung** *(`registration`)* — die Bindung eines Mitglieds an ein Event. Genau eine Anmeldung pro `(eventId, userId)`. Eine stornierte Anmeldung wird bei Wieder-Anmeldung **reaktiviert**, nicht neu angelegt.

**Lifecycle-Status** — abhängig vom Event-Typ (`shared/utils/registration.ts:getValidNextStatuses`):
- `ladv`: `registered ↔ canceled`
- `competition`: `registered ↔ maybe ↔ no`
- `training` / `social`: `yes ↔ maybe ↔ no`

Initialer Status pro Typ (`getInitialStatus`): `ladv`/`competition` → `registered`, sonst → `yes`.

**Wunschstand** *(`wishDisciplines`)* — Liste der Disziplinen + Altersklassen, die der Athlet zu starten wünscht. Nur bei `ladv` befüllt. **Wird nur vom Athleten direkt gepflegt** (oder indirekt vom Coach über LADV-Stand-Harmonisierung, siehe unten).

**LADV-Stand** *(`ladvDisciplines`)* — Liste der Disziplinen, die tatsächlich an LADV gemeldet sind. `null` = nichts gemeldet (oder LADV-Abmeldung erfolgt). **Wird ausschließlich vom Coach gepflegt** — entweder direkt (Coach-Modal) oder beim Admin-Anmelden via `setLadvStandImmediately`.

**Stand-Harmonisierung** — wenn der Coach einen `ladvDisciplines`-Stand mit Disziplinen setzt, wird gleichzeitig `wishDisciplines := ladvDisciplines`. Damit endet jede Coach-Aktion in einem konsistenten Zustand (Wunsch = Stand). Wird der Stand auf `null` gesetzt (LADV-Abmeldung), bleibt `wishDisciplines` unverändert.

**Wunsch-Stand-Diff** — die Differenz zwischen `wishDisciplines` und `ladvDisciplines` ist die Coach-Todo-Liste. Sichtbar im Coach-Modal (`shared/utils/ladv-diff.ts:diffLadvRegistration`).

## Aktor

**Aktor** *(`actor`)* — wer eine Anmelde-Operation auslöst. Zwei Arten:

- **Self** — das Mitglied selbst handelt an seiner eigenen Anmeldung.
- **Admin** — Coach/Admin/Superuser handelt im Auftrag eines anderen Mitglieds (Admin-Anmeldung, Coach-Modal, Status-Korrektur).

Das Anmelde-Modul kennt nur diese zwei Arten. Die Unterscheidung admin vs. superuser ist eine HTTP-Auth-Entscheidung (`requireAdmin` akzeptiert beide) und gehört nicht in die Domäne.

**Aktor-spezifische Regeln im Anmelde-Modul:**
- **Deadline-Bypass** — Admin darf nach abgelaufener Meldefrist anmelden/ändern. Self nicht.
- **Startpass-Pflicht** — bei `ladv` ist ein gültiger LADV-Startpass für *jede* Anmeldung erforderlich, egal ob Self oder Admin.
- **Wunschstand pflegen** — nur Self.
- **LADV-Stand pflegen** — nur Admin.
- **Status / Notes ändern** — Self nur eigene; Admin auch fremde.
- **Reaktivierung** — beide Aktoren; eine stornierte Anmeldung wird bei Wieder-Anmeldung wiederbelebt, nicht doppelt angelegt.

## Notification-Effekte

Operationen am Anmeldungs-Aggregat lösen Notifications aus:

- **N-09 `registration_confirmation`** — Self meldet sich für `ladv` an → Bestätigung an Mitglied.
- **`admin_registered_member`** — Admin meldet Mitglied an → Mitteilung an Mitglied (mit Admin-Name).
- **N-01 `ladv_registered`** — Coach setzt LADV-Stand mit Disziplinen → Mitteilung an Mitglied (auch beim Admin-Anmelden mit `setLadvStandImmediately`).
- **N-02 `ladv_canceled`** — Coach setzt LADV-Stand auf `null` → Mitteilung an Mitglied.
- **N-03 `athlete_canceled_after_ladv`** — Self storniert nach erfolgter LADV-Meldung → Admins.
- **N-03b `athlete_changed_after_ladv`** — Self ändert Wunschstand auf etwas, das vom LADV-Stand abweicht → Admins.
- **`admin_changed_member_registration`** — Admin ändert Status/Notes eines fremden Mitglieds (außer eine spezifischere Notification wurde schon ausgelöst → `silent`-Flag).

Liegt im Anmelde-Modul, nicht in den Handlern. Aufrufer kontrollieren über `ChangeOpts.silent`, ob die generische `admin_changed_member_registration` unterdrückt werden soll, falls der Caller bereits eine spezifischere Notification gesendet hat.
