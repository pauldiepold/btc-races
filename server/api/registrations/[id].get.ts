import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '~~/server/utils/auth'
import { isRunningDiscipline } from '~~/shared/utils/ladv-labels'
import type { RegistrationCoachView } from '~~/shared/types/events'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import type { LadvAusschreibung, LadvWettbewerb } from '~~/shared/types/ladv'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rawId = getRouterParam(event, 'id')

  if (!rawId) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Anmeldungs-ID' })
  }

  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Anmeldungs-ID' })
  }

  const [row] = await db
    .select({
      regId: schema.registrations.id,
      status: schema.registrations.status,
      notes: schema.registrations.notes,
      wishDisciplines: schema.registrations.wishDisciplines,
      ladvDisciplines: schema.registrations.ladvDisciplines,
      userId: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      avatarSmall: schema.users.avatarSmall,
      eventId: schema.events.id,
      eventName: schema.events.name,
      eventDate: schema.events.date,
      ladvId: schema.events.ladvId,
      ladvData: schema.events.ladvData,
    })
    .from(schema.registrations)
    .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .innerJoin(schema.events, eq(schema.registrations.eventId, schema.events.id))
    .where(eq(schema.registrations.id, id))

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Anmeldung nicht gefunden' })
  }

  const ladvData = row.ladvData as LadvAusschreibung | null
  const wettbewerbe: LadvWettbewerb[] = (ladvData?.wettbewerbe ?? []).filter(w =>
    isRunningDiscipline(w.disziplinNew),
  )

  return {
    id: row.regId,
    status: row.status,
    notes: row.notes,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    hasAvatar: row.avatarSmall !== null,
    wishDisciplines: (row.wishDisciplines as RegistrationDisciplinePair[] | null) ?? [],
    ladvDisciplines: row.ladvDisciplines as RegistrationDisciplinePair[] | null,
    event: {
      id: encodeEventId(row.eventId),
      name: row.eventName,
      date: row.eventDate,
      ladvId: row.ladvId,
      wettbewerbe,
    },
  } satisfies RegistrationCoachView
})
