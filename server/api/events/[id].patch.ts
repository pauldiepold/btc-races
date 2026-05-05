import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { notifyEventChanged } from '~~/server/notifications/event-changed'
import { toEventCoreSnapshot } from '~~/shared/utils/diff-event-core-fields'

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
  const sqid = getRouterParam(event, 'id')
  if (!sqid) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const id = decodeEventId(sqid)
  if (id === null) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  const dbEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  })
  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  const session = await requireUserSession(event)
  await requireOwnerOrAdmin(event, dbEvent.createdBy ?? 0)

  const body = await readBody(event)
  const result = patchEventSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Validierungsfehler' })
  }

  const data = result.data
  const updates: Partial<typeof schema.events.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (data.name !== undefined) updates.name = data.name
  if ('date' in data) updates.date = data.date ?? null
  if ('startTime' in data) updates.startTime = data.startTime ?? null
  if ('duration' in data) updates.duration = data.duration ?? null
  if ('location' in data) updates.location = data.location ?? null
  if ('description' in data) updates.description = data.description ?? null
  if ('registrationDeadline' in data) updates.registrationDeadline = data.registrationDeadline ?? null
  if ('announcementLink' in data) updates.announcementLink = data.announcementLink ?? null
  if ('raceType' in data) updates.raceType = data.raceType ?? null
  if ('championshipType' in data) updates.championshipType = data.championshipType ?? null

  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'
  const isCompetitionOrLadv = dbEvent.type === 'competition' || dbEvent.type === 'ladv'
  if ('priority' in data && isAdmin && isCompetitionOrLadv) updates.priority = data.priority ?? null

  await db.update(schema.events).set(updates).where(eq(schema.events.id, id))

  const isSuperuser = session.user.role === 'superuser'
  const coreBodyKeys = 'date' in data || 'startTime' in data || 'location' in data
  if (coreBodyKeys && !(isSuperuser && data.suppressNotification)) {
    const updated = await db.query.events.findFirst({
      where: eq(schema.events.id, id),
    })
    if (updated) {
      try {
        await notifyEventChanged(
          toEventCoreSnapshot(dbEvent),
          toEventCoreSnapshot(updated),
          updated,
          session.user.id,
        )
      }
      catch (err) {
        console.error('[Notification] event_changed:', err)
      }
    }
  }

  return { id: sqid }
})
