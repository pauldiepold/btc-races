import { z } from 'zod'
import { defineNotificationType } from './_define'

export const reminderEvent = defineNotificationType({
  type: 'reminder_event',
  actor: 'none',
  meta: {
    label: 'Event-Erinnerung',
    description: '2 Tage vor Beginn eines Events, für das du angemeldet bist.',
    adminOnly: false,
  },
  defaults: {
    email: { default: true, mandatory: false },
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
    component: 'ReminderEventEmail',
    subject: p => `Erinnerung: ${p.eventName}`,
  },
  push: p => ({
    title: 'Erinnerung',
    body: `${p.eventName} findet bald statt.`,
    url: p.eventLink,
  }),
})
