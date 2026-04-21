import { db, schema } from 'hub:db'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'
import { notificationService } from '~~/server/notifications/service'
import { formatEventDate } from '~~/shared/utils/events'

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

  const updated = await db
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
    .returning({ id: schema.registrationDisciplines.id })

  // Nur Notification feuern, wenn tatsächlich mindestens eine Disziplin neu abgemeldet wurde
  if (updated.length > 0) {
    void sendLadvCanceledNotification(registration.userId, registration.eventId)
  }

  return { id }
})

async function sendLadvCanceledNotification(userId: number, eventId: number) {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { id: true, email: true, firstName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])

    if (!user || !dbEvent) return

    const siteUrl = useRuntimeConfig().public.siteUrl

    await notificationService.send({
      type: 'ladv_canceled',
      recipients: [{
        userId: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
      }],
      payload: {
        eventName: dbEvent.name,
        eventDate: formatEventDate(dbEvent.date) ?? undefined,
        eventLocation: dbEvent.location ?? undefined,
        registrationDeadline: formatEventDate(dbEvent.registrationDeadline) ?? undefined,
        eventLink: `${siteUrl}/${encodeEventId(eventId)}`,
      },
      eventId,
    })
  }
  catch (err) {
    console.error('[Notification] Fehler beim Erstellen des Jobs:', err)
  }
}
