---
name: add-notification-type
description: Fügt der BTC-Races-App einen neuen Notification-Typ (E-Mail + Push) hinzu. Triggert immer, wenn der User eine neue Benachrichtigung/Notification einführen will — egal ob er „neuer Notification-Typ", „neue Benachrichtigung", „Email für X einbauen", „Push-Notification für Y", „User informieren wenn Z passiert" sagt oder sinngemäß einen neuen Anlass für eine automatische Benachrichtigung beschreibt. Auch dann nutzen, wenn der User nur einen Channel (nur Email oder nur Push) erwähnt — beide werden zentral verdrahtet. Deckt alle Touchpoints ab: Types, Defaults, Meta, Email-Template, Subject/Push-Payload, Trigger, Aufrufstelle, FEATURES.md. Nicht für reine Änderungen am bestehenden Notification-System (Refactor, neuer Channel, neue Recipient-Strategie) verwenden.
---

# Neuen Notification-Typ hinzufügen

Dieses Skill führt durch alle Touchpoints, die nötig sind, um in BTC-Races einen neuen Notification-Typ einzuführen. Das System ist konventionsbasiert — fehlt **ein** Eintrag in einer der Maps, schlägt entweder TypeScript an, oder die Delivery wird stillschweigend übersprungen. Deshalb gilt: Reihenfolge einhalten, alle Maps anfassen, am Ende Lint + Typecheck.

## Architektur-Kontext (knapp)

**Datenfluss:** Trigger → `notificationService.enqueue()` → Job-Row in `notification_jobs` (status=`pending`) → Cron `/api/cron/process-notifications` (jede Minute) → `executeDeliveries()` → Email + Push parallel pro Recipient → Delivery-Rows in `notification_deliveries`.

**Channels** (`shared/types/notifications.ts`): aktuell `email` und `push`. Pro Typ × Channel gibt's `default` (Opt-out möglich) oder `mandatory` (User kann nicht abstellen).

**Preference-Resolution** (`shared/utils/notifications.ts`): `mandatory` schlägt alles, sonst User-Override aus `notification_preferences`, sonst Default. Push-User ohne `push_subscriptions`-Eintrag werden im `delivery-builder.ts` rausgefiltert.

**adminOnly** (`server/notifications/meta.ts`): Filter für die UI unter `/profil/benachrichtigungen` — nur Admins/Superuser sehen den Toggle.

## Workflow

### 1. Intent klären (vor jedem Code)

Frag den User, falls nicht klar:

- **Anlass**: Was passiert genau, das die Notification auslöst? (z.B. "Trainingsplan zugewiesen")
- **Empfänger**: Einzelner User? Alle Mitglieder? Admins? Angemeldete Athleten eines Events?
- **Channels**: E-Mail, Push, oder beides? (Default: beides — die App ist darauf ausgelegt.)
- **Mandatory?**: Darf der User es abstellen? Faustregel: persönlich-betroffene Aktionen (LADV-Meldung, Event-Absage) → `mandatory: true` für E-Mail. Reminder/Info → `mandatory: false`.
- **adminOnly?**: Nur für Admins/Superuser sichtbar in Preferences? (Beispiel: `athlete_canceled_after_ladv`, `reminder_deadline_admin`.)
- **Aufrufstelle**: API-Route (z.B. nach `PATCH /api/...`), Cron-Endpoint, oder Lifecycle-Event?
- **Payload**: Welche Felder muss die Notification mitschicken? Mindestens `eventName` und `eventLink`/`eventUrl`, falls events-bezogen.

Frag bei einem GitHub-Issue, falls keins existiert — am Ende der Session wird `session-log` erstellt (siehe Schritt 9).

### 2. `shared/types/notifications.ts` — Type + Defaults

Erweitere die Type-Union und ergänze `NOTIFICATION_DEFAULTS`. Beispiel für einen neuen Typ `training_assigned`:

