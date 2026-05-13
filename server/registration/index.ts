export { RegistrationError } from './errors'
export type { RegistrationErrorCode } from './errors'

export type { Actor } from './actor'
export { assertSelfOwnsRegistration, assertAdmin } from './actor'

export { VALID_INITIAL, getInitialStatus, getValidNextStatuses } from './state'

export {
  validateInitialStatus,
  requiresWishDisciplinesForLadvMeldung,
  isDeadlineEnforcedFor,
} from './rules'
export type { DeadlineAction } from './rules'

export type { NotificationDecision } from './notifications'
export {
  decideRegisterNotifications,
  decideStatusChangeNotifications,
  decideAdminEditNotifications,
  decideWishChangeNotifications,
  decideLadvStandNotifications,
  decideLateRegistrationNotification,
  LATE_REGISTRATION_THRESHOLD_DAYS,
} from './notifications'

export { registerMember } from './register'
export type { RegisterMemberInput, RegisterMemberDeps, RegisterMemberResult } from './register'

export { changeRegistrationStatus } from './change-status'
export type {
  ChangeRegistrationStatusInput,
  ChangeRegistrationStatusDeps,
  ChangeRegistrationStatusOpts,
  ChangeRegistrationStatusResult,
} from './change-status'

export { updateRegistrationNotes } from './update-notes'
export type {
  UpdateRegistrationNotesInput,
  UpdateRegistrationNotesDeps,
  UpdateRegistrationNotesOpts,
  UpdateRegistrationNotesResult,
} from './update-notes'

export { changeWishDisciplines } from './change-wish-disciplines'
export type {
  ChangeWishDisciplinesInput,
  ChangeWishDisciplinesDeps,
  ChangeWishDisciplinesResult,
} from './change-wish-disciplines'

export { setLadvStand } from './set-ladv-stand'
export type {
  SetLadvStandInput,
  SetLadvStandDeps,
  SetLadvStandResult,
} from './set-ladv-stand'

export { errorToHttpStatus } from './http-error'

export type { AppDb, EventRow, UserRow, RegistrationRow } from './persistence'
