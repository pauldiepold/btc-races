import { makeDomainErrorMapping } from '~~/server/utils/domain-error'
import { EventError } from './errors'
import { errorToHttpStatus } from './http-error'

export { EventError } from './errors'
export type { EventErrorCode } from './errors'

export { errorToHttpStatus } from './http-error'

export const withEventErrorMapping = makeDomainErrorMapping(
  EventError,
  errorToHttpStatus,
)

export type { EventActor } from './actor'
export { selfActor, adminActor, actorFromSession } from './actor'

export type { AppDb, EventRow, EventInsert } from './persistence'

export { canDeleteEvent, canModifyEvent, canSetPriority } from './rules'

export type { EventNotificationDecision } from './notifications'
export {
  decideCancelNotifications,
  decideChangeNotifications,
  decideCreateNotifications,
} from './notifications'

export { applyEventPatch } from './apply-patch'
export type {
  EventPatch,
  ApplyEventPatchDeps,
  ApplyEventPatchOpts,
  ApplyEventPatchResult,
} from './apply-patch'

export { createManualEvent } from './create-manual'
export type {
  CreateManualEventInput,
  CreateManualEventDeps,
  CreateManualEventResult,
} from './create-manual'

export { importEventFromLadv } from './import-from-ladv'
export type {
  ImportEventFromLadvInput,
  ImportEventFromLadvDeps,
  ImportEventFromLadvResult,
} from './import-from-ladv'

export { LADV_FIELD_RULES, mergeLadvSync } from './merge-ladv-sync'
export type { LadvFieldMode, LadvFieldRule } from './merge-ladv-sync'

export { applyLadvSync } from './apply-ladv-sync'
export type {
  ApplyLadvSyncDeps,
  ApplyLadvSyncResult,
} from './apply-ladv-sync'

export { cancelEvent } from './cancel'
export type { CancelEventDeps, CancelEventResult } from './cancel'

export { uncancelEvent } from './uncancel'
export type { UncancelEventDeps, UncancelEventResult } from './uncancel'

export { deleteEvent } from './delete'
export type { DeleteEventDeps, DeleteEventResult } from './delete'
