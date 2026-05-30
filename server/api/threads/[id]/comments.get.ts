import { db, schema } from 'hub:db'
import { inArray } from 'drizzle-orm'
import { z } from 'zod'
import type { CommentWithAuthor } from '~~/shared/types/threads'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import { listComments } from '~~/server/threads'

const querySchema = z.object({
  since: z.coerce.date().optional(),
})

/** „Vorname N." — abgeleiteter Anzeigename, analog zur Event-Detailseite. */
function displayName(user: { firstName: string | null, lastName: string | null }): string | null {
  return [user.firstName, user.lastName ? `${user.lastName[0]}.` : null]
    .filter(Boolean)
    .join(' ') || null
}

export default defineEventHandler(async (event): Promise<CommentWithAuthor[]> => {
  await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Thread-ID')

  const params = querySchema.safeParse(getQuery(event))
  if (!params.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Query-Parameter' })
  }

  const comments = await listComments({ threadId: id, since: params.data.since }, { db })

  const authorIds = [...new Set(
    comments.map(c => c.userId).filter((x): x is number => x !== null),
  )]
  const authors = authorIds.length
    ? await db.query.users.findMany({
        where: inArray(schema.users.id, authorIds),
        columns: { id: true, firstName: true, lastName: true },
      })
    : []
  const nameById = new Map(authors.map(a => [a.id, displayName(a)]))

  return comments.map(c => ({
    ...c,
    authorName: c.userId !== null ? nameById.get(c.userId) ?? null : null,
  }))
})
