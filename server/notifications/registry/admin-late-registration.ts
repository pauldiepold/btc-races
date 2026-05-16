import { z } from 'zod'
import { defineNotificationType } from './_define'

export const adminLateRegistration = defineNotificationType({
  type: 'admin_late_registration',
  actor: 'optional',
  meta: {
    label: 'Admin: Späte LADV-Anmeldung',
    description: 'Wenn sich jemand kurz vor Meldeschluss zu einem LADV-Event anmeldet.',
    adminOnly: true,
  },
  defaults: {
    email: { default: true, mandatory: false },
    push: { default: true, mandatory: false },
  },
  payload: z.object({
    eventName: z.string(),
    eventType: z.literal('ladv'),
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),
    registrationDeadline: z.string().optional(),
    eventLink: z.string(),
    athleteName: z.string(),
    action: z.enum(['registered', 'reactivated']),
    disciplines: z.array(z.string()).optional(),
  }),
  email: {
    component: 'AdminLateRegistrationEmail',
    subject: p => `Späte Anmeldung: ${p.athleteName} – ${p.eventName}`,
  },
  push: p => ({
    title: 'Späte Anmeldung',
    body: p.action === 'reactivated'
      ? `${p.athleteName} hat seine Anmeldung zu ${p.eventName} reaktiviert.`
      : `${p.athleteName} hat sich kurzfristig zu ${p.eventName} angemeldet.`,
    url: p.eventLink,
  }),
})
