import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import { getValidNextStatuses } from '~~/shared/utils/registration'

const bodySchema = z.object({
  status: z.enum(['registered', 'canceled', 'maybe', 'yes', 'no']).optional(),
  notes: z.string().nullable().optional(),
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

  const { status, notes } = result.data

  const registration = await db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: 'Anmeldung nicht gefunden' })
  }

  // Nur eigene Anmeldung
  if (registration.userId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung' })
  }

  if (status !== undefined) {
    const dbEvent = await db.query.events.findFirst({
      where: eq(schema.events.id, registration.eventId),
    })
    if (!dbEvent) {
      throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
    }

    const validNext = getValidNextStatuses(registration.status, dbEvent.type)
    if (!validNext.includes(status)) {
      throw createError({ statusCode: 422, statusMessage: `Statusübergang von '${registration.status}' zu '${status}' nicht erlaubt` })
    }

    // Deadline-Check — außer bei cancel/no (Storno immer möglich)
    const isCancelAction = status === 'canceled' || status === 'no'
    if (!isCancelAction && (dbEvent.type === 'ladv' || dbEvent.type === 'competition')) {
      if (isDeadlineExpired(dbEvent.registrationDeadline)) {
        throw createError({ statusCode: 422, statusMessage: 'Meldefrist abgelaufen' })
      }
    }

    // E-Mail-Stub bei Stornierung
    if (status === 'canceled' || status === 'no') {
      console.log(`[E-02] Stornierung-Bestätigung → ${session.user.email}: "${dbEvent.name}"`)
    }
  }

  await db
    .update(schema.registrations)
    .set({
      ...(status !== undefined ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.registrations.id, id))

  return { id }
})
