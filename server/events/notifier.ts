import type { EventNotificationDecision } from './notifications'
import type { AppDb, EventRow } from './persistence'

export type DispatchContext = {
  eventBefore: Pick<EventRow, 'date' | 'startTime' | 'location'>
  eventAfter: Pick<EventRow, 'id' | 'name' | 'type' | 'date' | 'startTime' | 'location' | 'cancelledAt'>
  actorUserId?: number
  db: AppDb
}

export async function dispatchEventNotifications(
  decisions: EventNotificationDecision[],
  ctx: DispatchContext,
): Promise<void> {
  if (decisions.length === 0) return

  const { notifyEventChanged } = await import('~~/server/notifications/event-changed')

  for (const decision of decisions) {
    try {
      switch (decision.type) {
        case 'event_changed':
          await notifyEventChanged(ctx.eventBefore, ctx.eventAfter, ctx.actorUserId, ctx.db)
          break
      }
    }
    catch (err) {
      console.error(`[Notification] ${decision.type}:`, err)
    }
  }
}
