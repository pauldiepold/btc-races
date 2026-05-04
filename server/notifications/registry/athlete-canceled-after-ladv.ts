import { z } from 'zod'
import { defineNotificationType } from './_define'

export const athleteCanceledAfterLadv = defineNotificationType({
  type: 'athlete_canceled_after_ladv',
  actor: 'required',
  meta: {
    label: 'Anmeldung storniert nach LADV-Meldung',
    description: 'Wenn ein Mitglied seine Anmeldung storniert, nachdem der Coach bereits in LADV gemeldet hat.',
    adminOnly: true,
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
    component: 'AthleteCanceledAfterLadvEmail',
    subject: p => `Stornierung nach LADV-Meldung: ${p.eventName}`,
  },
  push: (p, ctx) => ({
    title: 'LADV-Abmeldung nötig',
    body: `${ctx.actor.name} hat die Anmeldung für ${p.eventName} storniert.`,
    url: p.eventLink,
  }),
})
