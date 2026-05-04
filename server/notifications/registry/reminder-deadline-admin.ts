import { z } from 'zod'
import { defineNotificationType } from './_define'

const participantSchema = z.object({
  name: z.string(),
  disciplines: z.string().optional(),
})

export const reminderDeadlineAdmin = defineNotificationType({
  type: 'reminder_deadline_admin',
  actor: 'none',
  meta: {
    label: 'Admin: Meldefrist-Erinnerung',
    description: '3 Tage vor Ablauf der Meldefrist für alle aktiven Events.',
    adminOnly: true,
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
    participants: z.array(participantSchema),
  }),
  email: {
    component: 'ReminderDeadlineAdminEmail',
    subject: p => `Admin-Erinnerung Meldeschluss: ${p.eventName}`,
  },
  push: p => ({
    title: 'Admin-Erinnerung',
    body: `Meldeschluss für ${p.eventName} steht bevor.`,
    url: p.eventLink,
  }),
})
