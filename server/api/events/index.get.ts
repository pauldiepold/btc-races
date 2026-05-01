import { db, schema } from 'hub:db'
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { EventListItem, EventListPublicItem } from '~~/shared/types/events'
import type { LadvAusschreibung } from '~~/shared/types/ladv'

function extractLadvFields(rawLadvData: unknown) {
  const ladvData = rawLadvData as LadvAusschreibung | null
  const wettbewerbe = ladvData?.wettbewerbe ?? []
  return {
    disciplines: [...new Set(wettbewerbe.map(w => w.disziplinNew).filter(Boolean))],
    ageClasses: [...new Set(wettbewerbe.map(w => w.klasseNew).filter(Boolean))],
  }
}

const berlinDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })

const querySchema = z.object({
  type: z.enum(['ladv', 'competition', 'training', 'social']).optional(),
  timeRange: z.enum(['upcoming', 'past', 'all']).optional(),
})

const PUBLIC_EVENT_TYPES = ['ladv', 'competition'] as const

export default defineEventHandler(async (event): Promise<EventListItem[] | EventListPublicItem[]> => {
  const session = await getUserSession(event)
  const isAuthenticated = !!session.user

  const query = getQuery(event)
  const params = querySchema.safeParse(query)
  if (!params.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Query-Parameter' })
  }

  const { type, timeRange = 'upcoming' } = params.data
  const today = berlinDateFormatter.format(new Date())

  const conditions = []

  if (isAuthenticated) {
    if (type) {
      conditions.push(eq(schema.events.type, type))
    }
  }
  else {
    // Ohne Auth: immer auf ladv/competition beschränken
    conditions.push(inArray(schema.events.type, PUBLIC_EVENT_TYPES))
  }

  if (timeRange === 'past') {
    conditions.push(and(isNotNull(schema.events.date), lt(schema.events.date, today)))
  }
  else if (timeRange === 'upcoming') {
    conditions.push(or(isNull(schema.events.date), gte(schema.events.date, today)))
  }

  if (!isAuthenticated) {
    const events = await db
      .select({
        id: schema.events.id,
        type: schema.events.type,
        name: schema.events.name,
        date: schema.events.date,
        startTime: schema.events.startTime,
        duration: schema.events.duration,
        location: schema.events.location,
        description: schema.events.description,
        registrationDeadline: schema.events.registrationDeadline,
        announcementLink: schema.events.announcementLink,
        cancelledAt: schema.events.cancelledAt,
        raceType: schema.events.raceType,
        championshipType: schema.events.championshipType,
        isWrc: schema.events.isWrc,
        priority: schema.events.priority,
        ladvId: schema.events.ladvId,
        ladvData: schema.events.ladvData,
        ladvLastSync: schema.events.ladvLastSync,
        createdAt: schema.events.createdAt,
        updatedAt: schema.events.updatedAt,
        participantCount: sql<number>`cast(count(case when ${schema.registrations.status} not in ('canceled', 'no') then 1 end) as int)`,
      })
      .from(schema.events)
      .leftJoin(schema.registrations, eq(schema.events.id, schema.registrations.eventId))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(schema.events.id)
      .orderBy(
        sql`case when ${schema.events.date} is null then 1 else 0 end`,
        timeRange === 'past' ? desc(schema.events.date) : asc(schema.events.date),
      )

    return events.map(({ ladvData, ...e }) => ({ ...e, id: encodeEventId(e.id), ...extractLadvFields(ladvData) }))
  }

  const userId = session.user!.id

  const events = await db
    .select({
      id: schema.events.id,
      type: schema.events.type,
      name: schema.events.name,
      date: schema.events.date,
      startTime: schema.events.startTime,
      duration: schema.events.duration,
      location: schema.events.location,
      description: schema.events.description,
      registrationDeadline: schema.events.registrationDeadline,
      announcementLink: schema.events.announcementLink,
      cancelledAt: schema.events.cancelledAt,
      raceType: schema.events.raceType,
      championshipType: schema.events.championshipType,
      isWrc: schema.events.isWrc,
      priority: schema.events.priority,
      ladvId: schema.events.ladvId,
      ladvData: schema.events.ladvData,
      ladvLastSync: schema.events.ladvLastSync,
      createdBy: schema.events.createdBy,
      createdAt: schema.events.createdAt,
      updatedAt: schema.events.updatedAt,
      participantCount: sql<number>`cast(count(case when ${schema.registrations.status} not in ('canceled', 'no') then 1 end) as int)`,
      ownRegistrationStatus: sql<string | null>`max(case when ${schema.registrations.userId} = ${userId} then ${schema.registrations.status} end)`,
      ownRegistrationId: sql<number | null>`max(case when ${schema.registrations.userId} = ${userId} then ${schema.registrations.id} end)`,
    })
    .from(schema.events)
    .leftJoin(schema.registrations, eq(schema.events.id, schema.registrations.eventId))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(schema.events.id)
    .orderBy(
      sql`case when ${schema.events.date} is null then 1 else 0 end`,
      timeRange === 'past' ? desc(schema.events.date) : asc(schema.events.date),
    )

  return events.map(({ ladvData, ...e }) => ({ ...e, id: encodeEventId(e.id), ...extractLadvFields(ladvData) }))
})
