import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const disciplineId = getRouterParam(event, 'disciplineId')

  if (!id || !disciplineId) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Parameter' })
  }

  const registration = await db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: 'Anmeldung nicht gefunden' })
  }

  const discipline = await db.query.registrationDisciplines.findFirst({
    where: eq(schema.registrationDisciplines.id, disciplineId),
  })
  if (!discipline || discipline.registrationId !== id) {
    throw createError({ statusCode: 404, statusMessage: 'Disziplin nicht gefunden' })
  }

  if (discipline.ladvRegisteredAt === null) {
    throw createError({ statusCode: 422, statusMessage: 'Disziplin noch nicht in LADV angemeldet' })
  }

  await db
    .update(schema.registrationDisciplines)
    .set({
      ladvCanceledAt: new Date(),
      ladvCanceledBy: session.user.id,
    })
    .where(eq(schema.registrationDisciplines.id, disciplineId))

  return { id: disciplineId }
})
