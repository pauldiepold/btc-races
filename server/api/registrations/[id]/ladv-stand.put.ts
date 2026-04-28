import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import { notificationService } from '~~/server/notifications/service'
import { formatEventDate } from '~~/shared/utils/events'

const bodySchema = z.object({
  disciplines: z.array(z.object({
    discipline: z.string().min(1),
    ageClass: z.string().min(1),
  })).nullable(),
})

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

  const body = await readBody(event)
  const result = bodySchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Validierungsfehler' })
  }

  const { disciplines } = result.data

  const registration = await db.query.registrations.findFirst({
    where: eq(schema.registrations.id, id),
  })
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: 'Anmeldung nicht gefunden' })
  }

  await db
    .update(schema.registrations)
    .set({
      ladvDisciplines: disciplines,
      ...(disciplines !== null ? { wishDisciplines: disciplines } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.registrations.id, id))

  void sendLadvStandNotification(registration.userId, registration.eventId, disciplines)

  return { id }
})

async function sendLadvStandNotification(
  userId: number,
  eventId: number,
  disciplines: { discipline: string, ageClass: string }[] | null,
) {
  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { id: true, email: true, firstName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      }),
    ])

    if (!user || !dbEvent) return

    const siteUrl = useRuntimeConfig().public.siteUrl
    const basePayload = {
      eventName: dbEvent.name,
      eventDate: formatEventDate(dbEvent.date) ?? undefined,
      eventLocation: dbEvent.location ?? undefined,
      registrationDeadline: formatEventDate(dbEvent.registrationDeadline) ?? undefined,
      eventLink: `${siteUrl}/${encodeEventId(eventId)}`,
    }
    const recipient = { userId: user.id, email: user.email, firstName: user.firstName ?? undefined }

    if (disciplines && disciplines.length > 0) {
      await notificationService.enqueue({
        type: 'ladv_registered',
        recipients: [recipient],
        payload: { ...basePayload, disciplines: disciplines.map(d => d.discipline) },
        eventId,
      })
    }
    else {
      await notificationService.enqueue({
        type: 'ladv_canceled',
        recipients: [recipient],
        payload: basePayload,
        eventId,
      })
    }
  }
  catch (err) {
    console.error('[Notification] Fehler beim Erstellen des Jobs:', err)
  }
}
