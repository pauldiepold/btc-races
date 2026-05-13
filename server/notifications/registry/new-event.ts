import { z } from 'zod'
import { defineNotificationType } from './_define'
import { EVENT_TYPES, getNewEventLabel } from '~~/shared/utils/registration'

export const newEvent = defineNotificationType({
  type: 'new_event',
  actor: 'required',
  meta: {
    label: 'Neues Event',
    description: 'Wenn ein neuer Wettkampf veröffentlicht wird.',
    adminOnly: false,
  },
  defaults: {
    email: { default: false, mandatory: false },
    push: { default: true, mandatory: false },
  },
  payload: z.object({
    eventName: z.string(),
    eventType: z.enum(EVENT_TYPES),
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),
    registrationDeadline: z.string().optional(),
    eventLink: z.string(),
  }),
  email: {
    component: 'NewEventEmail',
    subject: p => `${getNewEventLabel(p.eventType)}: ${p.eventName}`,
  },
  push: p => ({
    title: getNewEventLabel(p.eventType),
    body: `${p.eventName} wurde veröffentlicht.`,
    url: p.eventLink,
  }),
})
