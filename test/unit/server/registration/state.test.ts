import { describe, it, expect } from 'vitest'
import {
  getInitialStatus,
  getValidNextStatuses,
  VALID_INITIAL,
} from '../../../../server/registration/state'
import type { RegistrationStatus } from '../../../../shared/utils/registration'

describe('getInitialStatus', () => {
  it.each([
    ['ladv', 'registered'],
    ['competition', 'registered'],
    ['training', 'yes'],
    ['social', 'yes'],
  ] as const)('%s → %s', (type, expected) => {
    expect(getInitialStatus(type)).toBe(expected)
  })
})

describe('VALID_INITIAL', () => {
  it('listet pro Typ die strict erlaubten Initial-Status', () => {
    expect(VALID_INITIAL).toEqual({
      ladv: ['registered'],
      ladv_external: ['registered', 'maybe'],
      competition: ['registered', 'maybe'],
      training: ['yes', 'maybe', 'no'],
      social: ['yes', 'maybe', 'no'],
    })
  })
})

describe('getValidNextStatuses', () => {
  describe('ladv (registered ↔ canceled)', () => {
    it('registered → [canceled]', () => {
      expect(getValidNextStatuses('registered', 'ladv')).toEqual(['canceled'])
    })
    it('canceled → [registered]', () => {
      expect(getValidNextStatuses('canceled', 'ladv')).toEqual(['registered'])
    })
    it('unbekannter Status → []', () => {
      expect(getValidNextStatuses('yes' as RegistrationStatus, 'ladv')).toEqual([])
    })
  })

  describe('competition (registered ↔ maybe ↔ no)', () => {
    it('registered → [maybe, no]', () => {
      expect(getValidNextStatuses('registered', 'competition')).toEqual(['maybe', 'no'])
    })
    it('maybe → [registered, no]', () => {
      expect(getValidNextStatuses('maybe', 'competition')).toEqual(['registered', 'no'])
    })
    it('no → [registered, maybe]', () => {
      expect(getValidNextStatuses('no', 'competition')).toEqual(['registered', 'maybe'])
    })
    it('unbekannter Status → []', () => {
      expect(getValidNextStatuses('yes' as RegistrationStatus, 'competition')).toEqual([])
    })
  })

  describe('training (yes ↔ maybe ↔ no)', () => {
    it('yes → [maybe, no]', () => {
      expect(getValidNextStatuses('yes', 'training')).toEqual(['maybe', 'no'])
    })
    it('maybe → [yes, no]', () => {
      expect(getValidNextStatuses('maybe', 'training')).toEqual(['yes', 'no'])
    })
    it('no → [yes, maybe]', () => {
      expect(getValidNextStatuses('no', 'training')).toEqual(['yes', 'maybe'])
    })
  })

  describe('social (gleiche Maschine wie training)', () => {
    it('yes → [maybe, no]', () => {
      expect(getValidNextStatuses('yes', 'social')).toEqual(['maybe', 'no'])
    })
    it('maybe → [yes, no]', () => {
      expect(getValidNextStatuses('maybe', 'social')).toEqual(['yes', 'no'])
    })
    it('no → [yes, maybe]', () => {
      expect(getValidNextStatuses('no', 'social')).toEqual(['yes', 'maybe'])
    })
  })

  describe('Cross-Checks: Status passt nicht zum Typ', () => {
    it('registered für training → []', () => {
      expect(getValidNextStatuses('registered', 'training')).toEqual([])
    })
    it('yes für ladv → []', () => {
      expect(getValidNextStatuses('yes', 'ladv')).toEqual([])
    })
    it('canceled für competition → []', () => {
      expect(getValidNextStatuses('canceled', 'competition')).toEqual([])
    })
  })
})
