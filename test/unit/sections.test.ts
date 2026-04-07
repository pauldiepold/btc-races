import { describe, expect, it } from 'vitest'
import { resolveRole } from '../../server/utils/sections'

describe('resolveRole', () => {
  it('returns superuser for the hardcoded superuser email', () => {
    expect(resolveRole('paul@diepold.de', [])).toBe('superuser')
  })

  it('returns superuser even when superuser email is also in Coaches section', () => {
    expect(resolveRole('paul@diepold.de', ['Coaches'])).toBe('superuser')
  })

  it('returns admin when member of Coaches section', () => {
    expect(resolveRole('coach@btc-berlin.de', ['Coaches'])).toBe('admin')
  })

  it('returns admin when Coaches is one of multiple sections', () => {
    expect(resolveRole('coach@btc-berlin.de', ['Laufen', 'Coaches', 'Sprung'])).toBe('admin')
  })

  it('returns member for regular email with no relevant sections', () => {
    expect(resolveRole('member@btc-berlin.de', ['Laufen'])).toBe('member')
  })

  it('returns member for empty sections', () => {
    expect(resolveRole('member@btc-berlin.de', [])).toBe('member')
  })
})
