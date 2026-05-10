import type { H3Event } from 'h3'
import { decodeEventId } from './sqids'

export function requireEventIdParam(event: H3Event): number {
  const sqid = getRouterParam(event, 'id')
  if (!sqid) {
    throw createError({ statusCode: 400, statusMessage: 'Fehlende Event-ID' })
  }
  const id = decodeEventId(sqid)
  if (id === null) {
    throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  }
  return id
}

export function requireNumericIdParam(event: H3Event, label: string, paramName = 'id'): number {
  const raw = getRouterParam(event, paramName)
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: `Fehlende ${label}` })
  }
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: `Ungültige ${label}` })
  }
  return id
}
