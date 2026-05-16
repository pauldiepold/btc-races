import { db } from 'hub:db'
import { z } from 'zod'
import { parseBody } from '~~/server/utils/parse-body'
import { MANUAL_EVENT_TYPES } from '~~/shared/utils/registration'
import { actorFromSession, createManualEvent, EventError, errorToHttpStatus } from '~~/server/events'

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

  const actor = actorFromSession(session)

  try {
    const { id } = await createManualEvent(data, actor, { db })
    setResponseStatus(event, 201)
    return { id: encodeEventId(id) }
  }
  catch (err) {
    if (err instanceof EventError) {
      throw createError({ statusCode: errorToHttpStatus(err.code), statusMessage: err.message })
    }
    throw err
  }
})
