import { db, schema } from 'hub:db'
import { desc, eq, sql } from 'drizzle-orm'
import type { MyRegistration } from '~~/shared/types/events'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  const regs = await db
    .select({
      id: schema.registrations.id,
      status: schema.registrations.status,
      notes: schema.registrations.notes,
      createdAt: schema.registrations.createdAt,
      wishDisciplines: schema.registrations.wishDisciplines,
      ladvDisciplines: schema.registrations.ladvDisciplines,
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

  return regs.map((r): MyRegistration => ({
    id: r.id,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
    wishDisciplines: (r.wishDisciplines as RegistrationDisciplinePair[] | null) ?? [],
    ladvDisciplines: r.ladvDisciplines as RegistrationDisciplinePair[] | null,
    event: {
      id: encodeEventId(r.eventId),
      name: r.eventName,
      date: r.eventDate,
      type: r.eventType,
      cancelledAt: r.eventCancelledAt,
      registrationDeadline: r.eventRegistrationDeadline,
    },
  }))
})
