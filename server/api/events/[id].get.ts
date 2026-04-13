import { db, schema } from 'hub:db'
import { asc, eq, inArray, sql } from 'drizzle-orm'
import type { LadvAusschreibung } from '~~/shared/types/ladv'
import { compareDisciplines, isRunningDiscipline } from '~~/shared/utils/ladv-labels'
import type { DisciplineDetail, EventDetail, EventPublicDetail, RegistrationDetail } from '~~/shared/types/events'
import type { RegistrationStatus } from '~~/shared/utils/registration'

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
      hasAvatar: schema.users.avatarSmall,
      status: schema.registrations.status,
      notes: schema.registrations.notes,
      createdAt: schema.registrations.createdAt,
    })
    .from(schema.registrations)
    .leftJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .where(eq(schema.registrations.eventId, id))
    .orderBy(asc(schema.users.firstName), asc(schema.users.lastName))

  const isAdmin = session.user!.role === 'admin' || session.user!.role === 'superuser'
  const userId = session.user!.id

  let disciplines: typeof schema.registrationDisciplines.$inferSelect[] = []
  if (regs.length > 0) {
    const regIds = regs.map(r => r.id)
    disciplines = await db
      .select()
      .from(schema.registrationDisciplines)
      .where(inArray(schema.registrationDisciplines.registrationId, regIds))
      .orderBy(asc(schema.registrationDisciplines.createdAt))
  }

  const regUserMap = new Map<number, number>(regs.map(r => [r.id, r.userId!]))
  const disciplinesByRegId = new Map<number, DisciplineDetail[]>()

  for (const d of disciplines) {
    const regUserId = regUserMap.get(d.registrationId)
    const showLadv = isAdmin || regUserId === userId

    const item: DisciplineDetail = {
      id: d.id,
      discipline: d.discipline,
      ageClass: d.ageClass,
      ladvRegisteredAt: showLadv ? d.ladvRegisteredAt : null,
      ladvRegisteredBy: showLadv ? d.ladvRegisteredBy : null,
      ladvCanceledAt: showLadv ? d.ladvCanceledAt : null,
      ladvCanceledBy: showLadv ? d.ladvCanceledBy : null,
    }

    const existing = disciplinesByRegId.get(d.registrationId) ?? []
    existing.push(item)
    disciplinesByRegId.set(d.registrationId, existing)
  }

  for (const discs of disciplinesByRegId.values()) {
    discs.sort(compareDisciplines)
  }

  const registrations: RegistrationDetail[] = regs.map(r => ({
    id: r.id,
    userId: r.userId!,
    firstName: r.firstName,
    lastName: r.lastName,
    hasAvatar: r.hasAvatar !== null,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
    disciplines: disciplinesByRegId.get(r.id) ?? [],
  }))

  const rawLadvData = dbEvent.ladvData as LadvAusschreibung | null
  const ladvData = rawLadvData
    ? {
        ...rawLadvData,
        wettbewerbe: (rawLadvData.wettbewerbe ?? []).filter(w => isRunningDiscipline(w.disziplinNew)),
      }
    : null

  const result: EventDetail = {
    ...dbEvent,
    id: sqid,
    ladvData,
    registrations,
  }

  return result
})
