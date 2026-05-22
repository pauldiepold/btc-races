export type ThreadErrorCode
  = | 'forbidden'
    | 'room_not_found'

export class ThreadError extends Error {
  readonly code: ThreadErrorCode

  constructor(code: ThreadErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'ThreadError'
    this.code = code
  }
}
