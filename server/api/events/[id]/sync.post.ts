import { db, schema } from 'hub:db'
import { asc, eq, inArray } from 'drizzle-orm'
import { LadvService } from '~~/server/external-apis/ladv/ladv.service'
import { isRunningDiscipline } from '~~/shared/utils/ladv-labels'
import type { DisciplineDetail, EventDetail, RegistrationDetail } from '~~/shared/types/events'
import type { LadvAusschreibung } from '~~/shared/types/ladv'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const session = await requireAdmin(event)

  const dbEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  })
  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }
  if (!dbEvent.ladvId) {
    throw createError({ statusCode: 400, statusMessage: 'Kein LADV-Event' })
  }

  let normalized
  try {
    const service = new LadvService()
    normalized = await service.fetchAusschreibung(dbEvent.ladvId)
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'LADV nicht erreichbar' })
  }

  const now = new Date()
  const updates: Partial<typeof schema.events.$inferInsert> = {
    ladvData: normalized.ladv_data,
    ladvLastSync: now,
    updatedAt: now,
  }

  if (normalized.ladv_data.abgesagt && !dbEvent.cancelledAt) {
    updates.cancelledAt = now
  }

  await db.update(schema.events).set(updates).where(eq(schema.events.id, id))

  // Aktualisiertes Event + Anmeldungen zurückgeben (identisch zu GET /api/events/[id])
  const updatedEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  })

  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'
  const userId = session.user.id

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
    .orderBy(asc(schema.registrations.createdAt))

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
    hasAvatar: r.hasAvatar !== null,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
    disciplines: disciplinesByRegId.get(r.id) ?? [],
  }))

  const rawLadvData = updatedEvent!.ladvData as LadvAusschreibung | null
  const ladvData = rawLadvData
    ? { ...rawLadvData, wettbewerbe: (rawLadvData.wettbewerbe ?? []).filter(w => isRunningDiscipline(w.disziplinNew)) }
    : null

  const result: EventDetail = {
    ...updatedEvent!,
    ladvData,
    registrations,
  }

  return result
})
