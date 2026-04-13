import Sqids from 'sqids'

// Nur schöne Kleinbuchstaben — ohne l, o, q, x, y, i (zu ähnlich zu Ziffern oder unschön).
// minLength 4 statt 6 — kürzere URLs (z. B. /events/wrnk statt /events/wrnkst), ausreichend Kombinationen für Jahrzehnte.
const ALPHABET = 'wrnkstbhpmafdcgejuvz'

const sqids = new Sqids({ alphabet: ALPHABET, minLength: 4 })

export function encodeEventId(id: number): string {
  return sqids.encode([id])
}

export function decodeEventId(sqid: string): number | null {
  const numbers = sqids.decode(sqid)
  if (numbers.length === 0) return null
  return numbers[0] ?? null
}
