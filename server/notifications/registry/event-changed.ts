import { z } from 'zod'
import { defineNotificationType } from './_define'
import { EVENT_TYPES, getEventTypeLabel } from '~~/shared/utils/registration'

const changeSchema = z.object({
  field: z.enum(['date', 'startTime', 'location']),
  before: z.string().nullable(),
  after: z.string().nullable(),
  label: z.string(),
})

export const eventChanged = defineNotificationType({
  type: 'event_changed',
  actor: 'optional',
  meta: {
    label: 'Event geändert',
    description: 'Wenn sich Datum, Uhrzeit oder Ort eines Events ändern, für das du angemeldet bist.',
    adminOnly: false,
  },
  defaults: {
    email: { default: true, mandatory: false },
    push: { default: true, mandatory: false },
  },
  payload: z.object({
    eventName: z.string(),
    eventType: z.enum(EVENT_TYPES),
    eventLink: z.string(),
    changes: z.array(changeSchema),
  }),
  email: {
    component: 'EventChangedEmail',
    subject: p => `Änderung: ${p.eventName}`,
  },
  push: p => ({
    title: `${getEventTypeLabel(p.eventType)} geändert`,
    body: `${p.eventName} wurde geändert.`,
    url: p.eventLink,
  }),
})
