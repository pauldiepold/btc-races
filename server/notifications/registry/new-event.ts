import { z } from 'zod'
import { defineNotificationType } from './_define'

export const newEvent = defineNotificationType({
  type: 'new_event',
  actor: 'required',
  meta: {
    label: 'Neues Event',
    description: 'Wenn ein neuer Wettkampf veröffentlicht wird.',
    adminOnly: false,
  },
  defaults: {
    email: { default: false, mandatory: false },
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
    component: 'NewEventEmail',
    subject: p => `Neue Veranstaltung: ${p.eventName}`,
  },
  push: p => ({
    title: 'Neue Veranstaltung',
    body: `${p.eventName} wurde veröffentlicht.`,
    url: p.eventLink,
  }),
})
