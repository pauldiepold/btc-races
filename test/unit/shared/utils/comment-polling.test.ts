import { describe, it, expect } from 'vitest'
import { commentCursor, mergeComments } from '../../../../shared/utils/comment-polling'

describe('commentCursor', () => {
  it('returns the latest updatedAt of the comments', () => {
    const comments = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z'), updatedAt: new Date('2026-05-30T10:00:00Z') },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z'), updatedAt: new Date('2026-05-30T10:05:00Z') },
      // jünger editiert als angelegt — der Cursor folgt updatedAt, nicht createdAt
      { id: 3, createdAt: new Date('2026-05-30T10:02:00Z'), updatedAt: new Date('2026-05-30T10:20:00Z') },
    ]
    expect(commentCursor(comments)).toEqual(new Date('2026-05-30T10:20:00Z'))
  })

  it('returns undefined for an empty list', () => {
    expect(commentCursor([])).toBeUndefined()
  })

  it('parses ISO string dates (JSON-deserialised over the wire)', () => {
    const comments = [
      { id: 1, createdAt: '2026-05-30T10:00:00Z', updatedAt: '2026-05-30T10:00:00Z' },
      { id: 2, createdAt: '2026-05-30T10:05:00Z', updatedAt: '2026-05-30T10:05:00Z' },
    ]
    expect(commentCursor(comments)).toEqual(new Date('2026-05-30T10:05:00Z'))
  })
})

describe('mergeComments', () => {
  it('appends new comments, keeping ascending createdAt order', () => {
    const existing = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z'), updatedAt: new Date('2026-05-30T10:00:00Z') },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z'), updatedAt: new Date('2026-05-30T10:05:00Z') },
    ]
    const incoming = [
      { id: 3, createdAt: new Date('2026-05-30T10:10:00Z'), updatedAt: new Date('2026-05-30T10:10:00Z') },
    ]
    expect(mergeComments(existing, incoming).map(c => c.id)).toEqual([1, 2, 3])
  })

  it('replaces by id when incoming overlaps existing (edit/delete/pin propagation)', () => {
    const existing = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z'), updatedAt: new Date('2026-05-30T10:00:00Z'), body: 'alt' },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z'), updatedAt: new Date('2026-05-30T10:05:00Z'), body: 'alt' },
    ]
    const incoming = [
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z'), updatedAt: new Date('2026-05-30T10:20:00Z'), body: 'neu' },
      { id: 3, createdAt: new Date('2026-05-30T10:10:00Z'), updatedAt: new Date('2026-05-30T10:10:00Z'), body: 'neu' },
    ]
    const merged = mergeComments(existing, incoming)
    expect(merged.map(c => c.id)).toEqual([1, 2, 3])
    // Bestandskommentar 2 trägt jetzt den frischen Body — nicht den alten.
    expect(merged.find(c => c.id === 2)?.body).toBe('neu')
  })

  it('keeps createdAt order even when an edited comment has a newer updatedAt', () => {
    const existing = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z'), updatedAt: new Date('2026-05-30T10:00:00Z') },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z'), updatedAt: new Date('2026-05-30T10:05:00Z') },
    ]
    const incoming = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z'), updatedAt: new Date('2026-05-30T10:30:00Z') },
    ]
    expect(mergeComments(existing, incoming).map(c => c.id)).toEqual([1, 2])
  })

  it('returns the incoming comments when existing is empty', () => {
    const incoming = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z'), updatedAt: new Date('2026-05-30T10:00:00Z') },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z'), updatedAt: new Date('2026-05-30T10:05:00Z') },
    ]
    expect(mergeComments([], incoming).map(c => c.id)).toEqual([1, 2])
  })
})
