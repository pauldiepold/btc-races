import { eq, inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { ROOMS } from './rooms'
import { loadRecipientInputs, resolveRecipients } from './recipients'
import type { AppDb, CommentRow, ThreadRow } from './persistence'

/**
 * Stellt einen `thread_new_comment`-Job in die Queue, wenn es jenseits des
 * Trigger-Autors Empfänger gibt. Fehler werden geloggt, blockieren die
 * Operation aber nicht (analog `dispatchEventNotifications`).
 */
export async function dispatchNewCommentNotification(
  thread: ThreadRow,
  comment: CommentRow,
  actorUserId: number,
  db: AppDb,
): Promise<void> {
  try {
    const inputs = await loadRecipientInputs(db, {
      threadId: thread.id,
      eventId: thread.eventId,
      triggerAuthorId: actorUserId,
    })
    const recipientIds = resolveRecipients(inputs)
    if (recipientIds.length === 0) return

    const userRows = await db
      .select({
        userId: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
      })
      .from(schema.users)
      .where(inArray(schema.users.id, recipientIds))

    const recipients = userRows.map(r => ({
      userId: r.userId,
      email: r.email,
      firstName: r.firstName ?? undefined,
    }))
    if (recipients.length === 0) return

    const threadTitle = await deriveThreadTitle(db, thread)
    const roomLabel = ROOMS.find(r => r.slug === thread.roomSlug)?.title ?? thread.roomSlug
    const threadLink = await buildThreadLink(thread)

    const { renderMarkdown } = await import('~~/shared/utils/markdown')
    const { notify } = await import('~~/server/notifications/service')
    await notify({
      type: 'thread_new_comment',
      recipients,
      actorUserId,
      payload: {
        threadTitle,
        roomLabel,
        commentBodyMarkdown: comment.body,
        commentBodyHtml: renderMarkdown(comment.body),
        threadLink,
      },
    }, db)
  }
  catch (err) {
    console.error('[Notification] thread_new_comment:', err)
  }
}

async function deriveThreadTitle(db: AppDb, thread: ThreadRow): Promise<string> {
  if (thread.title) return thread.title
  if (thread.eventId != null) {
    const event = await db.query.events.findFirst({
      where: eq(schema.events.id, thread.eventId),
      columns: { name: true },
    })
    if (event?.name) return event.name
  }
  return 'Thread'
}

async function buildThreadLink(thread: ThreadRow): Promise<string> {
  const siteUrl = useRuntimeConfig().public.siteUrl
  if (thread.eventId != null) {
    const { encodeEventId } = await import('~~/server/utils/sqids')
    return `${siteUrl}/${encodeEventId(thread.eventId)}`
  }
  return `${siteUrl}/beitraege/${thread.id}`
}
