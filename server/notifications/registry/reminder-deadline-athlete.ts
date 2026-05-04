import { z } from 'zod'
import { defineNotificationType } from './_define'

export const reminderDeadlineAthlete = defineNotificationType({
  type: 'reminder_deadline_athlete',
  actor: 'none',
  meta: {
    label: 'Erinnerung: Meldefrist',
    description: '5 Tage vor Ablauf der Meldefrist für Events, für die du angemeldet bist.',
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
    component: 'ReminderDeadlineAthleteEmail',
    subject: p => `Meldeschluss: ${p.eventName}`,
  },
  push: p => ({
    title: 'Meldeschluss',
    body: `Meldeschluss für ${p.eventName} steht bevor.`,
    url: p.eventLink,
  }),
})
