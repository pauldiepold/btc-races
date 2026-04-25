---
name: notification-system-overview
description: Liefert einen schnellen, zielgerichteten Überblick über das Notification-System der BTC-Races-App (E-Mail + Push, Queue, Cron, Preferences, Push-Subscriptions). Triggert IMMER, wenn der User Notifications/Benachrichtigungen plant, diskutiert, debuggt oder Architekturfragen stellt — auch wenn er nur erwähnt „Wir könnten doch X benachrichtigen", „wie funktioniert das mit den Reminders", „wo werden die Push-Notifications verschickt", „warum kommt keine Email an", „wieso wird Push übersprungen", „können wir Y per Email schicken". Auch beim Planen neuer Features mit Notification-Anteil als Kontext-Lader nutzen, BEVOR Code geschrieben wird. Zielgruppe: User, die das System verstehen oder davor planen wollen — NICHT zum Implementieren eines neuen Typs (dafür ist add-notification-type da).
---

# Notification-System – Architektur-Überblick

Lade dieses Wissen, sobald Notifications irgendwo Thema sind. Ziel: in <1 Minute eine mentale Karte des Systems haben, ohne den Source-Code zu durchforsten.

## Big Picture

```
[Trigger]                         [Queue]                    [Cron]                       [Delivery]
   |                                 |                          |                              |
API-Route, Cron, Lifecycle  →  notificationService.enqueue()  →  notification_jobs (D1)  →  process-notifications  →  executeDeliveries  →  Email + Push (parallel)
                                                                                                                                              |
                                                                                                                                  notification_deliveries (DB)
```

**Kernidee:** API-Handler blockieren nur für den Job-INSERT (~50ms). Versand läuft asynchron im Cron (jede Minute). Failures landen mit Backoff (2/4/8 min) im Retry, max. 3 Versuche, dann `failed`.

## Verzeichnis-Karte

| Datei | Zweck |
|---|---|
| `shared/types/notifications.ts` | `NotificationType`-Union, `NotificationChannel` (`email`/`push`), `NOTIFICATION_DEFAULTS` (default/mandatory pro Typ × Channel) |
| `shared/utils/notifications.ts` | `resolveChannelsForRecipient()` — kombiniert mandatory + User-Override + Default |
| `server/notifications/types.ts` | Re-Exports + `SendNotificationOptions`, `NotificationRecipient` |
| `server/notifications/meta.ts` | `NOTIFICATION_META` (Label, Description, `adminOnly`) + `buildPreferencesResponse()` für die UI |
| `server/notifications/templates.ts` | `EMAIL_TEMPLATE_MAP`, `EMAIL_SUBJECT_MAP`, `PUSH_PAYLOAD_MAP` — pro Typ Konfiguration |
| `server/notifications/service.ts` | `enqueueNotification()` (public API) + `executeDeliveries()` (vom Cron aufgerufen) |
| `server/notifications/process.ts` | `processQueue()` — Cron-Loop mit Orphan-Reset, Backoff, Retries |
| `server/notifications/push.ts` | `pushService` — `sendPushToUser`, Subscription-Cleanup bei 410/404 |
| `server/notifications/delivery-builder.ts` | `buildDeliveryTasks()` — kombiniert Recipients × Channels × Subscriptions zu Tasks |
| `server/notifications/triggers.ts` | Trigger-Funktionen mit Guards (z.B. `triggerEventChangedNotification`) |
| `app/emails/*.vue` | Vue-Email-Templates, Komponentenbausteine in `app/emails/components/` |
| `server/api/cron/process-notifications.ts` | Cron-Endpoint, ruft `processQueue()` |
| `server/api/cron/send-reminders.post.ts` | Reminder-Logik (3 Reminder-Typen mit Deduplizierung über Job-Lookup) |
| `server/api/cron/cleanup-notifications.post.ts` | Löscht `done`-Jobs > 90 Tage |
| `server/api/push/subscribe.post.ts` / `.delete.ts` | Subscription-Endpoints |
| `app/composables/usePushNotifications.ts` | Browser-Side Subscription-Lifecycle, Drift-Reconcile |
| `app/components/PushBanner.vue`, `PushModal.vue` | UI für Push-Aktivierung |
| `app/pages/profil/benachrichtigungen.vue` | Preferences-UI |
| `app/pages/superuser/notifications.vue` | Queue-Monitoring + Retry-Button |

## Datenbank-Tabellen

| Tabelle | Bedeutung |
|---|---|
| `notification_jobs` | Eine Row pro `enqueue()`-Call. `status`: `pending` → `processing` → `done`/`failed`. `payload` ist JSON-String mit `_recipients`. `attempts` (max 3), `processedAt` (Backoff-Basis). |
| `notification_deliveries` | Eine Row pro Recipient × Channel pro Job. `status`: `sent`/`failed`. Wird bei Retry **vorher gelöscht** (frischer Versuch). |
| `notification_preferences` | User-Overrides — nur Rows, die vom Default abweichen (UNIQUE auf userId+type+channel). |
| `push_subscriptions` | Pro User × Endpoint eine Row. UNIQUE auf userId+endpoint. Cleanup bei 410/404 automatisch. |

## Channels & Preference-Resolution

Reihenfolge (`resolveChannelsForRecipient`):
1. **`mandatory: true`** im Default → Channel ist immer aktiv, User-UI zeigt disabled Toggle, kein Preferences-Eintrag möglich
2. **User-Override aus `notification_preferences`** → genutzt
3. **Sonst Default aus `NOTIFICATION_DEFAULTS`**

