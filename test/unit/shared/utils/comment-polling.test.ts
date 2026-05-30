import { describe, it, expect } from 'vitest'
import { commentCursor, mergeComments } from '../../../../shared/utils/comment-polling'

describe('commentCursor', () => {
  it('returns the latest createdAt of the comments', () => {
    const comments = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z') },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z') },
      { id: 3, createdAt: new Date('2026-05-30T10:02:00Z') },
    ]
    expect(commentCursor(comments)).toEqual(new Date('2026-05-30T10:05:00Z'))
  })

  it('returns undefined for an empty list', () => {
    expect(commentCursor([])).toBeUndefined()
  })

  it('parses ISO string dates (JSON-deserialised over the wire)', () => {
    const comments = [
      { id: 1, createdAt: '2026-05-30T10:00:00Z' },
      { id: 2, createdAt: '2026-05-30T10:05:00Z' },
    ]
    expect(commentCursor(comments)).toEqual(new Date('2026-05-30T10:05:00Z'))
  })
})

describe('mergeComments', () => {
  it('appends new comments, keeping ascending order', () => {
    const existing = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z') },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z') },
    ]
    const incoming = [
      { id: 3, createdAt: new Date('2026-05-30T10:10:00Z') },
    ]
    expect(mergeComments(existing, incoming).map(c => c.id)).toEqual([1, 2, 3])
  })

  it('dedupes by id when incoming overlaps existing', () => {
    const existing = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z') },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z') },
    ]
    const incoming = [
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z') },
      { id: 3, createdAt: new Date('2026-05-30T10:10:00Z') },
    ]
    expect(mergeComments(existing, incoming).map(c => c.id)).toEqual([1, 2, 3])
  })

  it('returns the incoming comments when existing is empty', () => {
    const incoming = [
      { id: 1, createdAt: new Date('2026-05-30T10:00:00Z') },
      { id: 2, createdAt: new Date('2026-05-30T10:05:00Z') },
    ]
    expect(mergeComments([], incoming).map(c => c.id)).toEqual([1, 2])
  })
})
