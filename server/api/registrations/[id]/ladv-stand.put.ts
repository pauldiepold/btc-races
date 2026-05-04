import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import { triggerLadvStandNotification } from '~~/server/notifications/triggers'
import { formatActorName } from '~~/shared/utils/format-actor-name'

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

  await triggerLadvStandNotification(registration.userId, registration.eventId, disciplines, formatActorName(adminSession.user.firstName, adminSession.user.lastName))

  return { id }
})
