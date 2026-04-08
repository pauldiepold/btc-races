import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const userId = getRouterParam(event, 'userId')
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'userId fehlt' })

  const body = await readBody<{ small?: string, large?: string }>(event)
  if (!body?.small || !body?.large) {
    throw createError({ statusCode: 400, statusMessage: 'small und large sind erforderlich' })
  }

  await db.update(schema.users)
    .set({
      avatarSmall: body.small,
      avatarLarge: body.large,
      avatarUpdatedAt: new Date().toISOString(),
    })
    .where(eq(schema.users.id, userId))

  return { ok: true }
})
