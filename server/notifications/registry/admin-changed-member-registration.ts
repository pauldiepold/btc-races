import { z } from 'zod'
import { defineNotificationType } from './_define'

export const adminChangedMemberRegistration = defineNotificationType({
  type: 'admin_changed_member_registration',
  actor: 'required',
  meta: {
    label: 'Admin hat meine Anmeldung geändert',
    description: 'Wenn ein Admin deine bestehende Anmeldung geändert hat.',
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
    component: 'AdminChangedMemberRegistrationEmail',
    subject: p => `Anmeldung geändert: ${p.eventName}`,
  },
  push: (p, ctx) => ({
    title: 'Anmeldung geändert',
    body: `${ctx.actor.name} hat deine Anmeldung für ${p.eventName} geändert.`,
    url: p.eventLink,
  }),
})
