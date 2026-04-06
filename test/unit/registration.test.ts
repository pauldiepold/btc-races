import { describe, it, expect } from 'vitest'
import { getValidNextStatuses, getInitialStatus } from '../../shared/utils/registration'
import type { EventType, RegistrationStatus } from '../../shared/utils/registration'

describe('getInitialStatus', () => {
  it('returns registered for ladv events', () => {
    expect(getInitialStatus('ladv')).toBe('registered')
  })

  it('returns registered for competition events', () => {
    expect(getInitialStatus('competition')).toBe('registered')
  })

  it('returns yes for training events', () => {
    expect(getInitialStatus('training')).toBe('yes')
  })

  it('returns yes for social events', () => {
    expect(getInitialStatus('social')).toBe('yes')
  })
})

describe('getValidNextStatuses', () => {
  describe('ladv events (registered ↔ canceled)', () => {
    it('allows canceling when registered', () => {
      expect(getValidNextStatuses('registered', 'ladv')).toEqual(['canceled'])
    })

    it('allows re-registering when canceled', () => {
      expect(getValidNextStatuses('canceled', 'ladv')).toEqual(['registered'])
    })

    it('returns empty array for unexpected status', () => {
      expect(getValidNextStatuses('yes' as RegistrationStatus, 'ladv')).toEqual([])
    })
  })

  describe('competition events (registered ↔ maybe ↔ canceled)', () => {
    it('allows maybe and cancel when registered', () => {
      expect(getValidNextStatuses('registered', 'competition')).toEqual(['maybe', 'canceled'])
    })

    it('allows registered and cancel when maybe', () => {
      expect(getValidNextStatuses('maybe', 'competition')).toEqual(['registered', 'canceled'])
    })

    it('allows registered and maybe when canceled', () => {
      expect(getValidNextStatuses('canceled', 'competition')).toEqual(['registered', 'maybe'])
    })

    it('returns empty array for unexpected status', () => {
      expect(getValidNextStatuses('yes' as RegistrationStatus, 'competition')).toEqual([])
    })
  })

  describe('training events (yes ↔ maybe ↔ no)', () => {
    it('allows maybe and no when yes', () => {
      expect(getValidNextStatuses('yes', 'training')).toEqual(['maybe', 'no'])
    })

    it('allows yes and no when maybe', () => {
      expect(getValidNextStatuses('maybe', 'training')).toEqual(['yes', 'no'])
    })

    it('allows yes and maybe when no', () => {
      expect(getValidNextStatuses('no', 'training')).toEqual(['yes', 'maybe'])
    })
  })

  describe('social events (same state machine as training)', () => {
    it('allows maybe and no when yes', () => {
      expect(getValidNextStatuses('yes', 'social')).toEqual(['maybe', 'no'])
    })

    it('allows yes and no when maybe', () => {
      expect(getValidNextStatuses('maybe', 'social')).toEqual(['yes', 'no'])
    })

    it('allows yes and maybe when no', () => {
      expect(getValidNextStatuses('no', 'social')).toEqual(['yes', 'maybe'])
    })
  })

  describe('cross-checks: invalid statuses for event type', () => {
    it('registered status returns empty for training events', () => {
      expect(getValidNextStatuses('registered', 'training')).toEqual([])
    })

    it('yes status returns empty for ladv events', () => {
      expect(getValidNextStatuses('yes', 'ladv')).toEqual([])
    })
  })
})
