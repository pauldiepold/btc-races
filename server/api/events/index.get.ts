import { db, schema } from 'hub:db'
import { and, asc, desc, eq, gte, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  type: z.enum(['ladv', 'competition', 'training', 'social']).optional(),
  timeRange: z.enum(['upcoming', 'past', 'all']).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const query = getQuery(event)
  const params = querySchema.safeParse(query)
  if (!params.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Query-Parameter' })
  }

  const { type, timeRange = 'upcoming' } = params.data
  const now = new Date()

  const conditions = []

  if (type) {
    conditions.push(eq(schema.events.type, type))
  }

  if (timeRange === 'past') {
    conditions.push(and(isNotNull(schema.events.date), lt(schema.events.date, now)))
  }
  else if (timeRange === 'upcoming') {
    conditions.push(or(isNull(schema.events.date), gte(schema.events.date, now)))
  }

  const userId = session.user.id

  const events = await db
    .select({
      id: schema.events.id,
      type: schema.events.type,
      name: schema.events.name,
      date: schema.events.date,
      location: schema.events.location,
      description: schema.events.description,
      registrationDeadline: schema.events.registrationDeadline,
      announcementLink: schema.events.announcementLink,
      cancelledAt: schema.events.cancelledAt,
      raceType: schema.events.raceType,
      championshipType: schema.events.championshipType,
      isWrc: schema.events.isWrc,
      ladvId: schema.events.ladvId,
      ladvLastSync: schema.events.ladvLastSync,
      createdBy: schema.events.createdBy,
      createdAt: schema.events.createdAt,
      updatedAt: schema.events.updatedAt,
      participantCount: sql<number>`cast(count(case when ${schema.registrations.status} not in ('canceled', 'no') then 1 end) as int)`,
      ownRegistrationStatus: sql<string | null>`max(case when ${schema.registrations.userId} = ${userId} then ${schema.registrations.status} end)`,
      ownRegistrationId: sql<string | null>`max(case when ${schema.registrations.userId} = ${userId} then ${schema.registrations.id} end)`,
    })
    .from(schema.events)
    .leftJoin(schema.registrations, eq(schema.events.id, schema.registrations.eventId))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(schema.events.id)
    .orderBy(
      sql`case when ${schema.events.date} is null then 1 else 0 end`,
      timeRange === 'past' ? desc(schema.events.date) : asc(schema.events.date),
    )

  return events
})
