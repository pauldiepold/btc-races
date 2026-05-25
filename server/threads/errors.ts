export type ThreadErrorCode
  = | 'forbidden'
    | 'room_not_found'
    | 'thread_not_found'
    | 'comment_not_found'
    | 'comment_too_long'
    | 'thread_too_long'
    | 'event_not_found'
    | 'pin_limit_reached'

export class ThreadError extends Error {
  readonly code: ThreadErrorCode

  constructor(code: ThreadErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'ThreadError'
    this.code = code
  }
}
