import { db, schema } from 'hub:db'
import { eq, and, or, isNotNull, sql, asc } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'
import { diffLadvRegistration } from '~~/shared/utils/ladv-diff'
import type { LadvTodo } from '~~/shared/types/events'

const typeOrder = sql<number>`CASE WHEN ${schema.registrations.status} = 'registered' THEN 0 ELSE 1 END`
const dateNullsLast = sql`CASE WHEN ${schema.events.date} IS NULL THEN 1 ELSE 0 END`

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db
    .select({
      registrationId: schema.registrations.id,
      status: schema.registrations.status,
      wishDisciplines: schema.registrations.wishDisciplines,
      ladvDisciplines: schema.registrations.ladvDisciplines,
      eventId: schema.events.id,
      eventName: schema.events.name,
      eventDate: schema.events.date,
      ladvId: schema.events.ladvId,
      userId: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      _typeOrder: typeOrder,
    })
    .from(schema.registrations)
    .innerJoin(
      schema.events,
      and(
        eq(schema.registrations.eventId, schema.events.id),
        eq(schema.events.type, 'ladv'),
      ),
    )
    .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .where(
      or(
        eq(schema.registrations.status, 'registered'),
        and(
          eq(schema.registrations.status, 'canceled'),
          isNotNull(schema.registrations.ladvDisciplines),
        ),
      ),
    )
    .orderBy(dateNullsLast, asc(schema.events.date), asc(typeOrder), asc(schema.users.lastName))

  const todos: LadvTodo[] = []

  for (const row of rows) {
    const wishDisciplines = (row.wishDisciplines as { discipline: string, ageClass: string }[] | null) ?? []
    const ladvDisciplines = row.ladvDisciplines as { discipline: string, ageClass: string }[] | null

    let diff

    if (row.status === 'canceled') {
      if (!ladvDisciplines || ladvDisciplines.length === 0) continue
      diff = ladvDisciplines.map(d => ({ type: 'remove' as const, discipline: d.discipline, ageClass: d.ageClass }))
    }
    else {
      diff = diffLadvRegistration(wishDisciplines, ladvDisciplines)
      if (diff.length === 0) continue
    }

    todos.push({
      type: row.status === 'registered' ? 'register' : 'cancel',
      eventId: encodeEventId(row.eventId),
      eventName: row.eventName,
      eventDate: row.eventDate,
      ladvId: row.ladvId,
      registrationId: row.registrationId,
      diff,
      userId: row.userId,
      firstName: row.firstName,
      lastName: row.lastName,
    })
  }

  return todos satisfies LadvTodo[]
})
