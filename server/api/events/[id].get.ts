import { db, schema } from 'hub:db'
import { asc, eq, inArray } from 'drizzle-orm'
import type { LadvAusschreibung } from '~~/shared/types/ladv'
import { isRunningDiscipline } from '~~/shared/utils/ladv-labels'
import type { DisciplineDetail, EventDetail, RegistrationDetail } from '~~/shared/types/events'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const dbEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  })

  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  const regs = await db
    .select({
      id: schema.registrations.id,
      userId: schema.registrations.userId,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      status: schema.registrations.status,
      notes: schema.registrations.notes,
      createdAt: schema.registrations.createdAt,
    })
    .from(schema.registrations)
    .leftJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .where(eq(schema.registrations.eventId, id))
    .orderBy(asc(schema.registrations.createdAt))

  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'
  const userId = session.user.id

  let disciplines: typeof schema.registrationDisciplines.$inferSelect[] = []
  if (regs.length > 0) {
    const regIds = regs.map(r => r.id)
    disciplines = await db
      .select()
      .from(schema.registrationDisciplines)
      .where(inArray(schema.registrationDisciplines.registrationId, regIds))
      .orderBy(asc(schema.registrationDisciplines.createdAt))
  }

  const regUserMap = new Map<string, string>(regs.map(r => [r.id, r.userId]))

  const disciplinesByRegId = new Map<string, DisciplineDetail[]>()
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

  const registrations: RegistrationDetail[] = regs.map(r => ({
    id: r.id,
    userId: r.userId,
    firstName: r.firstName,
    lastName: r.lastName,
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
    ladvData,
    registrations,
  }

  return result
})
