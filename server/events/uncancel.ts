import type { EventActor } from './actor'
import { EventError } from './errors'
import { loadEventById, updateEvent, type AppDb } from './persistence'
import { canModifyEvent } from './rules'

export type UncancelEventDeps = {
  db: AppDb
}

export type UncancelEventResult = {
  id: number
  uncancelled: boolean
}

export async function uncancelEvent(
  eventId: number,
  actor: EventActor,
  deps: UncancelEventDeps,
): Promise<UncancelEventResult> {
  const { db } = deps

  const dbEvent = await loadEventById(db, eventId)
  if (!dbEvent) throw new EventError('event_not_found')

  if (!canModifyEvent(actor, dbEvent)) {
    throw new EventError('forbidden')
  }

  if (dbEvent.cancelledAt == null) {
    return { id: eventId, uncancelled: false }
  }

  const now = new Date()
  await updateEvent(db, eventId, { cancelledAt: null, updatedAt: now })

  return { id: eventId, uncancelled: true }
}
