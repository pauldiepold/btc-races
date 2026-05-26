import { and, eq, inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { AppDb } from './persistence'

export type ThreadOverrideState = 'muted' | 'following'

export type ThreadOverrideEntry = {
  userId: number
  state: ThreadOverrideState
}

/** Pure-Eingabe: alles, was zur Empfänger-Auflösung gebraucht wird. */
export type ResolveRecipientsInput = {
  /** Autor des Threads (Beiträge); bei Event-Threads i.d.R. null. */
  threadAuthorId: number | null
  /** Alle bisherigen Kommentatoren des Threads (inkl. eventuell des Trigger-Autors). */
  commenterIds: number[]
  /**
   * Bei Event-Threads die User, deren Anmelde-Status zum Verteilen berechtigt
   * (`registered`/`yes`/`maybe`). Bei Beiträgen leer.
   */
  eventParticipantIds: number[]
  /** Explizite Overrides aus `thread_overrides`. */
  overrides: ThreadOverrideEntry[]
  /** User-ID des auslösenden Kommentar-Autors — wird immer ausgeschlossen. */
  triggerAuthorId: number
}

/**
 * Reine Mengen-Auflösung der Empfänger für `thread_new_comment`.
 *
 * Automatische Empfänger = Thread-Autor ∪ bisherige Kommentatoren ∪
 * (bei Event-Threads) Event-Teilnehmer mit aktivem Anmelde-Status.
 * Plus explizit `following`-Overrides, minus `muted`-Overrides, minus Trigger-Autor.
 * Bei widersprüchlichen Overrides (mute + follow) gewinnt `muted`.
 */
export function resolveRecipients(input: ResolveRecipientsInput): number[] {
  const muted = new Set<number>()
  const following = new Set<number>()
  for (const override of input.overrides) {
    if (override.state === 'muted') muted.add(override.userId)
    else if (override.state === 'following') following.add(override.userId)
  }

  const recipients = new Set<number>()
  if (input.threadAuthorId != null) recipients.add(input.threadAuthorId)
  for (const id of input.commenterIds) recipients.add(id)
  for (const id of input.eventParticipantIds) recipients.add(id)
  for (const id of following) recipients.add(id)

  for (const id of muted) recipients.delete(id)
  recipients.delete(input.triggerAuthorId)

  return [...recipients]
}

// ---------------------------------------------------------------------------
// DB-Hülle — beschafft die Rohdaten für den pure-Kern.
// ---------------------------------------------------------------------------

export type LoadRecipientInputsArgs = {
  threadId: number
  /** Bei Event-Threads die `eventId`, sonst null. */
  eventId: number | null
  triggerAuthorId: number
}

const EVENT_PARTICIPANT_STATUSES = ['registered', 'yes', 'maybe'] as const

/**
 * Lädt die Daten für `resolveRecipients()` aus der DB.
 * Liefert eine Eingabe, die direkt an die pure Funktion weitergereicht werden kann.
 */
export async function loadRecipientInputs(
  db: AppDb,
  args: LoadRecipientInputsArgs,
): Promise<ResolveRecipientsInput> {
  const threadRow = await db.query.threads.findFirst({
    where: eq(schema.threads.id, args.threadId),
    columns: { createdBy: true },
  })

  const commenterRows = await db
    .selectDistinct({ userId: schema.comments.userId })
    .from(schema.comments)
    .where(eq(schema.comments.threadId, args.threadId))

  const commenterIds = commenterRows
    .map(r => r.userId)
    .filter((id): id is number => id != null)

  let eventParticipantIds: number[] = []
  if (args.eventId != null) {
    const rows = await db
      .select({ userId: schema.registrations.userId })
      .from(schema.registrations)
      .where(
        and(
          eq(schema.registrations.eventId, args.eventId),
          inArray(schema.registrations.status, [...EVENT_PARTICIPANT_STATUSES]),
        ),
      )
    eventParticipantIds = rows.map(r => r.userId)
  }

  const overrideRows = await db
    .select({
      userId: schema.threadOverrides.userId,
      state: schema.threadOverrides.state,
    })
    .from(schema.threadOverrides)
    .where(eq(schema.threadOverrides.threadId, args.threadId))

  return {
    threadAuthorId: threadRow?.createdBy ?? null,
    commenterIds,
    eventParticipantIds,
    overrides: overrideRows.map(r => ({ userId: r.userId, state: r.state })),
    triggerAuthorId: args.triggerAuthorId,
  }
}
