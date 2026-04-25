import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { diffEventCoreFields, type EventCoreField, type EventCoreSnapshot } from '~~/shared/utils/diff-event-core-fields'
import { notificationService } from './service'
import { formatEventDate } from '~~/shared/utils/events'

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

/**
 * N-05: Neues Event veröffentlicht — Benachrichtigung an alle aktiven Mitglieder.
 * Legt einen Queue-Job an (INSERT). Der Cron-Worker verarbeitet ihn asynchron.
 * Fehler werden geloggt und nicht an den Caller weitergereicht.
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
    console.error('[Notification] Fehler beim Erstellen des Jobs:', err)
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
    console.error('[Notification] Fehler beim Erstellen des Jobs (event_changed):', err)
  }
}
