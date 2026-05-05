import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { notify } from '~~/server/notifications/service'
import { recipients } from '~~/server/notifications/recipients'
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
      const eventRecipients = await recipients.registeredFor(id, {
        statuses: ['registered', 'yes', 'maybe'],
      })

      if (eventRecipients.length > 0) {
        const siteUrl = useRuntimeConfig().public.siteUrl
        await notify({
          type: 'event_canceled',
          recipients: eventRecipients,
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
