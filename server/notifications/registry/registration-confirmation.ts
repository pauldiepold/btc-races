import { z } from 'zod'
import { defineNotificationType } from './_define'

export const registrationConfirmation = defineNotificationType({
  type: 'registration_confirmation',
  actor: 'none',
  meta: {
    label: 'Anmeldebestätigung',
    description: 'Wenn du dich erfolgreich für einen LADV-Wettkampf angemeldet hast.',
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
    component: 'RegistrationConfirmationEmail',
    subject: p => `Anmeldebestätigung: ${p.eventName}`,
  },
  push: p => ({
    title: 'Anmeldebestätigung',
    body: `Du bist für ${p.eventName} angemeldet.`,
    url: p.eventLink,
  }),
})
