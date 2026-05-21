import type { schema } from 'hub:db'
import { diffEventCoreFields, toEventCoreSnapshot, type EventCoreField } from '~~/shared/utils/diff-event-core-fields'
import { notify, type NotifyDb } from './service'
import { recipients } from './recipients'
import { isEventDateInPastBerlin } from './payload-helpers'

const CORE_FIELD_LABEL: Record<EventCoreField, string> = {
  date: 'Datum',
  startTime: 'Uhrzeit',
  location: 'Ort',
}

type EventBefore = Pick<typeof schema.events.$inferSelect, 'date' | 'startTime' | 'location'>
type EventAfter = Pick<typeof schema.events.$inferSelect, 'id' | 'name' | 'type' | 'date' | 'startTime' | 'location' | 'cancelledAt'>

/**
 * Vergleicht Event-Kernfelder, prüft Guards (cancelled, past) und feuert
 * `event_changed`-Notifications an die angemeldeten Mitglieder. Inaktive
 * Mitglieder werden zentral im Worker ausgeschlossen (ADR-0003).
 *
 * Wird vom `server/events/`-Modul (Patch, Sync) gerufen.
 */
export async function notifyEventChanged(
  eventBefore: EventBefore,
  eventAfter: EventAfter,
  actorUserId?: number,
  db?: NotifyDb,
): Promise<void> {
  if (eventAfter.cancelledAt != null) return
  if (isEventDateInPastBerlin(eventAfter.date)) return

  const fieldChanges = diffEventCoreFields(
    toEventCoreSnapshot(eventBefore),
    toEventCoreSnapshot(eventAfter),
  )
  if (fieldChanges.length === 0) return

  const eventRecipients = await recipients.registeredFor(
    eventAfter.id,
    { statuses: ['registered', 'yes', 'maybe'] },
    db,
  )
  if (eventRecipients.length === 0) return

  const siteUrl = useRuntimeConfig().public.siteUrl

  await notify({
    type: 'event_changed',
    recipients: eventRecipients,
    actorUserId,
    payload: {
      eventName: eventAfter.name,
      eventType: eventAfter.type,
      eventLink: `${siteUrl}/${encodeEventId(eventAfter.id)}`,
      changes: fieldChanges.map(c => ({
        field: c.field,
        before: c.before,
        after: c.after,
        label: CORE_FIELD_LABEL[c.field],
      })),
    },
    eventId: eventAfter.id,
  }, db)
}
