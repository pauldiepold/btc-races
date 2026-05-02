import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { diffEventCoreFields, type EventCoreField, type EventCoreSnapshot } from '~~/shared/utils/diff-event-core-fields'
import { notificationService } from './service'
import { formatEventDate } from '~~/shared/utils/events'
import { ladvDisciplineLabel, ladvAgeClassLabel } from '~~/shared/utils/ladv-labels'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'

const berlinDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })

const CORE_FIELD_LABEL: Record<EventCoreField, string> = {
  date: 'Datum',
  startTime: 'Uhrzeit',
  location: 'Ort',
}

export function toEventCoreSnapshot(
  row: { date: string | null, startTime: string | null, location: string | null },
): EventCoreSnapshot {
  return { date: row.date, startTime: row.startTime, location: row.location }
}

function isEventDateInPastBerlin(date: string | null): boolean {
  if (!date) return false
  const today = berlinDateFormatter.format(new Date())
  return date < today
}

function logTriggerError(type: string, err: unknown): void {
  console.error(`[Notification] Fehler beim Erstellen des Jobs (${type}):`, err)
}

function buildEventPayload(
  dbEvent: Pick<typeof schema.events.$inferSelect, 'id' | 'name' | 'date' | 'location' | 'registrationDeadline'>,
) {
  const siteUrl = useRuntimeConfig().public.siteUrl
  return {
    eventName: dbEvent.name,
    eventDate: formatEventDate(dbEvent.date) ?? undefined,
    eventLocation: dbEvent.location ?? undefined,
    registrationDeadline: formatEventDate(dbEvent.registrationDeadline) ?? undefined,
    eventLink: `${siteUrl}/${encodeEventId(dbEvent.id)}`,
  }
}

function formatDisciplineLabels(disciplines: RegistrationDisciplinePair[]): string[] {
  return disciplines.map(d => `${ladvDisciplineLabel(d.discipline)} (${ladvAgeClassLabel(d.ageClass)})`)
}

/**
 * Neues Event veröffentlicht — Benachrichtigung an alle aktiven Mitglieder.
 */
export async function triggerNewEventNotification(eventData: {
  id: number
  name: string
  date: string | null
  location: string | null
  registrationDeadline: string | null
}): Promise<void> {
  try {
    const siteUrl = useRuntimeConfig().public.siteUrl

    await notificationService.enqueue({
      type: 'new_event',
      recipients: 'all_members',
      payload: {
        eventName: eventData.name,
        eventDate: formatEventDate(eventData.date) ?? undefined,
        eventLocation: eventData.location ?? undefined,
        registrationDeadline: formatEventDate(eventData.registrationDeadline) ?? undefined,
        eventLink: `${siteUrl}/${encodeEventId(eventData.id)}`,
      },
      eventId: eventData.id,
    })
  }
  catch (err) {
    logTriggerError('new_event', err)
  }
}

/**
 * Kernfeld-Änderungen (Datum, Uhrzeit, Ort) — Benachrichtigung an angemeldete Mitglieder.
 * `eventRow` soll den Zustand **nach** dem Update widerspiegeln (Guards: Absage, Vergangenheit).
 */
export async function triggerEventChangedNotification(
  before: EventCoreSnapshot,
  after: EventCoreSnapshot,
  eventRow: Pick<typeof schema.events.$inferSelect, 'id' | 'name' | 'date' | 'cancelledAt'>,
): Promise<void> {
  try {
    if (eventRow.cancelledAt != null) return
    if (isEventDateInPastBerlin(eventRow.date)) return

    const fieldChanges = diffEventCoreFields(before, after)
    if (fieldChanges.length === 0) return

    const recipients = await db
      .select({
        userId: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .where(
        and(
          eq(schema.registrations.eventId, eventRow.id),
          inArray(schema.registrations.status, ['registered', 'yes', 'maybe']),
          eq(schema.users.membershipStatus, 'active'),
        ),
      )

    if (recipients.length === 0) return

    const siteUrl = useRuntimeConfig().public.siteUrl

    await notificationService.enqueue({
      type: 'event_changed',
      recipients: recipients.map(r => ({
        userId: r.userId,
        email: r.email,
        firstName: r.firstName ?? undefined,
      })),
      payload: {
        eventName: eventRow.name,
        eventLink: `${siteUrl}/${encodeEventId(eventRow.id)}`,
        changes: fieldChanges.map(c => ({
          field: c.field,
          before: c.before,
          after: c.after,
          label: CORE_FIELD_LABEL[c.field],
        })),
      },
      eventId: eventRow.id,
    })
  }
  catch (err) {
    logTriggerError('event_changed', err)
  }
}

/**
 * Event abgesagt — Benachrichtigung an alle (nicht stornierten) Anmeldungen.
 */
export async function triggerEventCanceledNotification(eventId: number): Promise<void> {
  try {
    const dbEvent = await db.query.events.findFirst({
      where: eq(schema.events.id, eventId),
    })
    if (!dbEvent) return

    const recipients = await db
      .select({
        userId: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .where(
        and(
          eq(schema.registrations.eventId, eventId),
          notInArray(schema.registrations.status, ['canceled', 'no']),
        ),
      )

    if (recipients.length === 0) return

    await notificationService.enqueue({
      type: 'event_canceled',
      recipients: recipients.map(r => ({
        userId: r.userId,
        email: r.email,
        firstName: r.firstName ?? undefined,
      })),
      payload: buildEventPayload(dbEvent),
      eventId,
    })
  }
  catch (err) {
    logTriggerError('event_canceled', err)
  }
}

/**
 * Anmeldung bestätigt (User meldet sich selbst zu LADV-Event an).
 */
export async function triggerRegistrationConfirmationNotification(
  userId: number,
  eventId: number,
): Promise<void> {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { id: true, email: true, firstName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])
    if (!user || !dbEvent) return

    await notificationService.enqueue({
      type: 'registration_confirmation',
      recipients: [{ userId: user.id, email: user.email, firstName: user.firstName ?? undefined }],
      payload: buildEventPayload(dbEvent),
      eventId,
    })
  }
  catch (err) {
    logTriggerError('registration_confirmation', err)
  }
}

/**
 * Admin meldet ein Mitglied an. Bei `setLadv` mit Disziplinen wird direkt eine
 * LADV-Bestätigung statt der Standard-Admin-Benachrichtigung verschickt.
 */
export async function triggerAdminRegisteredNotification(
  userId: number,
  eventId: number,
  options: {
    wishDisciplines: RegistrationDisciplinePair[] | null
    setLadv: boolean
    adminFirstName: string
  },
): Promise<void> {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { id: true, email: true, firstName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])
    if (!user || !dbEvent) return

    const recipient = { userId: user.id, email: user.email, firstName: user.firstName ?? undefined }
    const basePayload = buildEventPayload(dbEvent)
    const { wishDisciplines, setLadv, adminFirstName } = options

    if (setLadv && wishDisciplines && wishDisciplines.length > 0) {
      await notificationService.enqueue({
        type: 'ladv_registered',
        recipients: [recipient],
        payload: { ...basePayload, disciplines: formatDisciplineLabels(wishDisciplines) },
        eventId,
      })
    }
    else {
      await notificationService.enqueue({
        type: 'admin_registered_member',
        recipients: [recipient],
        payload: {
          ...basePayload,
          adminFirstName,
          ...(wishDisciplines && wishDisciplines.length > 0
            ? { disciplines: formatDisciplineLabels(wishDisciplines) }
            : {}),
        },
        eventId,
      })
    }
  }
  catch (err) {
    logTriggerError('admin_registered_member', err)
  }
}

