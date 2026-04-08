import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'
import { send, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const userId = getRouterParam(event, 'userId')
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'userId fehlt' })

  const [user] = await db
    .select({ avatarUrl: schema.users.avatarUrl })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  if (!user) throw createError({ statusCode: 404, statusMessage: 'User nicht gefunden' })
  if (!user.avatarUrl) throw createError({ statusCode: 404, statusMessage: 'Kein Avatar-URL vorhanden' })

  const response = await fetch(user.avatarUrl)
  if (response.status === 404) {
    throw createError({ statusCode: 404, statusMessage: 'Avatar nicht mehr bei Campai vorhanden' })
  }
  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: `Campai-Avatar konnte nicht geladen werden (${response.status})` })
  }

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') ?? 'image/webp'
  setHeader(event, 'Content-Type', contentType)
  return send(event, Buffer.from(buffer))
})
