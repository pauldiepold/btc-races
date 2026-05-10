import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { notify } from '~~/server/notifications/service'
import { recipients } from '~~/server/notifications/recipients'
import { buildEventPayload } from '~~/server/notifications/payload-helpers'

export default defineEventHandler(async (event) => {
  const adminSession = await requireAdmin(event)
  const id = requireEventIdParam(event)
  const dbEvent = await loadEventOrThrow(id)

  if (dbEvent.cancelledAt) {
    return { id: encodeEventId(id) }
  }

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

  return { id: encodeEventId(id) }
})
