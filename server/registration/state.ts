// Status-Lifecycle wird zentral von shared/utils/event-types/capabilities.ts geliefert (SSOT).
// Diese Datei hält Backward-Compat-Exports für das registration-Modul.
import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'

export { getInitialStatus, getValidNextStatuses } from '~~/shared/utils/registration'

export const VALID_INITIAL: Record<EventType, RegistrationStatus[]> = Object.fromEntries(
  (Object.entries(eventTypeCapabilities) as Array<[EventType, typeof eventTypeCapabilities[EventType]]>)
    .map(([type, caps]) => [type, caps.status.validInitial]),
) as Record<EventType, RegistrationStatus[]>
