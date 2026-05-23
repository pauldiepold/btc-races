import { db } from 'hub:db'
import type { Thread } from '~~/shared/types/threads'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { ensureEventThread, getThread, withThreadErrorMapping } from '~~/server/threads'

/**
 * Liefert den Event-Thread eines Events. Login-pflichtig — der Kommentarbereich
 * ist ausschließlich für eingeloggte Mitglieder sichtbar.
 *
 * `ensureEventThread` ist idempotent, dient hier als Sicherheitsnetz, falls für
 * ein Bestands-Event noch kein Thread vorhanden ist.
 */
export default defineEventHandler(async (event): Promise<Thread> => {
  await requireUserSession(event)
  const eventId = requireEventIdParam(event)

  return withThreadErrorMapping(async () => {
    const { id: threadId } = await ensureEventThread({ eventId }, { db })
    return getThread({ threadId }, { db })
  })
})
