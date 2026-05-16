import type { EventNotificationDecision } from './notifications'
import type { AppDb, EventRow } from './persistence'

export type DispatchContext = {
  dbEvent: EventRow
  eventBefore?: Pick<EventRow, 'date' | 'startTime' | 'location'>
  actorUserId?: number
  db: AppDb
}

export async function dispatchEventNotifications(
  decisions: EventNotificationDecision[],
  ctx: DispatchContext,
): Promise<void> {
  if (decisions.length === 0) return

  const { notify } = await import('~~/server/notifications/service')
  const { buildEventPayload } = await import('~~/server/notifications/payload-helpers')
  const { recipients } = await import('~~/server/notifications/recipients')

  const siteUrl = useRuntimeConfig().public.siteUrl

  for (const decision of decisions) {
    try {
      switch (decision.type) {
        case 'event_changed': {
          if (!ctx.eventBefore) break
          const { notifyEventChanged } = await import('~~/server/notifications/event-changed')
          await notifyEventChanged(ctx.eventBefore, ctx.dbEvent, ctx.actorUserId, ctx.db)
          break
        }

        case 'new_event': {
          if (ctx.actorUserId == null) {
            throw new Error('new_event notification requires actorUserId')
          }
          await notify({
            type: 'new_event',
            recipients: await recipients.allMembers(ctx.db),
            actorUserId: ctx.actorUserId,
            payload: buildEventPayload(ctx.dbEvent, siteUrl),
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break
        }

        case 'event_canceled': {
          const eventRecipients = await recipients.registeredFor(
            ctx.dbEvent.id,
            { statuses: ['registered', 'yes', 'maybe'] },
            ctx.db,
          )
          if (eventRecipients.length === 0) break
          await notify({
            type: 'event_canceled',
            recipients: eventRecipients,
            actorUserId: ctx.actorUserId,
            payload: buildEventPayload(ctx.dbEvent, siteUrl),
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break
        }
      }
    }
    catch (err) {
      console.error(`[Notification] ${decision.type}:`, err)
    }
  }
}
