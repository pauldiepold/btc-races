import { db, schema } from 'hub:db'
import { asc, eq, sql } from 'drizzle-orm'
import type { LadvAusschreibung } from '~~/shared/types/ladv'
import { isRunningDiscipline } from '~~/shared/utils/ladv-labels'
import type { EventDetail, EventPublicDetail, RegistrationDetail } from '~~/shared/types/events'
import type { RegistrationStatus } from '~~/shared/utils/registration'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'

const PUBLIC_EVENT_TYPES = ['ladv', 'competition'] as const

export default defineEventHandler(async (event): Promise<EventDetail | EventPublicDetail> => {
  const session = await getUserSession(event)
  const isAuthenticated = !!session.user
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

  if (!isAuthenticated) {
    if (!PUBLIC_EVENT_TYPES.includes(dbEvent.type as typeof PUBLIC_EVENT_TYPES[number])) {
      throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
    }

    const countRows = await db
      .select({
        status: schema.registrations.status,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(schema.registrations)
      .where(eq(schema.registrations.eventId, id))
      .groupBy(schema.registrations.status)

    const registrationCounts: Partial<Record<RegistrationStatus, number>> = {}
    for (const row of countRows) {
      registrationCounts[row.status as RegistrationStatus] = row.count
    }

    const rawLadvData = dbEvent.ladvData as LadvAusschreibung | null
    const ladvData = rawLadvData
      ? {
          ...rawLadvData,
          wettbewerbe: (rawLadvData.wettbewerbe ?? []).filter(w => isRunningDiscipline(w.disziplinNew)),
        }
      : null

    const { createdBy: _createdBy, ladvData: _ladvData, ...eventFields } = dbEvent
    const result: EventPublicDetail = {
      ...eventFields,
      id: sqid,
      ladvData,
      registrationCounts,
    }

    return result
  }

  const regs = await db
    .select({
      id: schema.registrations.id,
      userId: schema.registrations.userId,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      avatarSmall: schema.users.avatarSmall,
      status: schema.registrations.status,
      notes: schema.registrations.notes,
      createdAt: schema.registrations.createdAt,
      wishDisciplines: schema.registrations.wishDisciplines,
      ladvDisciplines: schema.registrations.ladvDisciplines,
    })
    .from(schema.registrations)
    .leftJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .where(eq(schema.registrations.eventId, id))
    .orderBy(asc(schema.users.firstName), asc(schema.users.lastName))

  const isAdmin = session.user!.role === 'admin' || session.user!.role === 'superuser'
  const userId = session.user!.id

  const registrations: RegistrationDetail[] = regs.map((r) => {
    const showLadv = isAdmin || r.userId === userId
    return {
      id: r.id,
      userId: r.userId!,
      firstName: r.firstName,
      lastName: r.lastName,
      avatarUrl: r.avatarSmall ? `/api/avatar/${r.userId}` : null,
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt,
      wishDisciplines: (r.wishDisciplines as RegistrationDisciplinePair[] | null) ?? [],
      ladvDisciplines: showLadv ? (r.ladvDisciplines as RegistrationDisciplinePair[] | null) : null,
    }
  })

  const rawLadvData = dbEvent.ladvData as LadvAusschreibung | null
  const ladvData = rawLadvData
    ? {
        ...rawLadvData,
        wettbewerbe: (rawLadvData.wettbewerbe ?? []).filter(w => isRunningDiscipline(w.disziplinNew)),
      }
    : null

  const creator = dbEvent.createdBy
    ? await db.query.users.findFirst({
        where: eq(schema.users.id, dbEvent.createdBy),
        columns: { firstName: true, lastName: true },
      })
    : null
  const createdByName = creator
    ? [creator.firstName, creator.lastName ? `${creator.lastName[0]}.` : null].filter(Boolean).join(' ') || null
    : null

  const result: EventDetail = {
    ...dbEvent,
    id: sqid,
    ladvData,
    registrations,
    createdByName,
  }

  return result
})
