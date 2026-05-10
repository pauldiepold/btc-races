export type RegistrationErrorCode
  = | 'event_not_found'
    | 'event_canceled'
    | 'not_a_ladv_event'
    | 'inactive_member'
    | 'deadline_expired'
    | 'no_ladv_startpass'
    | 'already_registered'
    | 'registration_not_found'
    | 'forbidden'
    | 'no_ladv_disciplines'
    | 'invalid_initial_status'
    | 'invalid_status_transition'

export class RegistrationError extends Error {
  readonly code: RegistrationErrorCode

  constructor(code: RegistrationErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'RegistrationError'
    this.code = code
  }
}
