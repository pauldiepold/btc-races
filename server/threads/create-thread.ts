import type { ThreadActor } from './actor'
import { dispatchAnnouncementNotification } from './announcement-notifier'
import { ThreadError } from './errors'
import { insertThread, type AppDb } from './persistence'
import { getRoom } from './rooms'
import { canCreateThread } from './rules'

/** Maximale Titel-Länge (Zeichen, getrimmt) — Spiegel zu `edit-thread`. */
const MAX_TITLE_LENGTH = 200
/** Maximale Body-Länge (Zeichen, getrimmt) — Spiegel zu `edit-thread`. */
const MAX_BODY_LENGTH = 5000

export type CreateThreadInput = {
  roomSlug: string
  title: string
  body: string
}

export type CreateThreadDeps = {
  db: AppDb
}

export type CreateThreadResult = {
  id: number
}

/**
 * Legt einen Beitrag (Thread ohne Event-Bezug) in einem Raum an.
 * `lastActivityAt` startet auf dem Anlagezeitpunkt.
 */
export async function createThread(
  input: CreateThreadInput,
  actor: ThreadActor,
  deps: CreateThreadDeps,
): Promise<CreateThreadResult> {
  const room = getRoom(input.roomSlug)
  if (!room) throw new ThreadError('room_not_found')

  if (!canCreateThread(actor, room)) {
    throw new ThreadError('forbidden')
  }

  if (
    input.title.trim().length > MAX_TITLE_LENGTH
    || input.body.trim().length > MAX_BODY_LENGTH
  ) {
    throw new ThreadError('thread_too_long')
  }

  const now = new Date()
  const row = await insertThread(deps.db, {
    roomSlug: room.slug,
    title: input.title,
    body: input.body,
    eventId: null,
    lastActivityAt: now,
    createdBy: actor.userId,
  })

  if (room.mandatory) {
    await dispatchAnnouncementNotification(row, actor.userId, deps.db)
  }

  return { id: row.id }
}
