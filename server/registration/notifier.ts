import type { Actor } from './actor'
import type { NotificationDecision } from './notifications'
import type { EventRow, UserRow } from './persistence'

export type NotifyContext = {
  dbEvent: EventRow
  targetUser: Pick<UserRow, 'id' | 'email' | 'firstName'>
  actor: Actor
}

export interface Notifier {
  dispatch(decisions: NotificationDecision[], ctx: NotifyContext): Promise<void>
}

export function createProductionNotifier(siteUrl: string): Notifier {
  return {
    async dispatch(decisions, ctx) {
      for (const decision of decisions) {
        try {
          await sendDecision(decision, ctx, siteUrl)
        }
        catch (err) {
          console.error(`[Notification] ${decision.type}:`, err)
        }
      }
    },
  }
}

// Lazy imports halten Notification-/Email-Module aus dem Test-Bundle raus
// (`useRuntimeConfig()` ist nur im Nitro-Runtime verfügbar).
async function sendDecision(
  decision: NotificationDecision,
  ctx: NotifyContext,
  siteUrl: string,
): Promise<void> {
  const { notify } = await import('~~/server/notifications/service')
  const { buildEventPayload, formatDisciplineLabels } = await import('~~/server/notifications/payload-helpers')

  const basePayload = buildEventPayload(ctx.dbEvent, siteUrl)
  const recipient = {
    userId: ctx.targetUser.id,
    email: ctx.targetUser.email,
    firstName: ctx.targetUser.firstName ?? undefined,
  }

  switch (decision.type) {
    case 'registration_confirmation':
      await notify({
        type: 'registration_confirmation',
        recipients: [recipient],
        payload: basePayload,
        eventId: ctx.dbEvent.id,
      })
      return

    case 'ladv_registered':
      await notify({
        type: 'ladv_registered',
        recipients: [recipient],
        actorUserId: ctx.actor.userId,
        payload: { ...basePayload, disciplines: formatDisciplineLabels(decision.disciplines) },
        eventId: ctx.dbEvent.id,
      })
      return

    case 'admin_registered_member':
      await notify({
        type: 'admin_registered_member',
        recipients: [recipient],
        actorUserId: ctx.actor.userId,
        payload: {
          ...basePayload,
          ...(decision.disciplines.length > 0
            ? { disciplines: formatDisciplineLabels(decision.disciplines) }
            : {}),
        },
        eventId: ctx.dbEvent.id,
      })
      return

    case 'athlete_canceled_after_ladv': {
      const { recipients } = await import('~~/server/notifications/recipients')
      await notify({
        type: 'athlete_canceled_after_ladv',
        recipients: await recipients.allAdmins(),
        actorUserId: ctx.actor.userId,
        payload: basePayload,
        eventId: ctx.dbEvent.id,
      })
      return
    }

    case 'admin_changed_member_registration': {
      const { recipients } = await import('~~/server/notifications/recipients')
      const memberRecipients = await recipients.user(decision.userId)
      if (memberRecipients.length === 0) return
      await notify({
        type: 'admin_changed_member_registration',
        recipients: memberRecipients,
        actorUserId: ctx.actor.userId,
        payload: basePayload,
        eventId: ctx.dbEvent.id,
      })
      return
    }

    case 'ladv_canceled':
      await notify({
        type: 'ladv_canceled',
        recipients: [recipient],
        actorUserId: ctx.actor.userId,
        payload: basePayload,
        eventId: ctx.dbEvent.id,
      })
      return

    case 'athlete_changed_after_ladv': {
      const { recipients } = await import('~~/server/notifications/recipients')
      await notify({
        type: 'athlete_changed_after_ladv',
        recipients: await recipients.allAdmins(),
        actorUserId: ctx.actor.userId,
        payload: basePayload,
        eventId: ctx.dbEvent.id,
      })
      return
    }
  }
}
