import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { ThreadActor } from './actor'
import { ThreadError } from './errors'
import { findThreadById, type AppDb } from './persistence'

export type SetOverrideInput = {
  threadId: number
  /** `null` löscht eine eventuell vorhandene Override-Zeile (Auto-Verhalten). */
  state: 'muted' | 'following' | null
}

export type SetOverrideDeps = {
  db: AppDb
}

/**
 * Setzt, ändert oder entfernt das explizite Empfänger-Override eines Users
 * für einen Thread. Idempotent — `UNIQUE(userId, threadId)` garantiert, dass
 * höchstens eine Row pro Paar existiert.
 *
 * Bewusst keine Magie: spätere Aktionen (z. B. eigenes Kommentieren) heben ein
 * `muted` NICHT auf — das entscheidet `resolveRecipients()` über die Override-Tabelle.
 */
export async function setOverride(
  input: SetOverrideInput,
  actor: ThreadActor,
  deps: SetOverrideDeps,
): Promise<void> {
  const thread = await findThreadById(deps.db, input.threadId)
  if (!thread) throw new ThreadError('thread_not_found')

  if (input.state === null) {
    await deps.db.delete(schema.threadOverrides).where(
      and(
        eq(schema.threadOverrides.userId, actor.userId),
        eq(schema.threadOverrides.threadId, input.threadId),
      ),
    )
    return
  }

  await deps.db
    .insert(schema.threadOverrides)
    .values({
      userId: actor.userId,
      threadId: input.threadId,
      state: input.state,
    })
    .onConflictDoUpdate({
      target: [schema.threadOverrides.userId, schema.threadOverrides.threadId],
      set: { state: input.state },
    })
}
