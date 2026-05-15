export type EventErrorCode
  = | 'event_not_found'
    | 'forbidden'
    | 'priority_not_allowed'
    | 'ladv_id_already_imported'

export type EventErrorData = {
  existingEventId?: number
}

export class EventError extends Error {
  readonly code: EventErrorCode
  readonly data?: EventErrorData

  constructor(code: EventErrorCode, message?: string, data?: EventErrorData) {
    super(message ?? code)
    this.name = 'EventError'
    this.code = code
    this.data = data
  }
}
