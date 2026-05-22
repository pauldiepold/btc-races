# Domain-Kontext

Geteilte Sprache für Architektur-Entscheidungen und Code-Reviews. Wenn ein Term hier nicht steht, gehört er entweder noch nicht zur Domäne — oder wir müssen ihn schärfen und ergänzen.

## Deployment-Environment

**Live-Deployment** *(`isLive`)* — das Cloudflare-Pages-Deployment der `main`-Branch, also die produktive Live-URL. Diskriminiert Verhalten, das gegen echte Nutzerdaten wirkt (z. B. destruktive Superuser-Aktionen wie DB-Seed). Erkannt anhand von `CF_PAGES_BRANCH === 'main'`. Alles andere (lokal, Preview-Branches) ist **nicht live** — dort sind solche Aktionen erlaubt.

Bewusst nicht „Production": `process.env.NODE_ENV === 'production'` gilt auch für Preview-Builds und meint den Build-Modus, nicht das Deployment-Target.

## Mitgliedschaft

**Mitglied** *(`User`)* — eine Person, deren Stammdaten per Campai-Sync (`runSyncMembers`) in die `users`-Tabelle gespiegelt werden. Campai ist die Wahrheitsquelle; die App legt selbst keine Mitglieder an.

**Mitgliedsstatus** *(`membershipStatus`)* — diskriminiert, ob ein Mitglied aktuell zum Verein gehört. Zwei Werte: `active`, `inactive`. Wird ausschließlich vom Campai-Sync gesetzt; neu angelegte Rows starten auf `inactive`.

**Aktives Mitglied** — ein Mitglied, das beim letzten Campai-Sync in der Aktiv-Liste von Campai stand.

**Inaktives Mitglied** — ein Mitglied, das beim letzten Campai-Sync *nicht* mehr in der Aktiv-Liste stand (Vereinsaustritt o. ä.). Zwei harte Domain-Konsequenzen: kein App-Zugang (der Login wird abgewiesen) und keinerlei Notifications — weder E-Mail noch Push. Das „keine Notifications"-Versprechen gilt ausnahmslos für jeden Notification-Typ, auch admin-gerichtete. Wird ein Mitglied später wieder aktiv, laufen Zugang und Notifications automatisch erneut an — es gibt keinen separaten Reaktivierungs-Schritt.

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

## Disziplin & Altersklasse

**Disziplin** *(`discipline`, LADV: `disziplinNew`)* — eine leichtathletische Wettkampf-Disziplin (z. B. 100m, Weitsprung), identifiziert über einen LADV-Disziplin-Code.

**LADV-Altersklasse** *(`ageClass`, LADV: `klasseNew`)* — die Wettkampf-Altersklasse eines Athleten (z. B. `M40`, `WJU20`), bestimmt aus Geburtsjahr, Geschlecht und Wettkampfjahr. Stichtag ist der 31.12. des Wettkampfjahres — *nicht* das aktuelle Alter. Berechnung: `shared/utils/ladv-age-class.ts:getLadvAgeClass`.

Ein **Wunschstand**- bzw. **LADV-Stand**-Eintrag ist genau ein Paar `(Disziplin, Altersklasse)`. Eine LADV-Ausschreibung bietet pro Disziplin nur eine Teilmenge aller Altersklassen an — die berechnete AK ist daher nicht immer wählbar. Masters-Athleten (35+) dürfen ersatzweise in der offenen Hauptklasse (`M`/`W`) starten, wenn ihre Masters-Klasse nicht angeboten wird (`shared/utils/ladv-age-class.ts:pickAgeClass`).

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

**Wunsch-Stand-Diff** — die Differenz zwischen `wishDisciplines` und `ladvDisciplines` (`shared/utils/ladv-diff.ts:diffLadvRegistration`). Ein Diff-Eintrag plus der Cancel-Fall (storniert, aber `ladvDisciplines` nicht leer) ist ein **LADV-Todo** (`LadvTodo`) — die Arbeits-Einheit für den Coach. Umgangssprachlich auch „Admin-Todo". Surfaces an mehreren Stellen (Coach-Modal, Event-Detailseite, Event-Card).

**Meldeliste** — die LADV-seitige Übersicht aller Meldungen für einen Wettkampf (`ladv.de/meldung/anmeldungen/{ladvId}`). Externe Seite, öffnet im neuen Tab. Nur relevant für Events mit `ladvId`.
_Avoid_: „Anmeldeliste" — das ist die BTC-app-interne Teilnehmerliste (`EventRegistrationList`), ein anderes Konzept.

## Event-Lifecycle

