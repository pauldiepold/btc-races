import { db, schema } from 'hub:db'
import { asc, desc, eq, inArray, sql } from 'drizzle-orm'
import type { MyRegistration, DisciplineDetail } from '~~/shared/types/events'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  const regs = await db
    .select({
      id: schema.registrations.id,
      status: schema.registrations.status,
      notes: schema.registrations.notes,
      createdAt: schema.registrations.createdAt,
      eventId: schema.events.id,
      eventName: schema.events.name,
      eventDate: schema.events.date,
      eventType: schema.events.type,
      eventCancelledAt: schema.events.cancelledAt,
      eventRegistrationDeadline: schema.events.registrationDeadline,
    })
    .from(schema.registrations)
    .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
    .where(eq(schema.registrations.userId, userId))
    .orderBy(
      sql`CASE WHEN ${schema.events.date} IS NULL THEN 1 ELSE 0 END`,
      desc(schema.events.date),
    )

  if (regs.length === 0) {
    return [] as MyRegistration[]
  }

  const regIds = regs.map(r => r.id)
  const disciplines = await db
    .select()
    .from(schema.registrationDisciplines)
    .where(inArray(schema.registrationDisciplines.registrationId, regIds))
    .orderBy(asc(schema.registrationDisciplines.createdAt))

  const disciplinesByRegId = new Map<number, DisciplineDetail[]>()
  for (const d of disciplines) {
    const item: DisciplineDetail = {
      id: d.id,
      discipline: d.discipline,
      ageClass: d.ageClass,
      ladvRegisteredAt: d.ladvRegisteredAt,
      ladvRegisteredBy: d.ladvRegisteredBy,
      ladvCanceledAt: d.ladvCanceledAt,
      ladvCanceledBy: d.ladvCanceledBy,
    }
    const existing = disciplinesByRegId.get(d.registrationId) ?? []
    existing.push(item)
    disciplinesByRegId.set(d.registrationId, existing)
  }

  return regs.map((r): MyRegistration => ({
    id: r.id,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
    event: {
      id: encodeEventId(r.eventId),
      name: r.eventName,
      date: r.eventDate,
      type: r.eventType,
      cancelledAt: r.eventCancelledAt,
      registrationDeadline: r.eventRegistrationDeadline,
    },
    disciplines: disciplinesByRegId.get(r.id) ?? [],
  }))
})
