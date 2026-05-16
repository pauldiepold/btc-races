import { db } from 'hub:db'
import { requireAdmin } from '~~/server/utils/auth'
import { loadEventOrThrow } from '~~/server/utils/load-entity'
import { requireEventIdParam } from '~~/server/utils/route-params'
import { LadvService } from '~~/server/external-apis/ladv/ladv.service'
import { applyLadvSync } from '~~/server/events'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = requireEventIdParam(event)
  const dbEvent = await loadEventOrThrow(id)

  if (eventTypeCapabilities[dbEvent.type].source !== 'ladv') {
    throw createError({ statusCode: 400, statusMessage: 'Dieser Event-Typ wird nicht über LADV gepflegt' })
  }

  let normalized
  try {
    normalized = await new LadvService().fetchAusschreibung(dbEvent.ladvId!)
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'LADV nicht erreichbar' })
  }

  const result = await applyLadvSync(dbEvent, normalized, { db })

  return {
    id: encodeEventId(result.id),
    ladvDataChanged: result.ladvDataChanged,
    cancelled: result.cancelled,
  }
})
