import type { EventCoreSnapshot } from '~~/shared/utils/diff-event-core-fields'
import { diffEventCoreFields } from '~~/shared/utils/diff-event-core-fields'

export type EventNotificationDecision
  = | { type: 'event_changed' }
    | { type: 'new_event' }
    | { type: 'event_canceled' }

/**
 * Liefert eine `event_changed`-Decision, wenn sich mindestens ein Core-Field
 * (Datum, Startzeit, Ort) geändert hat. `opts.silent` unterdrückt jede
 * Notification, auch bei Core-Field-Change.
 */
export function decideChangeNotifications(
  before: EventCoreSnapshot,
  after: EventCoreSnapshot,
  opts: { silent?: boolean } = {},
): EventNotificationDecision[] {
  if (opts.silent) return []
  if (diffEventCoreFields(before, after).length === 0) return []
  return [{ type: 'event_changed' }]
}

/**
 * Liefert eine `new_event`-Decision für einen neu erzeugten Event.
 * Recipients und Payload werden im Dispatcher aufgelöst.
 */
export function decideCreateNotifications(): EventNotificationDecision[] {
  return [{ type: 'new_event' }]
}

/**
 * Liefert eine `event_canceled`-Decision für einen abgesagten Event.
 * `opts.silent` unterdrückt die Notification (für symmetrische API).
 */
export function decideCancelNotifications(
  opts: { silent?: boolean } = {},
): EventNotificationDecision[] {
  if (opts.silent) return []
  return [{ type: 'event_canceled' }]
}
