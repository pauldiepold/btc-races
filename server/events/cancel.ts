import type { EventActor } from './actor'
import { EventError } from './errors'
import { decideCancelNotifications } from './notifications'
import { dispatchEventNotifications } from './notifier'
import { loadEventById, updateEvent, type AppDb, type EventRow } from './persistence'
import { canModifyEvent } from './rules'

export type CancelEventDeps = {
  db: AppDb
}

export type CancelEventResult = {
  id: number
  cancelled: boolean
}

export async function cancelEvent(
  eventId: number,
  actor: EventActor,
  deps: CancelEventDeps,
  reason?: string,
): Promise<CancelEventResult> {
  const { db } = deps

  const dbEvent = await loadEventById(db, eventId)
  if (!dbEvent) throw new EventError('event_not_found')

  if (!canModifyEvent(actor, dbEvent)) {
    throw new EventError('forbidden')
  }

  if (dbEvent.cancelledAt) {
    return { id: eventId, cancelled: false }
  }

  const cancelReason = reason?.trim() || null

  const now = new Date()
  await updateEvent(db, eventId, { cancelledAt: now, cancelReason, updatedAt: now })

  const eventAfter: EventRow = { ...dbEvent, cancelledAt: now, cancelReason, updatedAt: now }

  const decisions = decideCancelNotifications()
  await dispatchEventNotifications(decisions, {
    dbEvent: eventAfter,
    actorUserId: actor.userId,
    db,
  })

  return { id: eventId, cancelled: true }
}
