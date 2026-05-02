import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import { getInitialStatus } from '~~/shared/utils/registration'
import { triggerRegistrationConfirmationNotification } from '~~/server/notifications/triggers'

const bodySchema = z.object({
  notes: z.string().optional(),
  disciplines: z.array(z.object({
    discipline: z.string(),
    ageClass: z.string(),
  })).optional(),
  status: z.enum(['registered', 'maybe', 'yes', 'no']).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const sqid = getRouterParam(event, 'id')

  if (!sqid) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const id = decodeEventId(sqid)
  if (id === null) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  const body = await readBody(event)
  const result = bodySchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Validierungsfehler' })
  }

  const { notes, disciplines, status: requestedStatus } = result.data

  // 1. Event laden
  const dbEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  })
  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  // 2. Event abgesagt
  if (dbEvent.cancelledAt) {
    throw createError({ statusCode: 422, statusMessage: 'Event ist abgesagt' })
  }

  // 3. Deadline abgelaufen (ladv/competition)
  if (dbEvent.type === 'ladv' || dbEvent.type === 'competition') {
    if (isDeadlineExpired(dbEvent.registrationDeadline)) {
      throw createError({ statusCode: 422, statusMessage: 'Meldefrist abgelaufen' })
    }
  }

  // 4. Bereits angemeldet (nicht canceled)
  const existing = await db.query.registrations.findFirst({
    where: and(
      eq(schema.registrations.eventId, id),
      eq(schema.registrations.userId, session.user.id),
    ),
  })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Bereits angemeldet' })
  }

  // 5. LADV: Startpass-Check
  if (dbEvent.type === 'ladv' && !session.user.hasLadvStartpass) {
    throw createError({ statusCode: 403, statusMessage: 'Kein LADV-Startpass' })
  }

  // 6. LADV: Mindestens eine Disziplin erforderlich
  if (dbEvent.type === 'ladv' && (!disciplines || disciplines.length === 0)) {
    throw createError({ statusCode: 422, statusMessage: 'Mindestens eine Disziplin erforderlich' })
  }

  const now = new Date()

  // Initialen Status bestimmen: angefordert (falls erlaubt) oder Fallback
  const validInitial: Record<string, string[]> = {
    ladv: ['registered'],
    competition: ['registered', 'maybe'],
    training: ['yes', 'maybe', 'no'],
    social: ['yes', 'maybe', 'no'],
  }
  const initialStatus = (requestedStatus && validInitial[dbEvent.type]?.includes(requestedStatus))
    ? requestedStatus
    : getInitialStatus(dbEvent.type)

  const wishDisciplines = (dbEvent.type === 'ladv' && disciplines && disciplines.length > 0)
    ? disciplines
    : []

  const insertedReg = await db.insert(schema.registrations).values({
    eventId: id,
    userId: session.user.id,
    status: initialStatus,
    notes: notes ?? null,
    wishDisciplines,
    createdAt: now,
    updatedAt: now,
  }).returning({ id: schema.registrations.id })

  if (dbEvent.type === 'ladv') {
    await triggerRegistrationConfirmationNotification(session.user.id, dbEvent.id)
  }

  setResponseStatus(event, 201)
  return { id: insertedReg[0]!.id }
})
