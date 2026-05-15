import { describe, expect, it } from 'vitest'
import { generateEventOgDescription, isEventPublicDetail } from '../../shared/utils/events'
import type { EventDetail, EventPublicDetail } from '../../shared/types/events'

function baseEventFields() {
  return {
    id: 'evt-1',
    type: 'competition' as const,
    name: 'Test Event',
    date: '2025-06-15',
    startTime: null as string | null,
    duration: null as number | null,
    location: 'Berlin',
    description: null as string | null,
    registrationDeadline: null as string | null,
    announcementLink: null as string | null,
    cancelledAt: null as Date | null,
    raceType: null as 'track' | 'road' | 'trail' | null,
    championshipType: null as 'none' | 'bbm' | 'ndm' | 'dm' | null,
    isWrc: 0 as 0 | 1,
    priority: null as 'A' | 'B' | 'C' | null,
    ladvId: null as number | null,
    ladvLastSync: null as Date | null,
    createdBy: null as string | null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  }
}

describe('isEventPublicDetail', () => {
  it('returns true for EventPublicDetail (registrationCounts)', () => {
    const e: EventPublicDetail = {
      ...baseEventFields(),
      ladvData: null,
      registrationCounts: { registered: 3 },
    }
    expect(isEventPublicDetail(e)).toBe(true)
  })

  it('returns false for EventDetail (registrations array)', () => {
    const e: EventDetail = {
      ...baseEventFields(),
      ladvData: null,
      registrations: [],
    }
    expect(isEventPublicDetail(e)).toBe(false)
  })
})

describe('generateEventOgDescription', () => {
  it('formats date, location and excerpt', () => {
    const e: EventDetail = {
      ...baseEventFields(),
      date: '2025-06-15',
      location: 'Berlin',
      description: 'Kurzer Teaser fürs Event.',
      ladvData: null,
      registrations: [],
    }
    expect(generateEventOgDescription(e)).toMatch(/15\.06\.2025/)
    expect(generateEventOgDescription(e)).toContain('Berlin')
    expect(generateEventOgDescription(e)).toContain('Kurzer Teaser')
  })

  it('uses combined location string as-is (sportstaette is already merged at import)', () => {
    const e: EventPublicDetail = {
      ...baseEventFields(),
      location: 'Stadion XY · Berlin',
      ladvData: null,
      registrationCounts: {},
    }
    const s = generateEventOgDescription(e)
    expect(s).toContain('Stadion XY · Berlin')
  })

  it('handles null date, location and description with name fallback', () => {
    const e: EventDetail = {
      ...baseEventFields(),
      name: 'Nur der Name',
      date: null,
      location: null,
      description: null,
      ladvData: null,
      registrations: [],
    }
    expect(generateEventOgDescription(e)).toBe('Nur der Name')
  })

  it('uses generic fallback when name would be empty and other fields null', () => {
    const e: EventDetail = {
      ...baseEventFields(),
      name: '   ',
      date: null,
      location: null,
      description: null,
      ladvData: null,
      registrations: [],
    }
    expect(generateEventOgDescription(e)).toBe('Wettkampf – Berlin Track Club')
  })

  it('truncates long description', () => {
    const long = 'x'.repeat(200)
    const e: EventDetail = {
      ...baseEventFields(),
      date: null,
      location: null,
      description: long,
      ladvData: null,
      registrations: [],
    }
    const s = generateEventOgDescription(e)
    expect(s.length).toBeLessThanOrEqual(160)
    expect(s.endsWith('…')).toBe(true)
  })
})
