import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import { shouldNotifyAdminsOnWishChange } from '~~/shared/utils/ladv-diff'
import { notify } from '~~/server/notifications/service'
import { recipients } from '~~/server/notifications/recipients'
import { buildEventPayload } from '~~/server/notifications/payload-helpers'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'

const bodySchema = z.object({
  disciplines: z.array(z.object({
    discipline: z.string().min(1),
    ageClass: z.string().min(1),
  })).min(1),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
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

  if (registration.userId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung' })
  }

  const dbEvent = await db.query.events.findFirst({
    where: eq(schema.events.id, registration.eventId),
  })
  if (!dbEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }

  if (dbEvent.type !== 'ladv') {
    throw createError({ statusCode: 422, statusMessage: 'Disziplinen nur bei LADV-Events' })
  }

  if (isDeadlineExpired(dbEvent.registrationDeadline)) {
    throw createError({ statusCode: 422, statusMessage: 'Meldefrist abgelaufen' })
  }

  const prevWish = (registration.wishDisciplines as RegistrationDisciplinePair[] | null) ?? []
  const ladvDisciplines = registration.ladvDisciplines as RegistrationDisciplinePair[] | null
  const doNotify = shouldNotifyAdminsOnWishChange(prevWish, disciplines, ladvDisciplines)

  await db
    .update(schema.registrations)
    .set({ wishDisciplines: disciplines, updatedAt: new Date() })
    .where(eq(schema.registrations.id, id))

  if (doNotify) {
    try {
      const siteUrl = useRuntimeConfig().public.siteUrl
      await notify({
        type: 'athlete_changed_after_ladv',
        recipients: await recipients.allAdmins(),
        actorUserId: registration.userId,
        payload: buildEventPayload(dbEvent, siteUrl),
        eventId: registration.eventId,
      })
    }
    catch (err) {
      console.error('[Notification] athlete_changed_after_ladv:', err)
    }
  }

  return { id }
})
