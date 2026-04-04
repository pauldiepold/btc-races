import { describe, expect, it } from 'vitest'
import { ADMIN_SECTIONS, hasAnySection, hasSection, isAdminSection } from '../../server/utils/sections'

describe('isAdminSection', () => {
  it('returns true for known admin sections', () => {
    for (const section of ADMIN_SECTIONS) {
      expect(isAdminSection(section)).toBe(true)
    }
  })

  it('returns false for regular sections', () => {
    expect(isAdminSection('Laufen')).toBe(false)
    expect(isAdminSection('Sprung')).toBe(false)
    expect(isAdminSection('')).toBe(false)
  })
})

describe('hasSection', () => {
  const user = { sections: ['Laufen', 'Vorstand'] } as any

  it('returns true if user has the section', () => {
    expect(hasSection(user, 'Laufen')).toBe(true)
    expect(hasSection(user, 'Vorstand')).toBe(true)
  })

  it('returns false if user does not have the section', () => {
    expect(hasSection(user, 'Sprung')).toBe(false)
  })

  it('returns false for empty sections list', () => {
    expect(hasSection({ sections: [] } as any, 'Laufen')).toBe(false)
  })
})

describe('hasAnySection', () => {
  const user = { sections: ['Laufen'] } as any

  it('returns true if user has at least one of the sections', () => {
    expect(hasAnySection(user, ['Laufen', 'Sprung'])).toBe(true)
  })

  it('returns false if user has none of the sections', () => {
    expect(hasAnySection(user, ['Sprung', 'Vorstand'])).toBe(false)
  })

  it('returns false for empty check list', () => {
    expect(hasAnySection(user, [])).toBe(false)
  })
})
