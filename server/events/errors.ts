export type EventErrorCode
  = | 'event_not_found'
    | 'forbidden'
    | 'priority_not_allowed'

export class EventError extends Error {
  readonly code: EventErrorCode

  constructor(code: EventErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'EventError'
    this.code = code
  }
}
