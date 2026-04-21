import { db, schema } from 'hub:db'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import { getValidNextStatuses } from '~~/shared/utils/registration'
import { notificationService } from '~~/server/notifications/service'
import { formatEventDate } from '~~/shared/utils/events'

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

  let shouldNotifyAdminsLadvCancel = false

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

    // N-03: Stornierung nach bereits erfolgter LADV-Meldung → Admins informieren
    if (isCancelAction) {
      const activeLadv = await db.query.registrationDisciplines.findFirst({
        where: and(
          eq(schema.registrationDisciplines.registrationId, id),
          isNotNull(schema.registrationDisciplines.ladvRegisteredAt),
          isNull(schema.registrationDisciplines.ladvCanceledAt),
        ),
        columns: { id: true },
      })
      shouldNotifyAdminsLadvCancel = !!activeLadv
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

  if (shouldNotifyAdminsLadvCancel) {
    void sendAthleteCanceledAfterLadvNotification(registration.userId, registration.eventId)
  }

  return { id }
})

async function sendAthleteCanceledAfterLadvNotification(userId: number, eventId: number) {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { firstName: true, lastName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])

    if (!user || !dbEvent) return

    const siteUrl = useRuntimeConfig().public.siteUrl

    await notificationService.send({
      type: 'athlete_canceled_after_ladv',
      recipients: 'all_admins',
      payload: {
        eventName: dbEvent.name,
        eventDate: formatEventDate(dbEvent.date) ?? undefined,
        eventLocation: dbEvent.location ?? undefined,
        registrationDeadline: formatEventDate(dbEvent.registrationDeadline) ?? undefined,
        eventLink: `${siteUrl}/${encodeEventId(eventId)}`,
        memberFirstName: user.firstName ?? '',
        memberLastName: user.lastName ?? '',
        athleteName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      },
      eventId,
    })
  }
  catch (err) {
    console.error('[Notification] Fehler beim Erstellen des Jobs:', err)
  }
}
