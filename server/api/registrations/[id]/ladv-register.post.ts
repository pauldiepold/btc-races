import { db, schema } from 'hub:db'
import { and, eq, isNull } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const rawId = getRouterParam(event, 'id')

  if (!rawId) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Parameter' })
  }

  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Anmeldungs-ID' })
  }

  const registration = await db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: 'Anmeldung nicht gefunden' })
  }

  if (registration.status !== 'registered') {
    throw createError({ statusCode: 422, statusMessage: 'Anmeldung nicht im Status "registered"' })
  }

  await db
    .update(schema.registrationDisciplines)
    .set({
      ladvRegisteredAt: new Date(),
      ladvRegisteredBy: session.user.id,
    })
    .where(
      and(
        eq(schema.registrationDisciplines.registrationId, id),
        isNull(schema.registrationDisciplines.ladvRegisteredAt),
      ),
    )

  return { id }
})
