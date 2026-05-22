import type { ThreadErrorCode } from './errors'

const STATUS_BY_CODE: Record<ThreadErrorCode, number> = {
  forbidden: 403,
  room_not_found: 404,
}

export function errorToHttpStatus(code: ThreadErrorCode): number {
  return STATUS_BY_CODE[code]
}
