import type { EventCoreSnapshot } from '~~/shared/utils/diff-event-core-fields'
import { diffEventCoreFields } from '~~/shared/utils/diff-event-core-fields'

export type EventNotificationDecision
  = | { type: 'event_changed' }

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
