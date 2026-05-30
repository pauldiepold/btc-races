import { and, eq, ne } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { ThreadRow, AppDb } from './persistence'

/**
 * Stellt einen `thread_announcement`-Job in die Queue: empfangsberechtigt sind
 * alle aktiven Mitglieder außer dem Autor (kein Opt-out, mute-immun — die
 * Defaults in der Registry sind `mandatory:true` für beide Kanäle).
 *
 * Fehler werden geloggt, blockieren die Operation aber nicht (analog
 * `dispatchNewCommentNotification`).
 */
export async function dispatchAnnouncementNotification(
  thread: ThreadRow,
  actorUserId: number,
  db: AppDb,
): Promise<void> {
  try {
    const memberRows = await db
      .select({
        userId: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.membershipStatus, 'active'),
          ne(schema.users.id, actorUserId),
        ),
      )

    if (memberRows.length === 0) return

    const recipients = memberRows.map(r => ({
      userId: r.userId,
      email: r.email,
      firstName: r.firstName ?? undefined,
    }))

    const siteUrl = useRuntimeConfig().public.siteUrl
    const threadLink = `${siteUrl}/beitraege/${thread.id}`

    const { renderMarkdown } = await import('~~/shared/utils/markdown')
    const { notify } = await import('~~/server/notifications/service')

    await notify({
      type: 'thread_announcement',
      recipients,
      actorUserId,
      payload: {
        threadTitle: thread.title ?? 'Ankündigung',
        bodyMarkdown: thread.body ?? '',
        bodyHtml: renderMarkdown(thread.body ?? ''),
        threadLink,
      },
    }, db)
  }
  catch (err) {
    console.error('[Notification] thread_announcement:', err)
  }
}