```ts
export type NotificationType
  = | 'ladv_registered'
    // ... bestehende Einträge
    | 'training_assigned'

export const NOTIFICATION_DEFAULTS: Record<NotificationType, {
  email: NotificationChannelDefaults
  push: NotificationChannelDefaults
}> = {
  // ... bestehende Einträge
  training_assigned: {
    email: { default: true, mandatory: false },
    push: { default: true, mandatory: false },
  },
}
```

**Stolperfalle:** TypeScript meckert sofort an allen anderen Stellen, an denen der Typ erwartet wird (Maps, Switch-Statements). Das ist der Schutz — keinen Eintrag vergessen.

### 3. `server/notifications/meta.ts` — UI-Metadaten

```ts
export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  // ... bestehend
  training_assigned: {
    label: 'Trainingsplan zugewiesen',
    description: 'Wenn dir ein neuer Trainingsplan zugewiesen wird.',
    adminOnly: false,
  },
}
```

**Reihenfolge der Keys** = Reihenfolge in der Preferences-UI. Sortiere thematisch (z.B. neue Reminder bei den anderen Remindern, nicht ans Ende).

### 4. `app/emails/<Name>Email.vue` — E-Mail-Template

Schau in vorhandene Templates (z.B. `LadvRegisteredEmail.vue`, `EventChangedEmail.vue`) für Struktur und Komponenten unter `app/emails/components/`. Props enthalten den Payload **plus** automatisch `firstName` (vom Recipient).

Pflicht-Konventionen:
- Komponentenname = `<Name>Email` (PascalCase, Suffix `Email`)
- Props mit `defineProps<{ ... }>` typisieren — alle erwarteten Payload-Felder aufnehmen
- Begrüßung: `Hallo {{ firstName ?? '' }},` (siehe vorhandene Templates)
- Nutze die Bausteine aus `app/emails/components/` (Layout, Button, etc.) für konsistentes Styling

**Wichtig:** Nach dem Anlegen einer **neuen** `.vue`-Datei in `app/emails/` muss der Dev-Server neu gestartet werden, sonst findet `nuxt-email-renderer` das Template nicht zur Laufzeit. Sage dem User Bescheid.

### 5. `server/notifications/templates.ts` — alle drei Maps

Drei Einträge — keinen vergessen:

```ts
export const EMAIL_TEMPLATE_MAP: Partial<Record<NotificationType, string>> = {
  // ... bestehend
  training_assigned: 'TrainingAssignedEmail',
}

export const EMAIL_SUBJECT_MAP: Record<NotificationType, (payload: Record<string, unknown>) => string> = {
  // ... bestehend
  training_assigned: p => `Neuer Trainingsplan: ${p.planName ?? ''}`,
}

export const PUSH_PAYLOAD_MAP: Partial<Record<NotificationType, (payload: Record<string, unknown>) => { title: string, body: string, url?: string }>> = {
  // ... bestehend
  training_assigned: p => ({
    title: 'Neuer Trainingsplan',
    body: `${p.planName ?? 'Ein neuer Trainingsplan'} wurde dir zugewiesen.`,
    url: p.planUrl as string | undefined,
  }),
}
```

**Stolperfalle:** `EMAIL_TEMPLATE_MAP` und `PUSH_PAYLOAD_MAP` sind `Partial<Record<...>>`. Fehlt ein Eintrag, wird die Delivery für diesen Channel **stillschweigend übersprungen** (graceful skip mit Log) — kein Compile-Error. `EMAIL_SUBJECT_MAP` dagegen ist vollständig getypt, hier meckert TS. Lass dich davon nicht in falscher Sicherheit wiegen — beide Maps füllen.

### 6. Trigger-Funktion (optional)

Es gibt zwei Patterns für den Aufruf:

**A) Direkt in der API-Route** (für einfache Fälle ohne Recipient-Resolution):

```ts
import { notificationService } from '~~/server/notifications/service'

await notificationService.enqueue({
  type: 'training_assigned',
  recipients: [{ userId, email, firstName }],
  payload: { planName, planUrl: `${siteUrl}/training/${planId}` },
})
```

**B) Trigger-Funktion in `server/notifications/triggers.ts`** (wenn Guards, DB-Lookups, oder Recipient-Resolution nötig — siehe `triggerEventChangedNotification` als Vorbild):

