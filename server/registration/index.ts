export { RegistrationError } from './errors'
export type { RegistrationErrorCode } from './errors'

export type { Actor } from './actor'
export { assertSelfOwnsRegistration, assertAdmin } from './actor'

export { VALID_INITIAL, getInitialStatus, getValidNextStatuses } from './state'

export {
  validateInitialStatus,
  requiresLadvDisciplines,
  isDeadlineEnforcedFor,
} from './rules'
export type { DeadlineAction } from './rules'

export type { NotificationDecision } from './notifications'
export {
  decideRegisterNotifications,
  decideStatusChangeNotifications,
  decideWishChangeNotifications,
  decideLadvStandNotifications,
} from './notifications'
