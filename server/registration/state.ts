// Status-Lifecycle wird zentral von shared/utils/event-types/capabilities.ts geliefert (SSOT).
// Diese Datei hält Backward-Compat-Exports für das registration-Modul.
import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import { EVENT_TYPES } from '~~/shared/utils/registration'
import { getValidInitialStatuses } from '~~/shared/utils/event-types/capabilities'

export { getInitialStatus, getValidNextStatuses } from '~~/shared/utils/registration'

export const VALID_INITIAL: Record<EventType, RegistrationStatus[]> = Object.fromEntries(
  EVENT_TYPES.map(type => [type, getValidInitialStatuses(type)]),
) as Record<EventType, RegistrationStatus[]>