Push-Spezialfall: Auch wenn Channel resolved-aktiv, filtert `delivery-builder.ts` User raus, die **keine** `push_subscriptions`-Row haben. Push-Delivery wird also nicht versucht, wenn der User nicht subscribed ist (auch nicht als `failed` geloggt).

## Recipient-Strategien

`SendNotificationOptions.recipients` akzeptiert drei Formen (resolved in `service.ts → resolveRecipients`):

| Form | Bedeutung |
|---|---|
| `'all_admins'` | Alle User mit `role IN ('admin', 'superuser')` |
| `'all_members'` | Alle User mit `membershipStatus = 'active'` |
| `Array<{ userId, email?, firstName? }>` | Explizite Empfängerliste — typisch nach DB-Query (z.B. angemeldete Athleten eines Events) |

## Trigger-Patterns

Drei typische Aufrufstellen:

1. **API-Mutation**: nach `db.update`/`db.insert` direkt im Handler. Errors müssen geschluckt werden (Notification-Bug darf User-Aktion nicht kippen).
2. **Lifecycle-Event**: z.B. `events/[id]/cancel.post.ts` ruft `notificationService.enqueue` direkt.
3. **Cron** (`send-reminders.post.ts`): zeitbasierte Reminder mit Deduplizierung via Vorab-Lookup in `notification_jobs` (gleicher Typ + gleiche `eventId` an gleichem Tag → skip).

Async-Style: `await` wenn Fehler relevant, `void triggerXxx(...)` wenn fire-and-forget — siehe `events/[id].patch.ts` (`void triggerEventChangedNotification(...)`).

## Aktuelle Notification-Typen

| Typ | Anlass | Recipient | Mandatory | adminOnly |
|---|---|---|---|---|
| `ladv_registered` | LADV-Meldung bestätigt | Athlet | E-Mail | – |
| `ladv_canceled` | LADV-Abmeldung | Athlet | E-Mail | – |
| `athlete_canceled_after_ladv` | Athlet storniert nach LADV-Meldung | Admins | E-Mail | ✓ |
| `event_canceled` | Event abgesagt | Angemeldete | E-Mail | – |
| `event_changed` | Datum/Uhrzeit/Ort geändert | Angemeldete | – | – |
| `new_event` | Neues Event veröffentlicht | Alle Mitglieder | – | – |
| `reminder_deadline_athlete` | 5 Tage vor Meldeschluss | Angemeldete | – | – |
| `reminder_deadline_admin` | 3 Tage vor Meldeschluss | Admins | – | ✓ |
| `reminder_event` | 2 Tage vor Event | Angemeldete | – | – |

## Edge-Cases & Stolperfallen

- **Email-Template-Registry**: Neue/umbenannte `app/emails/*.vue` brauchen Dev-Server-Restart, sonst „template not found".
- **Stiller Skip**: `EMAIL_TEMPLATE_MAP` und `PUSH_PAYLOAD_MAP` sind `Partial<Record<...>>` — fehlende Einträge werden mit Fehler-Log geskippt, nicht zu Compile-Fehler. `EMAIL_SUBJECT_MAP` dagegen vollständig getypt.
- **Orphan-Reset**: `processing`-Jobs > 5 Minuten werden zu `failed` (Worker-Crash, Cold-Start-Timeout).
- **Backoff-Retry**: bei `failed` mit `attempts < 3` wartet das System exponentiell (2, 4, 8 min) ab `processedAt`. Eligibility-Check im App-Code (SQLite-Datumsrechnung umgangen).
- **Push-Subscription-Drift** (#109): Browser-Subscription kann sich ohne Server-Sync ändern → `usePushNotifications.reconcileWithServer()` gleicht beim Mount auf `/profil/benachrichtigungen` ab.
- **Push 410/404**: Subscription wird automatisch aus DB gelöscht (Apple/Google-Cleanup).
- **`event_changed` Fail-Safe**: Bei Template-Miss zur Laufzeit gibt's einen plain-Text-Fallback in `service.ts` (sonst hätte Drift in der Template-Registry zu Komplettausfall geführt).
- **Cron-Worker** (`cron-worker/src/index.ts`): externer Worker, ruft die internen Cron-Endpoints mit Bearer-Token auf. Endpoints sind `POST` mit Auth-Guard.
- **Reminder-Deduplizierung**: `send-reminders.post.ts` prüft pro Typ+Event, ob für **heute** schon ein Job existiert. Bei mehrfachen Cron-Hits am selben Tag → skip.
- **Errors in Triggern**: müssen geschluckt werden (`try/catch + console.error`). Niemals an API-Caller hochreichen.

## Wann was lesen

- **Neuen Typ planen** → diese Übersicht + `NOTIFICATION_DEFAULTS` + `NOTIFICATION_META` als Vorlagen
- **Neuen Typ implementieren** → Skill `add-notification-type` triggern lassen
- **Email kommt nicht an** → `notification_deliveries` Status + `error`-Spalte; danach `service.ts → sendEmailDelivery`
- **Push kommt nicht an** → erst `push_subscriptions` checken, dann `notification_deliveries`, dann `push.ts → sendPushToUser`
- **Job hängt auf `processing`** → Orphan-Reset greift nach 5 min
- **Reminder duplicates** → Dedup-Lookup in `send-reminders.post.ts`
- **UI zeigt Toggle nicht** → `meta.ts → adminOnly` oder Default-`mandatory`
- **Queue-Monitoring** → `/superuser/notifications`

## FEATURES.md

Ausführliche Feature-Liste im Abschnitt „Notifications" und „Push Notifications" in `FEATURES.md` — bei breiteren Architekturfragen dort nachschlagen.
