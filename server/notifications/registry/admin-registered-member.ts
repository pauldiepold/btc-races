import { z } from 'zod'
import { defineNotificationType } from './_define'

export const adminRegisteredMember = defineNotificationType({
  type: 'admin_registered_member',
  actor: 'required',
  meta: {
    label: 'Admin hat mich angemeldet',
    description: 'Wenn ein Admin dich für einen Wettkampf angemeldet hat.',
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
    disciplines: z.array(z.string()).optional(),
  }),
  email: {
    component: 'AdminRegisteredMemberEmail',
    subject: p => `Anmeldung: ${p.eventName}`,
  },
  push: (p, ctx) => ({
    title: 'Anmeldung',
    body: `${ctx.actor.name} hat dich für ${p.eventName} angemeldet.`,
    url: p.eventLink,
  }),
})