/**
 * Admin ändert eine fremde Anmeldung — Mitglied informieren.
 */
export async function triggerAdminChangedRegistrationNotification(
  userId: number,
  eventId: number,
  adminFirstName: string,
): Promise<void> {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { id: true, email: true, firstName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])
    if (!user || !dbEvent) return

    await notificationService.enqueue({
      type: 'admin_changed_member_registration',
      recipients: [{ userId: user.id, email: user.email, firstName: user.firstName ?? undefined }],
      payload: {
        ...buildEventPayload(dbEvent),
        adminFirstName,
      },
      eventId,
    })
  }
  catch (err) {
    logTriggerError('admin_changed_member_registration', err)
  }
}

/**
 * Athlet storniert nach bereits erfolgter LADV-Meldung — Admins informieren.
 */
export async function triggerAthleteCanceledAfterLadvNotification(
  userId: number,
  eventId: number,
): Promise<void> {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { firstName: true, lastName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])
    if (!user || !dbEvent) return

    await notificationService.enqueue({
      type: 'athlete_canceled_after_ladv',
      recipients: 'all_admins',
      payload: {
        ...buildEventPayload(dbEvent),
        memberFirstName: user.firstName ?? '',
        memberLastName: user.lastName ?? '',
        athleteName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      },
      eventId,
    })
  }
  catch (err) {
    logTriggerError('athlete_canceled_after_ladv', err)
  }
}

/**
 * Athlet ändert seine Wunsch-Disziplinen nach bereits erfolgter LADV-Meldung — Admins informieren.
 */
export async function triggerAthleteChangedAfterLadvNotification(
  userId: number,
  eventId: number,
): Promise<void> {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { firstName: true, lastName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])
    if (!user || !dbEvent) return

    await notificationService.enqueue({
      type: 'athlete_changed_after_ladv',
      recipients: 'all_admins',
      payload: {
        ...buildEventPayload(dbEvent),
        memberFirstName: user.firstName ?? '',
        memberLastName: user.lastName ?? '',
        athleteName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      },
      eventId,
    })
  }
  catch (err) {
    logTriggerError('athlete_changed_after_ladv', err)
  }
}

/**
 * Admin setzt LADV-Stand: bei nicht-leerer Disziplinenliste → Bestätigung,
 * bei leerer Liste (null) → Abmeldung an den Athleten.
 */
export async function triggerLadvStandNotification(
  userId: number,
  eventId: number,
  disciplines: RegistrationDisciplinePair[] | null,
): Promise<void> {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { id: true, email: true, firstName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])
    if (!user || !dbEvent) return

    const recipient = { userId: user.id, email: user.email, firstName: user.firstName ?? undefined }
    const basePayload = buildEventPayload(dbEvent)

    if (disciplines && disciplines.length > 0) {
      await notificationService.enqueue({
        type: 'ladv_registered',
        recipients: [recipient],
        payload: { ...basePayload, disciplines: formatDisciplineLabels(disciplines) },
        eventId,
      })
    }
    else {
      await notificationService.enqueue({
        type: 'ladv_canceled',
        recipients: [recipient],
        payload: basePayload,
        eventId,
      })
    }
  }
  catch (err) {
    logTriggerError('ladv_stand', err)
  }
}
