import { db, schema } from 'hub:db'
import { z } from 'zod'
import { notify } from '~~/server/notifications/service'
import { recipients } from '~~/server/notifications/recipients'
import { buildEventPayload } from '~~/server/notifications/payload-helpers'
import { parseBody } from '~~/server/utils/parse-body'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'
import { MANUAL_EVENT_TYPES } from '~~/shared/utils/registration'

const createEventSchema = z.object({
  type: z.enum(MANUAL_EVENT_TYPES),
  name: z.string().min(1, 'Name ist erforderlich'),
  date: z.string().date('Ungültiges Datumsformat'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Format, erwartet HH:MM').optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  registrationDeadline: z.string().date().optional().nullable(),
  announcementLink: z.string().url('Ungültige URL').optional().nullable(),
  raceType: z.enum(['track', 'road', 'trail']).optional().nullable(),
  championshipType: z.enum(['none', 'bbm', 'ndm', 'dm']).optional().nullable(),
  priority: z.enum(['A', 'B', 'C']).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const data = await parseBody(event, createEventSchema)

  const now = new Date()
  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'

  const inserted = await db.insert(schema.events).values({
    type: data.type,
    name: data.name,
    date: data.date,
    startTime: data.startTime ?? null,
    duration: data.duration ?? null,
    location: data.location ?? null,
    description: data.description ?? null,
    registrationDeadline: data.registrationDeadline ?? null,
    announcementLink: data.announcementLink ?? null,
    raceType: data.raceType ?? null,
    championshipType: data.championshipType ?? null,
    priority: (isAdmin && eventTypeCapabilities[data.type].hasCompetitionMetadata) ? (data.priority ?? null) : null,
    createdBy: session.user.id,
    createdAt: now,
    updatedAt: now,
  }).returning({ id: schema.events.id })

  const newId = inserted[0]!.id

  try {
    const siteUrl = useRuntimeConfig().public.siteUrl
    await notify({
      type: 'new_event',
      recipients: await recipients.allMembers(),
      actorUserId: session.user.id,
      payload: buildEventPayload({
        id: newId,
        type: data.type,
        name: data.name,
        date: data.date,
        location: data.location ?? null,
        registrationDeadline: data.registrationDeadline ?? null,
      }, siteUrl),
      eventId: newId,
    })
  }
  catch (err) {
    console.error('[Notification] new_event:', err)
  }

  setResponseStatus(event, 201)
  return { id: encodeEventId(newId) }
})
