import { db } from 'hub:db'
import { z } from 'zod'
import { requireOwnerOrAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { parseBody } from '~~/server/utils/parse-body'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { applyEventPatch, EventError, errorToHttpStatus, type EventActor } from '~~/server/events'

const patchEventSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').optional(),
  date: z.string().date().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Format, erwartet HH:MM').optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  registrationDeadline: z.string().date().optional().nullable(),
  announcementLink: z.string().url('Ungültige URL').optional().nullable(),
  raceType: z.enum(['track', 'road', 'trail']).optional().nullable(),
  championshipType: z.enum(['none', 'bbm', 'ndm', 'dm']).optional().nullable(),
  priority: z.enum(['A', 'B', 'C']).optional().nullable(),
  suppressNotification: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const id = requireEventIdParam(event)
  const dbEvent = await loadEventOrThrow(id)
  const session = await requireOwnerOrAdmin(event, dbEvent.createdBy ?? 0)

  const data = await parseBody(event, patchEventSchema)
  const { suppressNotification, ...patch } = data

  const isAdminRole = session.user.role === 'admin' || session.user.role === 'superuser'
  const isSuperuser = session.user.role === 'superuser'

  const actor: EventActor = isAdminRole
    ? { kind: 'admin', userId: session.user.id, isSuperuser }
    : { kind: 'owner', userId: session.user.id }

  const silent = isSuperuser && suppressNotification === true

  try {
    await applyEventPatch(id, patch, actor, { db }, { silent })
  }
  catch (err) {
    if (err instanceof EventError) {
      throw createError({ statusCode: errorToHttpStatus(err.code), statusMessage: err.message })
    }
    throw err
  }

  return { id: encodeEventId(id) }
})
