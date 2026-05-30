import { db } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { requireNumericIdParam } from '~~/server/utils/route-params'
import type { ThreadOverrideState } from '~~/server/threads'

export type ThreadOverrideResponse = {
  state: ThreadOverrideState | null
}

export default defineEventHandler(async (event): Promise<ThreadOverrideResponse> => {
  const session = await requireUserSession(event)
  const id = requireNumericIdParam(event, 'Thread-ID')

  const row = await db.query.threadOverrides.findFirst({
    where: and(
      eq(schema.threadOverrides.userId, session.user.id),
      eq(schema.threadOverrides.threadId, id),
    ),
    columns: { state: true },
  })

  return { state: row?.state ?? null }
})
