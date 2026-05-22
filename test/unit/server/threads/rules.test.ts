import { describe, it, expect } from 'vitest'
import {
  canCreateInAnyRoom,
  canCreateThread,
  getRoom,
  type ThreadActor,
} from '~~/server/threads'

function selfActor(userId = 1): ThreadActor {
  return { kind: 'self', userId }
}

function adminActor(userId = 1): ThreadActor {
  return { kind: 'admin', userId }
}

describe('canCreateThread', () => {
  it('lets an admin create a thread in the Ankündigungen room', () => {
    expect(canCreateThread(adminActor(), getRoom('announcements')!)).toBe(true)
  })

  it('forbids a member from creating a thread in the Ankündigungen room', () => {
    expect(canCreateThread(selfActor(), getRoom('announcements')!)).toBe(false)
  })

  it('lets a member create a thread in every open room', () => {
    for (const slug of ['training', 'team', 'races', 'social'] as const) {
      expect(canCreateThread(selfActor(), getRoom(slug)!)).toBe(true)
    }
  })

  it('lets an admin create a thread in the open rooms', () => {
    expect(canCreateThread(adminActor(), getRoom('training')!)).toBe(true)
  })
})

describe('canCreateInAnyRoom', () => {
  it('is true for a member — the open rooms are available to everyone', () => {
    expect(canCreateInAnyRoom(selfActor())).toBe(true)
  })

  it('is true for an admin', () => {
    expect(canCreateInAnyRoom(adminActor())).toBe(true)
  })
})
