import { describe, it, expect } from 'vitest'
import { ROOMS, getRoom } from '~~/server/threads'

describe('ROOMS configuration', () => {
  it('defines exactly the five club rooms in order', () => {
    expect(ROOMS.map(r => r.slug)).toEqual([
      'announcements',
      'training',
      'team',
      'races',
      'social',
    ])
  })

  it('restricts the Ankündigungen room to admins and marks it mandatory', () => {
    const room = getRoom('announcements')!
    expect(room.allowedCreatorRoles).toEqual(['admin'])
    expect(room.mandatory).toBe(true)
  })

  it('lets every member create threads in the non-mandatory rooms', () => {
    for (const slug of ['training', 'team', 'races', 'social'] as const) {
      const room = getRoom(slug)!
      expect(room.allowedCreatorRoles).toEqual(['self', 'admin'])
      expect(room.mandatory).toBe(false)
    }
  })

  it('gives every room a human-readable title', () => {
    expect(getRoom('announcements')?.title).toBe('Ankündigungen')
    expect(getRoom('training')?.title).toBe('Training')
    expect(getRoom('team')?.title).toBe('Team')
    expect(getRoom('races')?.title).toBe('Races')
    expect(getRoom('social')?.title).toBe('Social')
  })
})

describe('getRoom', () => {
  it('returns the room config for a known slug', () => {
    expect(getRoom('training')?.slug).toBe('training')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getRoom('nonsense')).toBeUndefined()
  })
})
