import { db, schema } from 'hub:db'
import { asc, eq } from 'drizzle-orm'
import { triggerEventChangedNotification, toEventCoreSnapshot } from '~~/server/notifications/triggers'
import { LadvService } from '~~/server/external-apis/ladv/ladv.service'
import { isRunningDiscipline } from '~~/shared/utils/ladv-labels'
import type { EventDetail, RegistrationDetail } from '~~/shared/types/events'
import type { LadvAusschreibung } from '~~/shared/types/ladv'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'

export default defineEventHandler(async (event) => {
  const sqid = getRouterParam(event, 'id')
  if (!sqid) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }

  const id = decodeEventId(sqid)
  if (id === null) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
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

  const beforeCore = toEventCoreSnapshot(dbEvent)

  const now = new Date()
  const updates: Partial<typeof schema.events.$inferInsert> = {
    name: normalized.name,
    date: normalized.date,
    startTime: normalized.start_time,
    location: normalized.location,
    registrationDeadline: normalized.registration_deadline,
    raceType: normalized.race_type,
    isWrc: normalized.is_wrc,
    ladvData: normalized.ladv_data,
    ladvLastSync: now,
    updatedAt: now,
  }

  if (normalized.ladv_data.abgesagt && !dbEvent.cancelledAt) {
    updates.cancelledAt = now
  }

  await db.update(schema.events).set(updates).where(eq(schema.events.id, id))

  const updatedEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  })

  if (updatedEvent) {
    await triggerEventChangedNotification(
      beforeCore,
      toEventCoreSnapshot(updatedEvent),
      updatedEvent,
    )
  }

  const isAdmin = session.user.role === 'admin' || session.user.role === 'superuser'
  const userId = session.user.id

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
    .orderBy(asc(schema.registrations.createdAt))

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

  const rawLadvData = updatedEvent!.ladvData as LadvAusschreibung | null
  const ladvData = rawLadvData
    ? { ...rawLadvData, wettbewerbe: (rawLadvData.wettbewerbe ?? []).filter(w => isRunningDiscipline(w.disziplinNew)) }
    : null

  const result: EventDetail = {
    ...updatedEvent!,
    id: sqid,
    ladvData,
    registrations,
  }

  return result
})