**Event-Cancel** *(`cancelledAt`)* — Soft-Cancel: das Event bleibt in der Datenbank, aber ist als "abgesagt" markiert. Bestehende Anmeldungen bleiben erhalten (für Audit/Historie). Idempotent: ein bereits gecanceltes Event nochmal canceln ist ein No-Op (kein DB-Write, keine erneute Notification). Beim Cancel kann ein Admin/Self-Aktor optional einen frei formulierten **Absage-Grund** (`cancelReason`) mitgeben; LADV-Sync-Absagen haben nie einen Grund.

**Event-Reaktivierung** *(`uncancel`)* — Aufhebung des Cancel-Status (`cancelledAt := null`). Idempotent: ein nicht-gecanceltes Event reaktivieren ist ein No-Op. Löst `event_uncanceled`-Notification an alle aktuell `registered`/`yes`/`maybe`-Angemeldeten aus. Immer menschlich ausgelöst (Self oder Admin) — kein System-Pfad.

**Event-Löschung** *(`delete`)* — Hard-Delete aus der Datenbank, inklusive aller Anmeldungen via FK-Cascade. Im HTTP-Layer auf Superuser beschränkt (`requireSuperuser`). Nicht idempotent: bereits gelöschtes Event → `event_not_found`.

## Aktor (Event)


**Event-Aktor** *(`EventActor`)* — wer eine Event-Operation auslöst. Drei Arten:

- **Self** — ein authentifiziertes Mitglied, das nur eigene Events (`createdBy === userId`) modifizieren darf.
- **Admin** — Coach/Admin/Superuser, der jedes Event modifizieren darf.
- **System** — kein Mensch hat ausgelöst; der Auslöser ist ein automatischer Prozess (heute: LADV-Sync, sowohl Cron-Loop als auch manueller Admin-Re-Sync `/api/events/:id/sync`). LADV ist in diesem Fall die Wahrheitsquelle; der konkrete Trigger ist irrelevant für Merge-Regeln und Notification-Adressaten.

Die Unterscheidung admin vs. superuser ist eine HTTP-Auth-Entscheidung (`requireAdmin`/`requireSuperuser`) und gehört nicht in die Domäne.

**Aktor-spezifische Regeln im Event-Modul:**
- **Erstellen** — jeder authentifizierte Aktor (nur Self/Admin; System legt keine Events an).
- **Patch / Cancel / Uncancel** — Self nur eigene (`createdBy === userId`), Admin alle. Zentrale Regel: `canModifyEvent(actor, dbEvent)`. System wirkt nur via `applyLadvSync` — separater Pfad ohne Permission-Check.
- **Delete** — Domain-seitig nur Admin (`canDeleteEvent`); die Superuser-Pflicht enforced der HTTP-Layer (`requireSuperuser`).
- **Priority setzen** — nur Admin, und nur bei Event-Typen mit `hasCompetitionMetadata`. Regel: `canSetPriority(actor, eventType)`.

