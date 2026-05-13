import { z } from 'zod'
import { defineNotificationType } from './_define'
import { EVENT_TYPES, getEventTypeLabel } from '~~/shared/utils/registration'

export const eventCanceled = defineNotificationType({
  type: 'event_canceled',
  actor: 'required',
  meta: {
    label: 'Event abgesagt',
    description: 'Wenn ein Event abgesagt wird, für das du angemeldet bist.',
    adminOnly: false,
  },
  defaults: {
    email: { default: true, mandatory: true },
    push: { default: true, mandatory: false },
  },
  payload: z.object({
    eventName: z.string(),
    eventType: z.enum(EVENT_TYPES),
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),
    registrationDeadline: z.string().optional(),
    eventLink: z.string(),
  }),
  email: {
    component: 'EventCanceledEmail',
    subject: p => `Abgesagt: ${p.eventName}`,
  },
  push: p => ({
    title: `${getEventTypeLabel(p.eventType)} abgesagt`,
    body: `${p.eventName} wurde abgesagt.`,
    url: p.eventLink,
  }),
})
