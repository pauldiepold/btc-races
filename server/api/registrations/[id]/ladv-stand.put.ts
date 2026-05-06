import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import { notify } from '~~/server/notifications/service'
import { buildEventPayload, formatDisciplineLabels } from '~~/server/notifications/payload-helpers'

const bodySchema = z.object({
  disciplines: z.array(z.object({
    discipline: z.string().min(1),
    ageClass: z.string().min(1),
  })).nullable(),
})

export default defineEventHandler(async (event) => {
  const adminSession = await requireAdmin(event)
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

  try {
    const [user, dbEvent] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, registration.userId),
        columns: { id: true, email: true, firstName: true },
      }),
      db.query.events.findFirst({
        where: eq(schema.events.id, registration.eventId),
      }),
    ])

    if (user && dbEvent) {
      const siteUrl = useRuntimeConfig().public.siteUrl
      const recipient = { userId: user.id, email: user.email, firstName: user.firstName ?? undefined }
      const basePayload = buildEventPayload(dbEvent, siteUrl)

      if (disciplines && disciplines.length > 0) {
        await notify({
          type: 'ladv_registered',
          recipients: [recipient],
          actorUserId: adminSession.user.id,
          payload: { ...basePayload, disciplines: formatDisciplineLabels(disciplines) },
          eventId: registration.eventId,
        })
      }
      else {
        await notify({
          type: 'ladv_canceled',
          recipients: [recipient],
          actorUserId: adminSession.user.id,
          payload: basePayload,
          eventId: registration.eventId,
        })
      }
    }
  }
  catch (err) {
    console.error('[Notification] ladv_stand:', err)
  }

  return { id }
})
