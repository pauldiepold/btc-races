import { describe, it, expect } from 'vitest'
import {
  validateInitialStatus,
  requiresWishDisciplinesForLadvMeldung,
  isDeadlineEnforcedFor,
} from '../../../server/registration/rules'
import { RegistrationError } from '../../../server/registration/errors'
import type { Actor } from '../../../server/registration/actor'
import type { EventType } from '../../../shared/utils/registration'

const SELF: Actor = { kind: 'self', userId: 1, hasLadvStartpass: true }
const ADMIN: Actor = { kind: 'admin', userId: 99 }

describe('validateInitialStatus', () => {
  describe('Default ohne Request', () => {
    it.each([
      ['ladv', 'registered'],
      ['competition', 'registered'],
      ['training', 'yes'],
      ['social', 'yes'],
    ] as const)('%s → %s', (type, expected) => {
      expect(validateInitialStatus(type)).toBe(expected)
    })
  })

  describe('Erlaubte Statuses werden zurückgegeben', () => {
    it('ladv: registered', () => {
      expect(validateInitialStatus('ladv', 'registered')).toBe('registered')
    })
    it.each(['registered', 'maybe'] as const)('competition: %s', (s) => {
      expect(validateInitialStatus('competition', s)).toBe(s)
    })
    it.each(['yes', 'maybe', 'no'] as const)('training: %s', (s) => {
      expect(validateInitialStatus('training', s)).toBe(s)
    })
    it.each(['yes', 'maybe', 'no'] as const)('social: %s', (s) => {
      expect(validateInitialStatus('social', s)).toBe(s)
    })
  })

  describe('Strict-Fehler bei nicht erlaubtem Status', () => {
    const cases: Array<[EventType, 'registered' | 'maybe' | 'yes' | 'no' | 'canceled']> = [
      ['ladv', 'maybe'],
      ['ladv', 'no'],
      ['ladv', 'yes'],
      ['ladv', 'canceled'],
      ['competition', 'no'],
      ['competition', 'yes'],
      ['competition', 'canceled'],
      ['training', 'registered'],
      ['training', 'canceled'],
      ['social', 'registered'],
      ['social', 'canceled'],
    ]

    it.each(cases)('%s + %s wirft invalid_initial_status', (type, status) => {
      try {
        validateInitialStatus(type, status)
        expect.fail('Expected RegistrationError to be thrown')
      }
      catch (err) {
        expect(err).toBeInstanceOf(RegistrationError)
        expect((err as RegistrationError).code).toBe('invalid_initial_status')
      }
    })
  })
})

describe('requiresWishDisciplinesForLadvMeldung', () => {
  it('ladv ohne Disziplinen → true', () => {
    expect(requiresWishDisciplinesForLadvMeldung('ladv', [])).toBe(true)
    expect(requiresWishDisciplinesForLadvMeldung('ladv', null)).toBe(true)
    expect(requiresWishDisciplinesForLadvMeldung('ladv', undefined)).toBe(true)
  })

  it('ladv mit Disziplin → false', () => {
    expect(requiresWishDisciplinesForLadvMeldung('ladv', [{ discipline: '100', ageClass: 'M' }])).toBe(false)
  })

  it.each(['competition', 'training', 'social'] as const)('%s → false (egal welche Disziplinen)', (type) => {
    expect(requiresWishDisciplinesForLadvMeldung(type, null)).toBe(false)
    expect(requiresWishDisciplinesForLadvMeldung(type, [])).toBe(false)
    expect(requiresWishDisciplinesForLadvMeldung(type, [{ discipline: '100', ageClass: 'M' }])).toBe(false)
  })
})

describe('isDeadlineEnforcedFor', () => {
  describe('Admin → immer false (Bypass)', () => {
    const types: EventType[] = ['ladv', 'competition', 'training', 'social']
    const actions = ['create', 'change', 'cancel', 'change-wish'] as const
    for (const type of types) {
      for (const action of actions) {
        it(`admin × ${type} × ${action} → false`, () => {
          expect(isDeadlineEnforcedFor(ADMIN, type, action)).toBe(false)
        })
      }
    }
  })

  describe('Self', () => {
    it('cancel → immer false', () => {
      for (const type of ['ladv', 'competition', 'training', 'social'] as const) {
        expect(isDeadlineEnforcedFor(SELF, type, 'cancel')).toBe(false)
      }
    })

    it('create + ladv/competition → true', () => {
      expect(isDeadlineEnforcedFor(SELF, 'ladv', 'create')).toBe(true)
      expect(isDeadlineEnforcedFor(SELF, 'competition', 'create')).toBe(true)
    })

    it('create + training/social → false', () => {
      expect(isDeadlineEnforcedFor(SELF, 'training', 'create')).toBe(false)
      expect(isDeadlineEnforcedFor(SELF, 'social', 'create')).toBe(false)
    })

    it('change + ladv/competition → true', () => {
      expect(isDeadlineEnforcedFor(SELF, 'ladv', 'change')).toBe(true)
      expect(isDeadlineEnforcedFor(SELF, 'competition', 'change')).toBe(true)
    })

    it('change + training/social → false', () => {
      expect(isDeadlineEnforcedFor(SELF, 'training', 'change')).toBe(false)
      expect(isDeadlineEnforcedFor(SELF, 'social', 'change')).toBe(false)
    })

    it('change-wish + ladv → true', () => {
      expect(isDeadlineEnforcedFor(SELF, 'ladv', 'change-wish')).toBe(true)
    })

    it('change-wish + non-ladv → false', () => {
      for (const type of ['competition', 'training', 'social'] as const) {
        expect(isDeadlineEnforcedFor(SELF, type, 'change-wish')).toBe(false)
      }
    })
  })
})
