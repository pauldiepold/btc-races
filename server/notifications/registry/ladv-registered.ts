import { z } from 'zod'
import { defineNotificationType } from './_define'

export const ladvRegistered = defineNotificationType({
  type: 'ladv_registered',
  actor: 'required',
  meta: {
    label: 'LADV-Meldung bestätigt',
    description: 'Wenn der Coach dich für einen Wettkampf in LADV gemeldet hat.',
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
    disciplines: z.array(z.string()),
  }),
  email: {
    component: 'LadvRegisteredEmail',
    subject: p => `LADV-Meldung: ${p.eventName}`,
  },
  push: (p, ctx) => ({
    title: 'LADV-Meldung',
    body: `${ctx.actor.name} hat dich für ${p.eventName} gemeldet.`,
    url: p.eventLink,
  }),
})
