import { db, schema } from 'hub:db'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Parameter' })
  }

  const registration = await db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: 'Anmeldung nicht gefunden' })
  }

  await db
    .update(schema.registrationDisciplines)
    .set({
      ladvCanceledAt: new Date(),
      ladvCanceledBy: session.user.id,
    })
    .where(
      and(
        eq(schema.registrationDisciplines.registrationId, id),
        isNotNull(schema.registrationDisciplines.ladvRegisteredAt),
        isNull(schema.registrationDisciplines.ladvCanceledAt),
      ),
    )

  return { id }
})
