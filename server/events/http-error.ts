import type { EventErrorCode } from './errors'

const STATUS_BY_CODE: Record<EventErrorCode, number> = {
  event_not_found: 404,
  forbidden: 403,
  priority_not_allowed: 403,
  ladv_id_already_imported: 409,
}

export function errorToHttpStatus(code: EventErrorCode): number {
  return STATUS_BY_CODE[code]
}
