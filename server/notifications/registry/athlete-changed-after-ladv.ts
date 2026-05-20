import { z } from 'zod'
import { EVENT_TYPES } from '~~/shared/utils/registration'
import { defineNotificationType } from './_define'

export const athleteChangedAfterLadv = defineNotificationType({
  type: 'athlete_changed_after_ladv',
  actor: 'required',
  meta: {
    label: 'Wunschstand geändert nach LADV-Meldung',
    description: 'Wenn ein Mitglied seinen Wunschstand ändert, nachdem der Coach bereits in LADV gemeldet hat.',
    adminOnly: true,
  },
  defaults: {
    email: { default: true, mandatory: true },
    push: { default: true, mandatory: false },
  },
  payload: z.object({
    eventName: z.string(),
    eventType: z.enum(EVENT_TYPES),
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),
    registrationDeadline: z.string().optional(),
    eventLink: z.string(),
    wishDisciplines: z.array(z.string()),
    ladvDisciplines: z.array(z.string()),
  }),
  email: {
    component: 'AthleteChangedAfterLadvEmail',
    subject: p => `Wunschstand geändert: ${p.eventName}`,
  },
  push: (p, ctx) => ({
    title: 'Wunschstand geändert',
    body: `${ctx.actor.name} hat seinen Wunschstand für ${p.eventName} geändert.`,
    url: p.eventLink,
  }),
})
