import type { z } from 'zod'
import type { NotificationChannelDefaults, NotificationType } from '~~/shared/types/notifications'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodType = z.ZodType<any>

/**
 * Public-Sicht des Actors für Subject-/Push-/Template-Builder.
 * Wird beim Send aus `notificationJobs.actorUserId` aufgelöst.
 */
export interface NotificationActor {
  userId: number
  name: string
}

export type ActorRequirement = 'required' | 'optional' | 'none'

export type NotificationContext<A extends ActorRequirement>
  = A extends 'required' ? { actor: NotificationActor }
    : A extends 'optional' ? { actor?: NotificationActor }
      : { actor?: undefined }

export interface NotificationMeta {
  label: string
  description: string
  adminOnly: boolean
}

export interface PushNotificationPayload {
  title: string
  body: string
  url?: string
}

export interface NotificationDefinition<
  TType extends NotificationType = NotificationType,
  TPayload = unknown,
  TActor extends ActorRequirement = ActorRequirement,
> {
  type: TType
  actor: TActor
  meta: NotificationMeta
  defaults: {
    email: NotificationChannelDefaults
    push: NotificationChannelDefaults
  }
  payload: z.ZodType<TPayload>
  email: {
    component: string
    subject: (payload: TPayload, ctx: NotificationContext<TActor>) => string
  }
  push: (payload: TPayload, ctx: NotificationContext<TActor>) => PushNotificationPayload
}

export function defineNotificationType<
  TType extends NotificationType,
  TPayload,
  TActor extends ActorRequirement,
>(def: NotificationDefinition<TType, TPayload, TActor>): NotificationDefinition<TType, TPayload, TActor> {
  return def
}

/**
 * Loose Variante des Definitions-Typs. Wird vom Registry-`satisfies`-Constraint
 * benutzt, ohne die Per-Typ-Spezifität (Payload-Schema, actor-Modus) wegzuwerfen.
 */
export interface AnyNotificationDefinition {
  type: NotificationType
  actor: ActorRequirement
  meta: NotificationMeta
  defaults: {
    email: NotificationChannelDefaults
    push: NotificationChannelDefaults
  }
  payload: AnyZodType
  email: {
    component: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subject: (payload: any, ctx: any) => string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  push: (payload: any, ctx: any) => PushNotificationPayload
}
