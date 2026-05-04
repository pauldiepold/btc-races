import { z } from 'zod'
import { defineNotificationType } from './_define'

export const ladvCanceled = defineNotificationType({
  type: 'ladv_canceled',
  actor: 'required',
  meta: {
    label: 'LADV-Abmeldung',
    description: 'Wenn der Coach dich wieder aus LADV abgemeldet hat.',
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
    component: 'LadvCanceledEmail',
    subject: p => `LADV-Abmeldung: ${p.eventName}`,
  },
  push: (p, ctx) => ({
    title: 'LADV-Abmeldung',
    body: `${ctx.actor.name} hat deine Meldung für ${p.eventName} zurückgezogen.`,
    url: p.eventLink,
  }),
})
