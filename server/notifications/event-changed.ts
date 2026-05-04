import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { diffEventCoreFields, type EventCoreField, type EventCoreSnapshot } from '~~/shared/utils/diff-event-core-fields'
import { notify } from './service'
import { isEventDateInPastBerlin } from './payload-helpers'

const CORE_FIELD_LABEL: Record<EventCoreField, string> = {
  date: 'Datum',
  startTime: 'Uhrzeit',
  location: 'Ort',
}

/**
 * Vergleicht Event-Kernfelder, prüft Guards (cancelled, past) und feuert
 * `event_changed`-Notifications an alle aktiven, angemeldeten Mitglieder.
 *
 * Wird aus drei Stellen aufgerufen: manuelles Patch (mit actorUserId),
 * manueller LADV-Sync (ohne) und Cron-Bulk-Sync (ohne).
 */
export async function notifyEventChanged(
  before: EventCoreSnapshot,
  after: EventCoreSnapshot,
  eventRow: Pick<typeof schema.events.$inferSelect, 'id' | 'name' | 'date' | 'cancelledAt'>,
  actorUserId?: number,
): Promise<void> {
  if (eventRow.cancelledAt != null) return
  if (isEventDateInPastBerlin(eventRow.date)) return

  const fieldChanges = diffEventCoreFields(before, after)
  if (fieldChanges.length === 0) return

  const recipientRows = await db
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

  if (recipientRows.length === 0) return

  const siteUrl = useRuntimeConfig().public.siteUrl

  await notify({
    type: 'event_changed',
    recipients: recipientRows.map(r => ({
      userId: r.userId,
      email: r.email,
      firstName: r.firstName ?? undefined,
    })),
    actorUserId,
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
