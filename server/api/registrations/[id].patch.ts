import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import { getValidNextStatuses } from '~~/shared/utils/registration'
import {
  triggerAdminChangedRegistrationNotification,
  triggerAthleteCanceledAfterLadvNotification,
} from '~~/server/notifications/triggers'
import { formatActorName } from '~~/shared/utils/format-actor-name'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'

const bodySchema = z.object({
  status: z.enum(['registered', 'canceled', 'maybe', 'yes', 'no']).optional(),
  notes: z.string().nullable().optional(),
  silent: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'
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

  const { status, notes, silent } = result.data

  const registration = await db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: 'Anmeldung nicht gefunden' })
  }

  // Nur eigene Anmeldung — außer für Admins
  if (!isAdmin && registration.userId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung' })
  }

  let shouldNotifyAdmins = false
  let shouldNotifyMember = false

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

    const isCancelAction = status === 'canceled' || status === 'no'

    // Deadline-Check — außer bei cancel/no und außer für Admins
    if (!isAdmin && !isCancelAction && (dbEvent.type === 'ladv' || dbEvent.type === 'competition')) {
      if (isDeadlineExpired(dbEvent.registrationDeadline)) {
        throw createError({ statusCode: 422, statusMessage: 'Meldefrist abgelaufen' })
      }
    }

    // Stornierung durch Athlet nach bereits erfolgter LADV-Meldung → Admins informieren
    if (registration.userId === session.user.id && isCancelAction) {
      const ladvDisciplines = registration.ladvDisciplines as RegistrationDisciplinePair[] | null
      shouldNotifyAdmins = ladvDisciplines !== null
    }
  }

  // Admin ändert fremde Anmeldung → Mitglied informieren
  // (außer der Aufrufer signalisiert, dass eine spezifischere Notification bereits gesendet wurde)
  if (isAdmin && registration.userId !== session.user.id && !silent) {
    shouldNotifyMember = true
  }

  await db
    .update(schema.registrations)
    .set({
      ...(status !== undefined ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.registrations.id, id))

  if (shouldNotifyAdmins) {
    await triggerAthleteCanceledAfterLadvNotification(registration.userId, registration.eventId)
  }

  if (shouldNotifyMember) {
    await triggerAdminChangedRegistrationNotification(registration.userId, registration.eventId, formatActorName(session.user.firstName, session.user.lastName))
  }

  return { id }
})
