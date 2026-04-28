import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import type { EventType, RegistrationStatus } from '~~/shared/utils/registration'
import { getInitialStatus } from '~~/shared/utils/registration'

export type AdminRegisterInput = {
  status?: string
  disciplines?: RegistrationDisciplinePair[]
}

export type AdminRegisterValidationResult
  = | { ok: true, status: RegistrationStatus, wishDisciplines: RegistrationDisciplinePair[] }
    | { ok: false, error: string }

const VALID_INITIAL: Record<EventType, RegistrationStatus[]> = {
  ladv: ['registered'],
  competition: ['registered', 'maybe'],
  training: ['yes', 'maybe', 'no'],
  social: ['yes', 'maybe', 'no'],
}

// Pure: validiert das Body-Payload für POST /api/events/[id]/admin-register
// und liefert den effektiven Status + die zu speichernden Wunsch-Disziplinen.
// Keine DB, kein HTTP — der Endpoint übersetzt Fehler in createError.
export function validateAdminRegistration(
  eventType: EventType,
  input: AdminRegisterInput,
): AdminRegisterValidationResult {
  const allowed = VALID_INITIAL[eventType]

  if (input.status !== undefined && !allowed.includes(input.status as RegistrationStatus)) {
    return { ok: false, error: `Status "${input.status}" für Event-Typ "${eventType}" nicht erlaubt` }
  }

  const status = (input.status as RegistrationStatus | undefined) ?? getInitialStatus(eventType)

  if (eventType === 'ladv') {
    if (!input.disciplines || input.disciplines.length === 0) {
      return { ok: false, error: 'Mindestens eine Disziplin erforderlich' }
    }
    return { ok: true, status, wishDisciplines: input.disciplines }
  }

  return { ok: true, status, wishDisciplines: [] }
}
