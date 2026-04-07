import { db, schema } from 'hub:db'
import { and, count, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
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

  if (registration.userId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung' })
  }

  // Mindestens 1 Disziplin muss verbleiben
  const [countResult] = await db
    .select({ value: count() })
    .from(schema.registrationDisciplines)
    .where(eq(schema.registrationDisciplines.registrationId, id))

  if ((countResult?.value ?? 0) <= 1) {
    throw createError({ statusCode: 422, statusMessage: 'Mindestens eine Disziplin muss verbleiben' })
  }

  await db
    .delete(schema.registrationDisciplines)
    .where(
      and(
        eq(schema.registrationDisciplines.id, disciplineId),
        eq(schema.registrationDisciplines.registrationId, id),
      ),
    )

  setResponseStatus(event, 204)
  return null
})
