import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { LadvService } from '~~/server/external-apis/ladv/ladv.service'
import { parseLadvIdFromUrl } from '~~/server/utils/ladv'
import { notify } from '~~/server/notifications/service'
import { recipients } from '~~/server/notifications/recipients'
import { buildEventPayload } from '~~/server/notifications/payload-helpers'

const importSchema = z.object({
  url: z.string().url('Ungültige URL'),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)
  const result = importSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Validierungsfehler' })
  }

  const ladvId = parseLadvIdFromUrl(result.data.url)
  if (!ladvId) {
    throw createError({ statusCode: 400, statusMessage: 'Keine LADV-ID in der URL gefunden. Erwartet: https://ladv.de/ausschreibung/detail/[ID]/...' })
  }

  const existing = await db.query.events.findFirst({
    where: eq(schema.events.ladvId, ladvId),
    columns: { id: true },
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ein Event mit dieser LADV-ID existiert bereits.',
      data: { existingEventId: encodeEventId(existing.id) },
    })
  }

  const service = new LadvService()
  let normalized: Awaited<ReturnType<LadvService['fetchAusschreibung']>>
  try {
    normalized = await service.fetchAusschreibung(ladvId)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    throw createError({ statusCode: 502, statusMessage: `LADV-API nicht erreichbar: ${message}` })
  }

  const now = new Date()

  const inserted = await db.insert(schema.events).values({
    type: 'ladv' as const,
    name: normalized.name,
    date: normalized.date,
    startTime: normalized.start_time,
    location: normalized.location,
    registrationDeadline: normalized.registration_deadline,
    raceType: normalized.race_type,
    isWrc: normalized.is_wrc,
    ladvId,
    ladvData: normalized.ladv_data,
    ladvLastSync: now,
    createdBy: session.user.id,
    createdAt: now,
    updatedAt: now,
  }).returning({ id: schema.events.id })

  const newId = inserted[0]!.id

  try {
    const siteUrl = useRuntimeConfig().public.siteUrl
    await notify({
      type: 'new_event',
      recipients: await recipients.allMembers(),
      actorUserId: session.user.id,
      payload: buildEventPayload({
        id: newId,
        name: normalized.name,
        date: normalized.date,
        location: normalized.location,
        registrationDeadline: normalized.registration_deadline,
      }, siteUrl),
      eventId: newId,
    })
  }
  catch (err) {
    console.error('[Notification] new_event:', err)
  }

  setResponseStatus(event, 201)
  return { id: encodeEventId(newId) }
})
