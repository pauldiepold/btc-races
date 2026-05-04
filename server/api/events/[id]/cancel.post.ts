import { db, schema } from 'hub:db'
import { and, eq, notInArray } from 'drizzle-orm'
import { notify } from '~~/server/notifications/service'
import { buildEventPayload } from '~~/server/notifications/payload-helpers'

export default defineEventHandler(async (event) => {
  const sqid = getRouterParam(event, 'id')
  if (!sqid) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const id = decodeEventId(sqid)
  if (id === null) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  const adminSession = await requireAdmin(event)

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

    try {
      const recipientRows = await db
        .select({
          userId: schema.users.id,
          email: schema.users.email,
          firstName: schema.users.firstName,
        })
        .from(schema.registrations)
        .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
        .where(
          and(
            eq(schema.registrations.eventId, id),
            notInArray(schema.registrations.status, ['canceled', 'no']),
          ),
        )

      if (recipientRows.length > 0) {
        const siteUrl = useRuntimeConfig().public.siteUrl
        await notify({
          type: 'event_canceled',
          recipients: recipientRows.map(r => ({
            userId: r.userId,
            email: r.email,
            firstName: r.firstName ?? undefined,
          })),
          actorUserId: adminSession.user.id,
          payload: buildEventPayload(dbEvent, siteUrl),
          eventId: id,
        })
      }
    }
    catch (err) {
      console.error('[Notification] event_canceled:', err)
    }
  }

  return { id: sqid }
})
