import { db, schema } from 'hub:db'
import { eq, and, isNull, isNotNull, or, sql, asc } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'
import type { LadvTodo } from '~~/shared/types/events'

const typeOrder = sql<number>`CASE WHEN ${schema.registrations.status} = 'registered' THEN 0 ELSE 1 END`
const dateNullsLast = sql`CASE WHEN ${schema.events.date} IS NULL THEN 1 ELSE 0 END`

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db
    .select({
      eventId: schema.events.id,
      eventName: schema.events.name,
      eventDate: schema.events.date,
      ladvId: schema.events.ladvId,
      registrationId: schema.registrations.id,
      disciplineId: schema.registrationDisciplines.id,
      discipline: schema.registrationDisciplines.discipline,
      ageClass: schema.registrationDisciplines.ageClass,
      userId: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      _typeOrder: typeOrder,
    })
    .from(schema.registrationDisciplines)
    .innerJoin(
      schema.registrations,
      eq(schema.registrationDisciplines.registrationId, schema.registrations.id),
    )
    .innerJoin(
      schema.events,
      and(
        eq(schema.registrations.eventId, schema.events.id),
        eq(schema.events.type, 'ladv'),
      ),
    )
    .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .where(
      and(
        isNull(schema.registrationDisciplines.ladvCanceledAt),
        or(
          and(
            eq(schema.registrations.status, 'registered'),
            isNull(schema.registrationDisciplines.ladvRegisteredAt),
          ),
          and(
            eq(schema.registrations.status, 'canceled'),
            isNotNull(schema.registrationDisciplines.ladvRegisteredAt),
          ),
        ),
      ),
    )
    .orderBy(dateNullsLast, asc(schema.events.date), asc(typeOrder), asc(schema.users.lastName))

  // Gruppieren: eine LadvTodo pro registrationId + type
  const grouped = new Map<string, LadvTodo>()
  for (const row of rows) {
    const type = row._typeOrder === 0 ? 'register' as const : 'cancel' as const
    const key = `${row.registrationId}:${type}`
    const existing = grouped.get(key)
    if (existing) {
      existing.disciplines.push({ id: row.disciplineId, discipline: row.discipline, ageClass: row.ageClass })
    }
    else {
      grouped.set(key, {
        type,
        eventId: row.eventId,
        eventName: row.eventName,
        eventDate: row.eventDate,
        ladvId: row.ladvId,
        registrationId: row.registrationId,
        disciplines: [{ id: row.disciplineId, discipline: row.discipline, ageClass: row.ageClass }],
        userId: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
      })
    }
  }

  return [...grouped.values()] satisfies LadvTodo[]
})