**System-Aktor in Notifications:** Wird die Notification durch einen System-Pfad ausgelöst, ist `actorUserId === null` im Notification-Job. Die Konvention gilt für Notification-Typen mit `actor: 'optional'` (heute: `event_changed`, `event_canceled`). Email-Templates müssen den null-Fall explizit behandeln (z. B. *„Laut LADV wurde X abgesagt."*) — kein generischer Admin-Fallback. `event_uncanceled` ist hingegen `actor: 'required'` — kein System-Pfad kann uncancel auslösen. Reminder-Notifications (`actor: 'none'`) sind eine andere Kategorie: für sie existiert das Aktor-Konzept überhaupt nicht.

## Aktor (Anmeldung)

**Aktor** *(`actor`)* — wer eine Anmelde-Operation auslöst. Zwei Arten:

- **Self** — das Mitglied selbst handelt an seiner eigenen Anmeldung.
- **Admin** — Coach/Admin/Superuser handelt im Auftrag eines anderen Mitglieds (Admin-Anmeldung, Coach-Modal, Status-Korrektur).

Das Anmelde-Modul kennt nur diese zwei Arten — kein **System**-Aktor: Anmeldungen werden immer von Menschen ausgelöst, LADV-Sync rührt das Anmeldungs-Aggregat nicht an. Die Unterscheidung admin vs. superuser ist eine HTTP-Auth-Entscheidung (`requireAdmin` akzeptiert beide) und gehört nicht in die Domäne.

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

## Installierte App

**Installierte App** — die zum Home-Bildschirm hinzugefügte, im Standalone-Modus laufende Variante von Berlin Track Club (technisch eine PWA). Nutzerseitig heißt sie immer „App" bzw. „installierte App" — der Begriff „PWA" erscheint nie in der UI.
_Avoid_: „PWA" user-facing.

Auf iOS sind Web-Push-Benachrichtigungen nur in der installierten App möglich, nicht im Safari-Tab. Daher gilt für iOS-Geräte ohne installierte App: erst installieren, dann Push (`needsInstallFirst`). Auf Android und Desktop funktioniert Push auch im Browser-Tab.

## Beiträge & Kommentare

> Vereinsinterner Diskussionsbereich, im UI **„Beiträge"**, löst die Campai-„Räume" ab. Komplett login-pflichtig — nicht an `Event.isPubliclyVisible` gekoppelt. (Planung in Arbeit, Stand 2026-05-20.)

**Thread** — technischer Oberbegriff für die Einheit, an der ein **Kommentar**-Stream hängt; liegt in genau einem **Raum**. Zwei Arten, diskriminiert über `eventId`: **Event-Thread** und **Beitrag**.
_Avoid_: „Thread" user-facing — dort heißt es **Beitrag** bzw. **Kommentare**.

**Beitrag** — ein Thread ohne Event-Bezug (`eventId` null). Von einem Mitglied manuell angelegt, mit frei gewähltem Titel und Markdown-Body. Der Body ist Teil des Beitrags, *kein* **Kommentar** — ihn zu löschen heißt, den ganzen Beitrag (soft) zu löschen. Hat eine eigene Detailseite.
_Avoid_: „Diskussion", „Diskussions-Thread", „Posting".

**Event-Thread** — ein Thread mit Event-Bezug (`eventId` gesetzt). Entsteht automatisch bei Event-Anlage, hat keinen eigenen Body, der Titel ist der Event-Name. Wird inline auf der Event-Detailseite gerendert, hat keine eigene URL.

**Kommentar** — eine Antwort innerhalb eines Threads (Markdown). Soft-Delete mit Tombstone (Body bleibt, UI zeigt „Kommentar gelöscht"). Nur neue Kommentare heben die Sortier-Aktivität (`lastActivityAt`) des Threads — Edits und Löschungen nicht.

**Angehefteter Kommentar** — ein im Thread hervorgehobener Kommentar (max. 3 pro Thread), gesetzt durch einen Admin oder den Autor des Threads. Erscheint zusätzlich oben in einem „Wichtig"-Block.

**Raum** — eine statisch im Code definierte Gruppierung von Threads (kein Admin-UI). Fünf in v1: **Ankündigungen**, Training, Team, Races, Social. Event-Threads landen anhand des unveränderlichen **Event-Typs** im passenden Raum (`training`→Training, `competition`/`ladv`→Races, `social`→Social).

**Mandatory-Raum** — der Raum **Ankündigungen**: Beiträge dürfen dort nur Admins anlegen, und die Anlage benachrichtigt *alle* aktiven Mitglieder ohne Opt-out (`thread_announcement`).

**Automatische Empfänger** — wer eine `thread_new_comment`-Notification bekommt, ohne etwas tun zu müssen: Thread-Autor, bisherige Kommentatoren, und bei Event-Threads die Event-Teilnehmer (Anmeldung mit Status ≠ `no`/`canceled`). Wird zum Sendezeitpunkt aus dem aktuellen Zustand berechnet — es gibt keine materialisierten Abo-Zeilen.
_Avoid_: „Abonnent", „Subscriber" — siehe Flagged ambiguities.

**Folgen** / **Stummschalten** — die zwei expliziten Overrides eines Mitglieds gegenüber den automatischen Empfängern eines Threads: **Folgen** trägt jemanden zusätzlich ein, **Stummschalten** nimmt jemanden heraus. Automatische Empfänger-Hooks heben ein Stummschalten nie auf. Im Mandatory-Raum greift Stummschalten nicht.

## Relationships

- Ein **Event** hat genau einen **Event-Thread** (1:1, automatisch bei Event-Anlage).
- Ein **Thread** liegt in genau einem **Raum** und hat 0..n **Kommentare**.
- Ein **Beitrag** ist ein **Thread** ohne **Event** — der einzige Unterschied im Modell ist `eventId`.

## Flagged ambiguities

- „Subscription" meinte bisher ausschließlich das Browser-Web-Push-Abo (`pushSubscriptions`). Das Thread-seitige Abo-Konzept heißt bewusst **Folgen** / **Stummschalten** (Override gegenüber **automatischen Empfängern**), um die Begriffe nicht zu vermischen.
- „Pin": Es gibt nur den **angehefteten Kommentar** (innerhalb eines Threads). Ein Thread-Pin (Thread oben im Raum festnageln) wurde aus v1 herausgenommen.
- „Anmelden": umgangssprachlich sowohl „sich einloggen" als auch „sich für ein Event anmelden". **Anmeldung** ist reserviert für die Event-Registrierung (siehe Abschnitt *Anmeldung*). Für die Authentifizierung **Login** / **Einloggen** verwenden.
