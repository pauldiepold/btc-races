import { z } from 'zod'
import { defineNotificationType } from './_define'

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
    title: 'Veranstaltung abgesagt',
    body: `${p.eventName} wurde abgesagt.`,
    url: p.eventLink,
  }),
})
