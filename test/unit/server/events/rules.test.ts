import { describe, it, expect } from 'vitest'
import {
  canDeleteEvent,
  canModifyEvent,
  type EventActor,
  type EventRow,
} from '~~/server/events'

function makeEvent(createdBy: number | null): EventRow {
  return { id: 1, createdBy } as unknown as EventRow
}

function selfActor(userId: number): EventActor {
  return { kind: 'self', userId }
}

function adminActor(userId: number): EventActor {
  return { kind: 'admin', userId }
}

describe('canModifyEvent', () => {
  it('Admin darf fremdes Event modifizieren', () => {
    expect(canModifyEvent(adminActor(1), makeEvent(42))).toBe(true)
  })

  it('Admin darf eigenes Event modifizieren', () => {
    expect(canModifyEvent(adminActor(7), makeEvent(7))).toBe(true)
  })

  it('Self darf eigenes Event modifizieren', () => {
    expect(canModifyEvent(selfActor(5), makeEvent(5))).toBe(true)
  })

  it('Self darf fremdes Event NICHT modifizieren', () => {
    expect(canModifyEvent(selfActor(5), makeEvent(6))).toBe(false)
  })

  it('Self mit Event ohne createdBy darf nicht modifizieren', () => {
    expect(canModifyEvent(selfActor(5), makeEvent(null))).toBe(false)
  })
})

describe('canDeleteEvent', () => {
  it('Admin darf löschen', () => {
    expect(canDeleteEvent(adminActor(1))).toBe(true)
  })

  it('Self darf NICHT löschen', () => {
    expect(canDeleteEvent(selfActor(1))).toBe(false)
  })
})
