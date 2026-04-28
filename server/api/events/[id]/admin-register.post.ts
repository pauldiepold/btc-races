import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import { decodeEventId } from '~~/server/utils/sqids'
import { validateAdminRegistration } from '~~/server/utils/admin-register'
import { notificationService } from '~~/server/notifications/service'
import { formatEventDate } from '~~/shared/utils/events'

const bodySchema = z.object({
  userId: z.number().int().positive(),
  status: z.enum(['registered', 'maybe', 'yes', 'no']).optional(),
  notes: z.string().optional(),
  disciplines: z.array(z.object({
    discipline: z.string(),
    ageClass: z.string(),
  })).optional(),
  setLadvStandImmediately: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const sqid = getRouterParam(event, 'id')
  if (!sqid) throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })

  const id = decodeEventId(sqid)
  if (id === null) throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Validierungsfehler' })
  }
  const { userId, status, notes, disciplines, setLadvStandImmediately } = parsed.data

  const dbEvent = await db.query.events.findFirst({ where: eq(schema.events.id, id) })
  if (!dbEvent) throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  if (dbEvent.cancelledAt) throw createError({ statusCode: 422, statusMessage: 'Event ist abgesagt' })

  const targetUser = await db.query.users.findFirst({ where: eq(schema.users.id, userId) })
  if (!targetUser) throw createError({ statusCode: 404, statusMessage: 'Mitglied nicht gefunden' })
  if (targetUser.membershipStatus !== 'active') {
    throw createError({ statusCode: 422, statusMessage: 'Mitglied ist nicht aktiv' })
  }

  const validation = validateAdminRegistration(dbEvent.type, { status, disciplines })
  if (!validation.ok) {
    throw createError({ statusCode: 422, statusMessage: validation.error })
  }
  const { status: effectiveStatus, wishDisciplines } = validation

  const now = new Date()
  const existing = await db.query.registrations.findFirst({
    where: and(
      eq(schema.registrations.eventId, id),
      eq(schema.registrations.userId, userId),
    ),
  })

  if (existing && existing.status !== 'canceled') {
    throw createError({ statusCode: 409, statusMessage: 'Mitglied ist bereits angemeldet' })
  }

  const setLadv = setLadvStandImmediately === true && dbEvent.type === 'ladv'

  let registrationId: number
  if (existing) {
    // Reaktivierung: Status + Wunsch neu, ladvDisciplines bleibt unverändert
    // (Coach entscheidet via RegistrationCoachModal). Optional kann LADV-Stand
    // mitgesetzt werden, dann überschreibt er den bestehenden Stand.
    await db.update(schema.registrations)
      .set({
        status: effectiveStatus,
        notes: notes ?? null,
        wishDisciplines,
        ...(setLadv ? { ladvDisciplines: wishDisciplines } : {}),
        updatedAt: now,
      })
      .where(eq(schema.registrations.id, existing.id))
    registrationId = existing.id
  }
  else {
    const inserted = await db.insert(schema.registrations).values({
      eventId: id,
      userId,
      status: effectiveStatus,
      notes: notes ?? null,
      wishDisciplines,
      ladvDisciplines: setLadv ? wishDisciplines : null,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: schema.registrations.id })
    registrationId = inserted[0]!.id
  }

  void sendAdminRegisteredNotification(targetUser, dbEvent, wishDisciplines, setLadv)

  setResponseStatus(event, 201)
  return { id: registrationId }
})

type UserRow = typeof schema.users.$inferSelect
type EventRow = typeof schema.events.$inferSelect

async function sendAdminRegisteredNotification(
  targetUser: UserRow,
  dbEvent: EventRow,
  wishDisciplines: { discipline: string, ageClass: string }[] | null,
  setLadv: boolean,
) {
  try {
    const siteUrl = useRuntimeConfig().public.siteUrl
    const recipient = { userId: targetUser.id, email: targetUser.email, firstName: targetUser.firstName ?? undefined }
    const basePayload = {
      eventName: dbEvent.name,
      eventDate: formatEventDate(dbEvent.date) ?? undefined,
      eventLocation: dbEvent.location ?? undefined,
      registrationDeadline: formatEventDate(dbEvent.registrationDeadline) ?? undefined,
      eventLink: `${siteUrl}/${encodeEventId(dbEvent.id)}`,
    }

    if (setLadv && wishDisciplines && wishDisciplines.length > 0) {
      await notificationService.enqueue({
        type: 'ladv_registered',
        recipients: [recipient],
        payload: { ...basePayload, disciplines: wishDisciplines.map(d => d.discipline) },
        eventId: dbEvent.id,
      })
    }
    else {
      await notificationService.enqueue({
        type: 'admin_registered_member',
        recipients: [recipient],
        payload: {
          ...basePayload,
          ...(wishDisciplines && wishDisciplines.length > 0
            ? { disciplines: wishDisciplines.map(d => d.discipline) }
            : {}),
        },
        eventId: dbEvent.id,
      })
    }
  }
  catch (err) {
    console.error('[Notification] Fehler beim Erstellen des Jobs (admin_registered_member):', err)
  }
}
