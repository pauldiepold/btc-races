import { z } from 'zod'
import { defineNotificationType } from './_define'
import { EVENT_TYPES, getEventTypeLabel } from '~~/shared/utils/registration'

export const eventUncanceled = defineNotificationType({
  type: 'event_uncanceled',
  actor: 'required',
  meta: {
    label: 'Event reaktiviert',
    description: 'Wenn ein abgesagtes Event doch stattfindet und du angemeldet bist.',
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
    component: 'EventUncanceledEmail',
    subject: p => `Findet doch statt: ${p.eventName}`,
  },
  push: p => ({
    title: `${getEventTypeLabel(p.eventType)} reaktiviert`,
    body: `${p.eventName} findet doch statt.`,
    url: p.eventLink,
  }),
})
