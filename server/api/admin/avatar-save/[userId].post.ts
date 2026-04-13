import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rawUserId = getRouterParam(event, 'userId')
  if (!rawUserId) throw createError({ statusCode: 400, statusMessage: 'userId fehlt' })

  const userId = Number(rawUserId)
  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige User-ID' })
  }

  const body = await readBody<{ small?: string, large?: string }>(event)
  if (!body?.small || !body?.large) {
    throw createError({ statusCode: 400, statusMessage: 'small und large sind erforderlich' })
  }

  await db.update(schema.users)
    .set({
      avatarSmall: body.small,
      avatarLarge: body.large,
      avatarUpdatedAt: new Date().toISOString(),
      avatarNeedsResync: 0,
    })
    .where(eq(schema.users.id, userId))

  return { ok: true }
})
