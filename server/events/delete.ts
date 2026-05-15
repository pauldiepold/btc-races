import type { EventActor } from './actor'
import { EventError } from './errors'
import { deleteEventById, loadEventById, type AppDb } from './persistence'
import { canDeleteEvent } from './rules'

export type DeleteEventDeps = {
  db: AppDb
}

export type DeleteEventResult = {
  id: number
}

export async function deleteEvent(
  eventId: number,
  actor: EventActor,
  deps: DeleteEventDeps,
): Promise<DeleteEventResult> {
  const { db } = deps

  if (!canDeleteEvent(actor)) {
    throw new EventError('forbidden')
  }

  const dbEvent = await loadEventById(db, eventId)
  if (!dbEvent) throw new EventError('event_not_found')

  await deleteEventById(db, eventId)

  return { id: eventId }
}
