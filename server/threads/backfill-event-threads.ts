import { ensureEventThread } from './ensure-event-thread'
import { findEventIdsWithoutThread, type AppDb } from './persistence'

export type BackfillEventThreadsDeps = {
  db: AppDb
}

export type BackfillEventThreadsResult = {
  created: number
}

/**
 * Legt jedem Event, das noch keinen Event-Thread besitzt, einen an. Idempotent:
 * Wird über `ensureEventThread` realisiert, ein erneuter Lauf legt nichts Neues
 * an. Gedacht für den einmaligen Lauf gegen die Produktions-D1 nach Rollout.
 */
export async function backfillEventThreads(
  deps: BackfillEventThreadsDeps,
): Promise<BackfillEventThreadsResult> {
  const eventIds = await findEventIdsWithoutThread(deps.db)
  for (const eventId of eventIds) {
    await ensureEventThread({ eventId }, deps)
  }
  return { created: eventIds.length }
}
