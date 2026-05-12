import type { Actor } from './actor'
import type { NotificationDecision } from './notifications'
import type { AppDb, EventRow, UserRow } from './persistence'

export type DispatchContext = {
  dbEvent: EventRow
  targetUser: Pick<UserRow, 'id' | 'email' | 'firstName'>
  actor: Actor
  db: AppDb
}

/**
 * Übersetzt die im Anmelde-Modul gefällten Decision-Tupel in `notify()`-Aufrufe.
 *
 * Routing-Tabelle: jede Decision-Variante kennt ihre Recipients und ihren Payload.
 * `siteUrl` wird hier zentral aus dem Runtime-Config gelesen — Operationen und
 * API-Handler bleiben davon frei.
 */
export async function dispatchNotifications(
  decisions: NotificationDecision[],
  ctx: DispatchContext,
): Promise<void> {
  if (decisions.length === 0) return

  const { notify } = await import('~~/server/notifications/service')
  const { buildEventPayload, formatDisciplineLabels } = await import('~~/server/notifications/payload-helpers')
  const { recipients } = await import('~~/server/notifications/recipients')

  const siteUrl = useRuntimeConfig().public.siteUrl
  const basePayload = buildEventPayload(ctx.dbEvent, siteUrl)
  const targetRecipient = {
    userId: ctx.targetUser.id,
    email: ctx.targetUser.email,
    firstName: ctx.targetUser.firstName ?? undefined,
  }

  for (const decision of decisions) {
    try {
      switch (decision.type) {
        case 'registration_confirmation':
          await notify({
            type: 'registration_confirmation',
            recipients: [targetRecipient],
            payload: basePayload,
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break

        case 'ladv_registered':
          await notify({
            type: 'ladv_registered',
            recipients: [targetRecipient],
            actorUserId: ctx.actor.userId,
            payload: { ...basePayload, disciplines: formatDisciplineLabels(decision.disciplines) },
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break

        case 'admin_registered_member':
          await notify({
            type: 'admin_registered_member',
            recipients: [targetRecipient],
            actorUserId: ctx.actor.userId,
            payload: {
              ...basePayload,
              ...(decision.disciplines.length > 0
                ? { disciplines: formatDisciplineLabels(decision.disciplines) }
                : {}),
            },
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break

        case 'athlete_canceled_after_ladv':
          await notify({
            type: 'athlete_canceled_after_ladv',
            recipients: await recipients.allAdmins(ctx.db),
            actorUserId: ctx.actor.userId,
            payload: basePayload,
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break

        case 'admin_changed_member_registration': {
          const memberRecipients = await recipients.user(decision.userId, ctx.db)
          if (memberRecipients.length === 0) break
          await notify({
            type: 'admin_changed_member_registration',
            recipients: memberRecipients,
            actorUserId: ctx.actor.userId,
            payload: basePayload,
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break
        }

        case 'ladv_canceled':
          await notify({
            type: 'ladv_canceled',
            recipients: [targetRecipient],
            actorUserId: ctx.actor.userId,
            payload: basePayload,
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break

        case 'athlete_changed_after_ladv':
          await notify({
            type: 'athlete_changed_after_ladv',
            recipients: await recipients.allAdmins(ctx.db),
            actorUserId: ctx.actor.userId,
            payload: basePayload,
            eventId: ctx.dbEvent.id,
          }, ctx.db)
          break

        case 'admin_late_registration': {
          if (ctx.dbEvent.type !== 'ladv') break
          await notify({
            type: 'admin_late_registration',
            recipients: await recipients.allAdmins(ctx.db),
            actorUserId: ctx.actor.userId,
            payload: {
              ...basePayload,
              eventType: 'ladv',
              athleteName: decision.athleteName,
              action: decision.action,
              ...(decision.disciplines.length > 0
                ? { disciplines: formatDisciplineLabels(decision.disciplines) }
                : {}),
            },
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
