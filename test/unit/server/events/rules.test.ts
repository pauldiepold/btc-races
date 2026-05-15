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

function ownerActor(userId: number): EventActor {
  return { kind: 'owner', userId }
}

function adminActor(userId: number, isSuperuser = false): EventActor {
  return { kind: 'admin', userId, isSuperuser }
}

describe('canModifyEvent', () => {
  it('Admin darf fremdes Event modifizieren', () => {
    expect(canModifyEvent(adminActor(1), makeEvent(42))).toBe(true)
  })

  it('Admin darf eigenes Event modifizieren', () => {
    expect(canModifyEvent(adminActor(7), makeEvent(7))).toBe(true)
  })

  it('Owner darf eigenes Event modifizieren', () => {
    expect(canModifyEvent(ownerActor(5), makeEvent(5))).toBe(true)
  })

  it('Owner darf fremdes Event NICHT modifizieren', () => {
    expect(canModifyEvent(ownerActor(5), makeEvent(6))).toBe(false)
  })

  it('Owner mit Event ohne createdBy darf nicht modifizieren', () => {
    expect(canModifyEvent(ownerActor(5), makeEvent(null))).toBe(false)
  })
})

describe('canDeleteEvent', () => {
  it('Superuser-Admin darf löschen', () => {
    expect(canDeleteEvent(adminActor(1, true))).toBe(true)
  })

  it('Admin ohne Superuser darf NICHT löschen', () => {
    expect(canDeleteEvent(adminActor(1, false))).toBe(false)
  })

  it('Owner darf NICHT löschen', () => {
    expect(canDeleteEvent(ownerActor(1))).toBe(false)
  })
})
