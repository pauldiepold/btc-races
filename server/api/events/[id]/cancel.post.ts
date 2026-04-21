import { db, schema } from 'hub:db'
import { and, eq, notInArray } from 'drizzle-orm'
import { notificationService } from '~~/server/notifications/service'
import { formatEventDate } from '~~/shared/utils/events'

export default defineEventHandler(async (event) => {
  const sqid = getRouterParam(event, 'id')
  if (!sqid) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const id = decodeEventId(sqid)
  if (id === null) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  await requireAdmin(event)

  const dbEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  })
  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  // Nur bei neuer Absage updaten + Notification feuern (idempotent)
  if (!dbEvent.cancelledAt) {
    await db
      .update(schema.events)
      .set({ cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.events.id, id))

    void sendEventCanceledNotification(id, dbEvent)
  }

  return { id: sqid }
})

async function sendEventCanceledNotification(
  eventId: number,
  dbEvent: typeof schema.events.$inferSelect,
) {
  try {
    // Alle aktiv angemeldeten Mitglieder (ohne Storno)
    const recipients = await db
      .select({
        userId: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .where(
        and(
          eq(schema.registrations.eventId, eventId),
          notInArray(schema.registrations.status, ['canceled', 'no']),
        ),
      )

    if (recipients.length === 0) return

    const siteUrl = useRuntimeConfig().public.siteUrl

    await notificationService.send({
      type: 'event_canceled',
      recipients: recipients.map(r => ({
        userId: r.userId,
        email: r.email,
        firstName: r.firstName ?? undefined,
      })),
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
