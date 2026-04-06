import { describe, it, expect } from 'vitest'
import { isDeadlineExpired } from '../../shared/utils/deadlines'

describe('isDeadlineExpired', () => {
  it('returns false when deadline is null', () => {
    expect(isDeadlineExpired(null)).toBe(false)
    expect(isDeadlineExpired(null, new Date())).toBe(false)
  })

  it('returns true when deadline is in the past', () => {
    const now = new Date('2026-04-06T12:00:00Z')
    const pastDeadline = new Date('2026-04-05T23:59:59Z')
    expect(isDeadlineExpired(pastDeadline, now)).toBe(true)
  })

  it('returns false when deadline is in the future', () => {
    const now = new Date('2026-04-06T12:00:00Z')
    const futureDeadline = new Date('2026-04-07T00:00:00Z')
    expect(isDeadlineExpired(futureDeadline, now)).toBe(false)
  })

  it('returns false when deadline equals exactly now (strict less-than)', () => {
    const now = new Date('2026-04-06T12:00:00Z')
    expect(isDeadlineExpired(now, now)).toBe(false)
  })

  it('returns true when deadline is one millisecond before now', () => {
    const now = new Date('2026-04-06T12:00:00.000Z')
    const oneMilliBefore = new Date('2026-04-06T11:59:59.999Z')
    expect(isDeadlineExpired(oneMilliBefore, now)).toBe(true)
  })
})