```ts
export async function triggerTrainingAssigned(/* ... */): Promise<void> {
  try {
    // Guards (z.B. nur aktive Mitglieder, kein Verschicken bei Past-Events)
    // Recipients aus DB resolven
    // siteUrl aus useRuntimeConfig().public.siteUrl
    await notificationService.enqueue({ type: 'training_assigned', recipients, payload, eventId })
  }
  catch (err) {
    console.error('[Notification] Fehler beim Erstellen des Jobs (training_assigned):', err)
  }
}
```

**Pflichten:**
- Errors **immer** schlucken (`try/catch`, nur loggen) — nie an den API-Caller durchreichen, sonst kippt ein Notification-Bug eine User-Aktion.
- Recipients-Shortcuts nutzen, wo passend: `'all_admins'`, `'all_members'` (in `service.ts → resolveRecipients`).
- `eventId` mitgeben, falls eventbezogen — wird für Cron-Deduplizierung genutzt (siehe `send-reminders.post.ts`).

### 7. Aufrufstelle einbauen

Typische Stellen:
- **Mutation**: nach `db.update(...)`/`db.insert(...)` in `server/api/...` (siehe `events/index.post.ts`, `registrations/[id].patch.ts`)
- **Lifecycle-Event**: z.B. Cancel-Endpoint (`events/[id]/cancel.post.ts`)
- **Cron**: Reminder oder zeitbasiert (`api/cron/send-reminders.post.ts` — beachte Deduplizierung über `notification_jobs`-Lookup)

Aufruf-Style: `await` wenn Fehler relevant, `void triggerXxx(...)` wenn fire-and-forget (z.B. nach Patch — der API-Call soll nicht auf Notification-Job-Insert warten, falls der lange dauert; siehe `events/[id].patch.ts`).

### 8. Tests (optional, wenn pure Logik)

Nur testen, wenn pure, deterministische Logik dabei ist:
- Recipient-Filter-Funktionen (DB-Queries **nicht** testen — gehört nicht in den Scope)
- Custom Payload-Builder
- Guards (z.B. „nicht versenden, wenn Event in Vergangenheit")

Pattern siehe `test/unit/delivery-builder.test.ts` und `test/unit/notification-preferences.test.ts`. Nach der Session `/test` aufrufen oder dem User vorschlagen.

### 9. `FEATURES.md` aktualisieren

Im Abschnitt „Notifications" einen Bullet ergänzen — kurz, einsortiert nach Themenblock (LADV, Event-Lifecycle, Reminder, etc.). Issue-Nummer referenzieren.

### 10. Lint, Typecheck, Commit

```bash
pnpm lint:fix
pnpm typecheck 2>&1; echo "Exit: $?"
```

**Commit-Konvention:**
```
feat(notifications): training_assigned typ ergänzen

- Type-Union, Defaults, Meta, Template, Maps
- Trigger-Aufruf in POST /api/training/...

Closes #<issue>
```

Falls kein Issue existiert: vor dem Commit `gh issue create` mit Label `session-log`.

## Checkliste (zum Abhaken am Ende)

- [ ] `shared/types/notifications.ts` — Type + Defaults
- [ ] `server/notifications/meta.ts` — Meta-Eintrag
- [ ] `app/emails/<Name>Email.vue` — Template-Komponente
- [ ] `server/notifications/templates.ts` — `EMAIL_TEMPLATE_MAP`, `EMAIL_SUBJECT_MAP`, `PUSH_PAYLOAD_MAP`
- [ ] (Optional) `server/notifications/triggers.ts` — Trigger-Funktion
- [ ] Aufruf an Aufrufstelle eingebaut, Errors geschluckt
- [ ] (Optional) Test in `test/unit/`
- [ ] `FEATURES.md` ergänzt
- [ ] `pnpm lint:fix` + `pnpm typecheck` grün
- [ ] Dev-Server neu gestartet (Email-Template-Registry)
- [ ] Issue referenziert / `session-log` erstellt
- [ ] Commit nach Konvention
