import { describe, expect, it } from 'vitest'
import { decodeEventId, encodeEventId } from '../../server/utils/sqids'

describe('encodeEventId / decodeEventId', () => {
  it('encodes and decodes a round-trip correctly', () => {
    const id = 42
    const sqid = encodeEventId(id)
    expect(decodeEventId(sqid)).toBe(id)
  })

  it('encoded string has minimum length of 4', () => {
    expect(encodeEventId(1).length).toBeGreaterThanOrEqual(4)
    expect(encodeEventId(999_999).length).toBeGreaterThanOrEqual(4)
  })

  it('encoded string uses only characters from the custom alphabet', () => {
    const ALPHABET = 'wrnkstbhpmafdcgejuvz'
    const sqid = encodeEventId(123)
    for (const char of sqid) {
      expect(ALPHABET).toContain(char)
    }
  })

  it('different IDs produce different sqids', () => {
    expect(encodeEventId(1)).not.toBe(encodeEventId(2))
    expect(encodeEventId(100)).not.toBe(encodeEventId(101))
  })

  it('returns null for an empty/invalid sqid', () => {
    expect(decodeEventId('')).toBeNull()
  })

  it('produces stable/deterministic output', () => {
    const sqid = encodeEventId(7)
    expect(encodeEventId(7)).toBe(sqid)
  })
})
