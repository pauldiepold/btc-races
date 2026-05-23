import { ThreadError } from './errors'
import { eventTypeToRoom } from './event-mapping'
import {
  findEventById,
  findThreadByEventId,
  insertThread,
  type AppDb,
} from './persistence'

export type EnsureEventThreadInput = {
  eventId: number
}

export type EnsureEventThreadDeps = {
  db: AppDb
}

export type EnsureEventThreadResult = {
  id: number
}

/**
 * Stellt sicher, dass ein Event genau einen Event-Thread besitzt. Idempotent —
 * existiert der Thread schon, wird seine ID zurückgegeben.
 *
 * Event-Threads haben keinen Titel/Body (Titel = Event-Name, abgeleitet); der
 * Sort-Key `lastActivityAt` startet auf dem Event-Erstelldatum.
 */
export async function ensureEventThread(
  input: EnsureEventThreadInput,
  deps: EnsureEventThreadDeps,
): Promise<EnsureEventThreadResult> {
  const existing = await findThreadByEventId(deps.db, input.eventId)
  if (existing) return { id: existing.id }

  const event = await findEventById(deps.db, input.eventId)
  if (!event) throw new ThreadError('event_not_found')

  const row = await insertThread(deps.db, {
    roomSlug: eventTypeToRoom(event.type),
    title: null,
    body: null,
    eventId: event.id,
    lastActivityAt: event.createdAt,
    createdBy: event.createdBy ?? null,
  })

  return { id: row.id }
}
