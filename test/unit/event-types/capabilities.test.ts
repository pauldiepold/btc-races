import { describe, it, expect } from 'vitest'
import { eventTypeCapabilities, getPublicEventTypes } from '../../../shared/utils/event-types/capabilities'
import type { EventType } from '../../../shared/utils/registration'

const allTypes = Object.keys(eventTypeCapabilities) as EventType[]

describe('eventTypeCapabilities — Invarianten', () => {
  it.each(allTypes)('%s: hasLadvStandManagement impliziert hasWishDisciplines', (type) => {
    const c = eventTypeCapabilities[type]
    if (c.hasLadvStandManagement) expect(c.hasWishDisciplines).toBe(true)
  })

  it.each(allTypes)('%s: hasLadvStandManagement impliziert source === "ladv"', (type) => {
    const c = eventTypeCapabilities[type]
    if (c.hasLadvStandManagement) expect(c.source).toBe('ladv')
  })

  it.each(allTypes)('%s: enforcesDeadline impliziert showsRegistrationDeadline', (type) => {
    const c = eventTypeCapabilities[type]
    if (c.enforcesDeadline) expect(c.showsRegistrationDeadline).toBe(true)
  })
})

describe('eventTypeCapabilities — Status-Konsistenz', () => {
  it.each(allTypes)('%s: status.initial ∈ status.validInitial', (type) => {
    const c = eventTypeCapabilities[type]
    expect(c.status.validInitial).toContain(c.status.initial)
  })

  it.each(allTypes)('%s: jeder validNext-Key ist ein gültiger RegistrationStatus-Quellzustand', (type) => {
    const c = eventTypeCapabilities[type]
    const initialSources = Object.keys(c.status.validNext)
    for (const src of initialSources) {
      // jeder Zielzustand sollte auch als Source-Key existieren (symmetrische Reachability)
      const targets = c.status.validNext[src as keyof typeof c.status.validNext] ?? []
      for (const t of targets) {
        expect(Object.keys(c.status.validNext)).toContain(t)
      }
    }
  })
})

describe('getPublicEventTypes', () => {
  it('liefert nur Typen mit isPubliclyVisible === true', () => {
    const publicTypes = getPublicEventTypes()
    for (const t of publicTypes) {
      expect(eventTypeCapabilities[t].isPubliclyVisible).toBe(true)
    }
    for (const t of allTypes) {
      if (!eventTypeCapabilities[t].isPubliclyVisible) {
        expect(publicTypes).not.toContain(t)
      }
    }
  })

  it('enthält ladv und competition (Snapshot)', () => {
    expect(getPublicEventTypes().sort()).toEqual(['competition', 'ladv'])
  })
})
