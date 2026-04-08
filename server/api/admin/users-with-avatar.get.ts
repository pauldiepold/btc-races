import { db, schema } from 'hub:db'
import { isNotNull, asc, sql } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  return await db
    .select({
      id: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      avatarUrl: schema.users.avatarUrl,
      avatarCached: sql<0 | 1>`CASE WHEN ${schema.users.avatarSmall} IS NOT NULL THEN 1 ELSE 0 END`,
    })
    .from(schema.users)
    .where(isNotNull(schema.users.avatarUrl))
    .orderBy(asc(schema.users.lastName), asc(schema.users.firstName))
})
