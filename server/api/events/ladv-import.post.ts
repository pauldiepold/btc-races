import { db } from 'hub:db'
import { z } from 'zod'
import { LadvService } from '~~/server/external-apis/ladv/ladv.service'
import { parseLadvIdFromUrl } from '~~/server/utils/ladv'
import { parseBody } from '~~/server/utils/parse-body'
import { actorFromSession, importEventFromLadv, EventError, errorToHttpStatus } from '~~/server/events'

const importSchema = z.object({
  url: z.url('Ungültige URL'),
  eventType: z.enum(['ladv', 'ladv_external']),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const { url, eventType } = await parseBody(event, importSchema)

  const ladvId = parseLadvIdFromUrl(url)
  if (!ladvId) {
    throw createError({ statusCode: 400, statusMessage: 'Keine LADV-ID in der URL gefunden. Erwartet: https://ladv.de/ausschreibung/detail/[ID]/...' })
  }

  const service = new LadvService()
  let ladvData: Awaited<ReturnType<LadvService['fetchAusschreibung']>>
  try {
    ladvData = await service.fetchAusschreibung(ladvId)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    throw createError({ statusCode: 502, statusMessage: `LADV-API nicht erreichbar: ${message}` })
  }

  const actor = actorFromSession(session)

  // Eigenes try/catch (statt withEventErrorMapping), weil existingEventId aus
  // EventError.data per encodeEventId in HTTP-safe Form gebracht werden muss.
  // Siehe docs/adr/0001-domain-error-mapping.md.
  try {
    const { id } = await importEventFromLadv({ eventType, ladvId, ladvData }, actor, { db })
    setResponseStatus(event, 201)
    return { id: encodeEventId(id) }
  }
  catch (err) {
    if (err instanceof EventError) {
      if (err.code === 'ladv_id_already_imported' && err.data?.existingEventId != null) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Ein Event mit dieser LADV-ID existiert bereits.',
          data: { existingEventId: encodeEventId(err.data.existingEventId) },
        })
      }
      throw createError({ statusCode: errorToHttpStatus(err.code), statusMessage: err.message })
    }
    throw err
  }
})
