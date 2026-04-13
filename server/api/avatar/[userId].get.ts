import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const rawUserId = getRouterParam(event, 'userId')
  const query = getQuery(event)
  const size = query.size === 'large' ? 'large' : 'small'

  const userId = Number(rawUserId)
  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige User-ID' })
  }

  const user = await db
    .select({ avatarSmall: schema.users.avatarSmall, avatarLarge: schema.users.avatarLarge, avatarUpdatedAt: schema.users.avatarUpdatedAt })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get()

  const base64 = size === 'large' ? user?.avatarLarge : user?.avatarSmall

  if (!base64) {
    throw createError({ statusCode: 404, message: 'No avatar' })
  }

  const etag = user?.avatarUpdatedAt ?? 'unknown'
  const ifNoneMatch = getHeader(event, 'if-none-match')

  if (ifNoneMatch === `"${etag}"`) {
    setResponseStatus(event, 304)
    return null
  }

  setResponseHeaders(event, {
    'Content-Type': 'image/jpeg',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': `"${etag}"`,
  })

  return Buffer.from(base64, 'base64')
})
