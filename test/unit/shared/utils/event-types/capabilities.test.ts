import { describe, it, expect } from 'vitest'
import { eventTypeCapabilities, getEventTypesByCategory, getEventTypesWith, getPublicEventTypes, getValidInitialStatuses } from '../../../../../shared/utils/event-types/capabilities'
import { EVENT_CATEGORIES } from '../../../../../shared/utils/registration'
import type { EventType } from '../../../../../shared/utils/registration'

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
  it.each(allTypes)('%s: getValidInitialStatuses enthält status.initial', (type) => {
    expect(getValidInitialStatuses(type)).toContain(eventTypeCapabilities[type].status.initial)
  })

  it('ladv: nur registered (Coach-Commitment, kein Nein initial)', () => {
    expect(getValidInitialStatuses('ladv')).toEqual(['registered'])
  })

  it.each(['competition', 'ladv_external'] as EventType[])('%s: registered, maybe und no initial möglich (Tracking)', (type) => {
    expect(getValidInitialStatuses(type).sort()).toEqual(['maybe', 'no', 'registered'])
  })

  it.each(['training', 'social'] as EventType[])('%s: yes, maybe und no initial möglich', (type) => {
    expect(getValidInitialStatuses(type).sort()).toEqual(['maybe', 'no', 'yes'])
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

  it('enthält ladv, ladv_external und competition (Snapshot)', () => {
    expect(getPublicEventTypes().sort()).toEqual(['competition', 'ladv', 'ladv_external'])
  })
})

describe('getEventTypesByCategory', () => {
  it.each(EVENT_CATEGORIES)('%s: liefert nur Typen mit passender category', (category) => {
    for (const t of getEventTypesByCategory(category)) {
      expect(eventTypeCapabilities[t].category).toBe(category)
    }
  })

  it('jeder Event-Typ taucht in genau seiner Kategorie auf', () => {
    for (const t of allTypes) {
      const category = eventTypeCapabilities[t].category
      expect(getEventTypesByCategory(category)).toContain(t)
    }
  })

  it('competition-Kategorie umfasst ladv, ladv_external und competition (Snapshot)', () => {
    expect(getEventTypesByCategory('competition').sort()).toEqual(['competition', 'ladv', 'ladv_external'])
  })
})

describe('getEventTypesWith', () => {
  it('liefert nur Typen mit gesetzter Capability', () => {
    for (const t of getEventTypesWith('hasLadvStandManagement')) {
      expect(eventTypeCapabilities[t].hasLadvStandManagement).toBe(true)
    }
  })

  it('hasLadvStandManagement ergibt nur ladv (Snapshot)', () => {
    expect(getEventTypesWith('hasLadvStandManagement')).toEqual(['ladv'])
  })
})
