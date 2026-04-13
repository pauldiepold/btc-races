import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { isDeadlineExpired } from '~~/shared/utils/deadlines'

const bodySchema = z.object({
  discipline: z.string().min(1),
  ageClass: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const rawId = getRouterParam(event, 'id')

  if (!rawId) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Anmeldungs-ID' })
  }

  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Anmeldungs-ID' })
  }

  const body = await readBody(event)
  const result = bodySchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Validierungsfehler' })
  }

  const { discipline, ageClass } = result.data

  const registration = await db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: 'Anmeldung nicht gefunden' })
  }

  if (registration.userId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung' })
  }

  // Disziplinen nur bei LADV-Anmeldungen
  const dbEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, registration.eventId),
  })
  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }
  if (dbEvent.type !== 'ladv') {
    throw createError({ statusCode: 422, statusMessage: 'Disziplinen nur bei LADV-Events' })
  }
  if (isDeadlineExpired(dbEvent.registrationDeadline)) {
    throw createError({ statusCode: 422, statusMessage: 'Meldefrist abgelaufen' })
  }

  let disciplineId: number
  try {
    const inserted = await db.insert(schema.registrationDisciplines).values({
      registrationId: id,
      discipline,
      ageClass,
      createdAt: new Date(),
    }).returning({ id: schema.registrationDisciplines.id })
    disciplineId = inserted[0]!.id
  }
  catch {
    // UNIQUE (registrationId, discipline) verletzt
    throw createError({ statusCode: 409, statusMessage: 'Disziplin bereits vorhanden' })
  }

  setResponseStatus(event, 201)
  return { id: disciplineId }
})
