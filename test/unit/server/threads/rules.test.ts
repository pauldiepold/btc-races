import { describe, it, expect } from 'vitest'
import type { Comment, Thread } from '~~/shared/types/threads'
import {
  canCreateInAnyRoom,
  canCreateThread,
  canDeleteComment,
  canDeleteThread,
  canEditComment,
  canEditThread,
  canPinComment,
  getRoom,
  type ThreadActor,
} from '~~/server/threads'

const AUTHOR_ID = 1
const OTHER_ID = 2

function selfActor(userId = AUTHOR_ID): ThreadActor {
  return { kind: 'self', userId }
}

function adminActor(userId = 99): ThreadActor {
  return { kind: 'admin', userId }
}

/** Ein Beitrag (Thread ohne Event-Bezug), default vom AUTHOR_ID angelegt. */
function thread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: 1,
    roomSlug: 'training',
    title: 'Titel',
    body: 'Body',
    eventId: null,
    lastActivityAt: new Date('2026-01-01'),
    deletedAt: null,
    createdBy: AUTHOR_ID,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

/** Ein Kommentar, default vom AUTHOR_ID verfasst. */
function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    threadId: 1,
    userId: AUTHOR_ID,
    body: 'Body',
    pinnedAt: null,
    pinnedBy: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
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

describe('canEditThread', () => {
  it('lets the author edit their own Beitrag', () => {
    expect(canEditThread(selfActor(AUTHOR_ID), thread())).toBe(true)
  })

  it('lets an admin edit a foreign Beitrag', () => {
    expect(canEditThread(adminActor(), thread({ createdBy: AUTHOR_ID }))).toBe(true)
  })

  it('forbids a non-author non-admin from editing', () => {
    expect(canEditThread(selfActor(OTHER_ID), thread({ createdBy: AUTHOR_ID }))).toBe(false)
  })

  it('forbids editing a soft-deleted Beitrag', () => {
    expect(
      canEditThread(selfActor(AUTHOR_ID), thread({ deletedAt: new Date() })),
    ).toBe(false)
    expect(
      canEditThread(adminActor(), thread({ deletedAt: new Date() })),
    ).toBe(false)
  })

  it('forbids editing an Event-Thread (no editable title/body)', () => {
    expect(
      canEditThread(selfActor(AUTHOR_ID), thread({ eventId: 42 })),
    ).toBe(false)
    expect(canEditThread(adminActor(), thread({ eventId: 42 }))).toBe(false)
  })
})

describe('canDeleteThread', () => {
  it('lets the author delete their own Beitrag', () => {
    expect(canDeleteThread(selfActor(AUTHOR_ID), thread())).toBe(true)
  })

  it('lets an admin delete a foreign Beitrag', () => {
    expect(canDeleteThread(adminActor(), thread({ createdBy: AUTHOR_ID }))).toBe(true)
  })

  it('forbids a non-author non-admin from deleting', () => {
    expect(canDeleteThread(selfActor(OTHER_ID), thread({ createdBy: AUTHOR_ID }))).toBe(false)
  })

  it('forbids deleting an already-deleted Beitrag', () => {
    expect(
      canDeleteThread(adminActor(), thread({ deletedAt: new Date() })),
    ).toBe(false)
  })

  it('forbids deleting an Event-Thread', () => {
    expect(canDeleteThread(adminActor(), thread({ eventId: 42 }))).toBe(false)
  })
})

describe('canEditComment', () => {
  it('lets the author edit their own comment', () => {
    expect(canEditComment(selfActor(AUTHOR_ID), comment())).toBe(true)
  })

  it('forbids an admin from editing a foreign comment (admins delete but do not rewrite)', () => {
    expect(canEditComment(adminActor(), comment({ userId: AUTHOR_ID }))).toBe(false)
  })

  it('forbids a different member from editing the comment', () => {
    expect(canEditComment(selfActor(OTHER_ID), comment({ userId: AUTHOR_ID }))).toBe(false)
  })

  it('forbids editing a soft-deleted comment', () => {
    expect(
      canEditComment(selfActor(AUTHOR_ID), comment({ deletedAt: new Date() })),
    ).toBe(false)
  })
})

describe('canPinComment', () => {
  it('lets an admin pin any comment in any thread', () => {
    expect(canPinComment(adminActor(), thread(), comment({ userId: OTHER_ID }), 0)).toBe(true)
  })

  it('lets the thread author pin a comment in their thread (covers Event-Threads too — thread.createdBy is the event author)', () => {
    expect(
      canPinComment(selfActor(AUTHOR_ID), thread({ createdBy: AUTHOR_ID }), comment({ userId: OTHER_ID }), 0),
    ).toBe(true)
  })

  it('forbids a non-author non-admin from pinning', () => {
    expect(
      canPinComment(selfActor(OTHER_ID), thread({ createdBy: AUTHOR_ID }), comment(), 0),
    ).toBe(false)
  })

  it('forbids pinning a soft-deleted comment', () => {
    expect(
      canPinComment(adminActor(), thread(), comment({ deletedAt: new Date() }), 0),
    ).toBe(false)
  })

  it('forbids pinning a new comment once the thread already has 3 pinned', () => {
    expect(canPinComment(adminActor(), thread(), comment(), 3)).toBe(false)
  })

  it('allows unpinning a pinned comment even when the limit is reached', () => {
    expect(
      canPinComment(adminActor(), thread(), comment({ pinnedAt: new Date(), pinnedBy: 99 }), 3),
    ).toBe(true)
  })
})

describe('canDeleteComment', () => {
  it('lets the author delete their own comment', () => {
    expect(canDeleteComment(selfActor(AUTHOR_ID), comment())).toBe(true)
  })

  it('lets an admin delete a foreign comment', () => {
    expect(canDeleteComment(adminActor(), comment({ userId: AUTHOR_ID }))).toBe(true)
  })

  it('forbids a different member from deleting the comment', () => {
    expect(canDeleteComment(selfActor(OTHER_ID), comment({ userId: AUTHOR_ID }))).toBe(false)
  })

  it('forbids deleting an already-deleted comment', () => {
    expect(
      canDeleteComment(adminActor(), comment({ deletedAt: new Date() })),
    ).toBe(false)
  })
})
