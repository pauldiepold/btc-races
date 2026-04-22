import { describe, it, expect } from 'vitest'
import { addDaysToIsoDate, todayIsoDate } from '../../shared/utils/reminder-dates'

describe('addDaysToIsoDate', () => {
  it('adds positive days within same month', () => {
    expect(addDaysToIsoDate('2026-04-22', 3)).toBe('2026-04-25')
  })

  it('handles month rollover', () => {
    expect(addDaysToIsoDate('2026-04-29', 5)).toBe('2026-05-04')
  })

  it('handles year rollover', () => {
    expect(addDaysToIsoDate('2026-12-30', 5)).toBe('2027-01-04')
  })

  it('handles leap year (2024)', () => {
    expect(addDaysToIsoDate('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDaysToIsoDate('2024-02-28', 2)).toBe('2024-03-01')
  })

  it('handles non-leap year (2026)', () => {
    expect(addDaysToIsoDate('2026-02-28', 1)).toBe('2026-03-01')
  })

  it('supports zero days', () => {
    expect(addDaysToIsoDate('2026-04-22', 0)).toBe('2026-04-22')
  })

  it('supports negative days', () => {
    expect(addDaysToIsoDate('2026-04-22', -5)).toBe('2026-04-17')
    expect(addDaysToIsoDate('2026-01-02', -3)).toBe('2025-12-30')
  })
})

describe('todayIsoDate', () => {
  it('returns YYYY-MM-DD for a given Date', () => {
    expect(todayIsoDate(new Date('2026-04-22T10:30:00Z'))).toBe('2026-04-22')
  })

  it('uses UTC (early-morning UTC stays on same day)', () => {
    expect(todayIsoDate(new Date('2026-04-22T00:00:00Z'))).toBe('2026-04-22')
  })

  it('uses UTC (late-evening UTC stays on same day)', () => {
    expect(todayIsoDate(new Date('2026-04-22T23:59:59Z'))).toBe('2026-04-22')
  })
})
