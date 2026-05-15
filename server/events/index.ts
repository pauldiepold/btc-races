export { EventError } from './errors'
export type { EventErrorCode } from './errors'

export { errorToHttpStatus } from './http-error'

export type { EventActor } from './actor'
export { isAdminActor } from './actor'

export type { AppDb, EventRow, EventInsert } from './persistence'

export { canSetPriority } from './rules'

export type { EventNotificationDecision } from './notifications'
export { decideChangeNotifications } from './notifications'

export { applyEventPatch } from './apply-patch'
export type {
  EventPatch,
  ApplyEventPatchDeps,
  ApplyEventPatchOpts,
  ApplyEventPatchResult,
} from './apply-patch'
