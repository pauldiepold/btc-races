import type { RegistrationErrorCode } from './errors'

const STATUS_BY_CODE: Record<RegistrationErrorCode, number> = {
  event_not_found: 404,
  member_not_found: 404,
  registration_not_found: 404,
  forbidden: 403,
  no_ladv_startpass: 403,
  already_registered: 409,
  event_canceled: 422,
  inactive_member: 422,
  deadline_expired: 422,
  no_ladv_disciplines: 422,
  invalid_initial_status: 422,
  invalid_status_transition: 422,
  not_a_ladv_event: 422,
}

export function errorToHttpStatus(code: RegistrationErrorCode): number {
  return STATUS_BY_CODE[code]
}
