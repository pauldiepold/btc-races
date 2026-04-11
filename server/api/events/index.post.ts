import { db, schema } from 'hub:db'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

const createEventSchema = z.object({
  type: z.enum(['competition', 'training', 'social']),
  name: z.string().min(1, 'Name ist erforderlich'),
  date: z.string().date().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültiges Format, erwartet HH:MM').optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  registrationDeadline: z.string().date().optional().nullable(),
  announcementLink: z.string().url('Ungültige URL').optional().nullable(),
  raceType: z.enum(['track', 'road']).optional().nullable(),
  championshipType: z.enum(['none', 'bbm', 'ndm', 'dm']).optional().nullable(),
  priority: z.enum(['A', 'B', 'C']).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)
  const result = createEventSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Validierungsfehler' })
  }

  const data = result.data
  const now = new Date()
  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'

  const newEvent = {
    id: randomUUID(),
    type: data.type,
    name: data.name,
    date: data.date ?? null,
    startTime: data.startTime ?? null,
    duration: data.duration ?? null,
    location: data.location ?? null,
    description: data.description ?? null,
    registrationDeadline: data.registrationDeadline ?? null,
    announcementLink: data.announcementLink ?? null,
    raceType: data.raceType ?? null,
    championshipType: data.championshipType ?? null,
    priority: (isAdmin && data.type === 'competition') ? (data.priority ?? null) : null,
    createdBy: session.user.id,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(schema.events).values(newEvent)

  setResponseStatus(event, 201)
  return { id: newEvent.id }
})
