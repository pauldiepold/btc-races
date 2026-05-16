import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { parseBody } from '~~/server/utils/parse-body'

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await parseBody(event, unsubscribeSchema)

  await db.delete(schema.pushSubscriptions)
    .where(
      and(
        eq(schema.pushSubscriptions.userId, session.user.id),
        eq(schema.pushSubscriptions.endpoint, body.endpoint),
      ),
    )

  return { ok: true }
})
