import type { ThreadErrorCode } from './errors'

const STATUS_BY_CODE: Record<ThreadErrorCode, number> = {
  forbidden: 403,
  room_not_found: 404,
  thread_not_found: 404,
  thread_deleted: 409,
  comment_not_found: 404,
  comment_too_long: 422,
  thread_too_long: 422,
  event_not_found: 404,
  pin_limit_reached: 422,
}

export function errorToHttpStatus(code: ThreadErrorCode): number {
  return STATUS_BY_CODE[code]
}
