import { db } from 'hub:db'
import { z } from 'zod'
import { requireOwnerOrAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { parseBody } from '~~/server/utils/parse-body'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { actorFromSession, applyEventPatch, withEventErrorMapping } from '~~/server/events'

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

  const actor = actorFromSession(session)
  const silent = session.user.role === 'superuser' && suppressNotification === true

  await withEventErrorMapping(() => applyEventPatch(id, patch, actor, { db }, { silent }))

  return { id: encodeEventId(id) }
})
