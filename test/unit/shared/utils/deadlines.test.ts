import { describe, it, expect } from 'vitest'
import { isDeadlineExpired } from '../../../../shared/utils/deadlines'

describe('isDeadlineExpired', () => {
  it('returns false when deadline is null', () => {
    expect(isDeadlineExpired(null)).toBe(false)
    expect(isDeadlineExpired(null, new Date())).toBe(false)
  })

  it('returns false on the deadline day (Berlin time, early morning)', () => {
    // Stichtag = 8.5.2026, jetzt = 03:00 Berlin am gleichen Tag (= 01:00 UTC bei CEST)
    const now = new Date('2026-05-08T01:00:00Z')
    expect(isDeadlineExpired('2026-05-08', now)).toBe(false)
  })

  it('returns false on the deadline day (Berlin time, late evening)', () => {
    // 23:30 Berlin am Stichtag (= 21:30 UTC bei CEST)
    const now = new Date('2026-05-08T21:30:00Z')
    expect(isDeadlineExpired('2026-05-08', now)).toBe(false)
  })

  it('returns true the day after the deadline (Berlin time)', () => {
    // 00:30 Berlin am Folgetag (= 22:30 UTC am Vortag bei CEST)
    const now = new Date('2026-05-08T22:30:00Z')
    expect(isDeadlineExpired('2026-05-08', now)).toBe(true)
  })

  it('returns false the day before the deadline', () => {
    const now = new Date('2026-05-07T15:00:00Z')
    expect(isDeadlineExpired('2026-05-08', now)).toBe(false)
  })

  it('handles Date input identically to string input', () => {
    const now = new Date('2026-05-08T12:00:00Z')
    const deadlineDate = new Date('2026-05-08T00:00:00Z')
    expect(isDeadlineExpired(deadlineDate, now)).toBe(false)
    expect(isDeadlineExpired('2026-05-08', now)).toBe(false)
  })

  it('handles ISO date-time strings (uses date portion only)', () => {
    const now = new Date('2026-05-08T12:00:00Z')
    expect(isDeadlineExpired('2026-05-08T23:59:59Z', now)).toBe(false)
    expect(isDeadlineExpired('2026-05-07T23:59:59Z', now)).toBe(true)
  })

  it('handles winter time (CET, UTC+1) correctly at day boundary', () => {
    // Deadline 8.1.2026, 23:30 Berlin (= 22:30 UTC bei CET)
    const beforeMidnight = new Date('2026-01-08T22:30:00Z')
    expect(isDeadlineExpired('2026-01-08', beforeMidnight)).toBe(false)

    // 00:30 Berlin am 9.1.2026 (= 23:30 UTC am 8.1. bei CET)
    const afterMidnight = new Date('2026-01-08T23:30:00Z')
    expect(isDeadlineExpired('2026-01-08', afterMidnight)).toBe(true)
  })
})
