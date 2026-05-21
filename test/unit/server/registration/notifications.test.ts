import { describe, it, expect } from 'vitest'
import {
  decideRegisterNotifications,
  decideStatusChangeNotifications,
  decideWishChangeNotifications,
  decideLadvStandNotifications,
} from '../../../../server/registration/notifications'
import type { Actor } from '../../../../server/registration/actor'
import type { RegistrationDisciplinePair } from '../../../../shared/types/db'

const SELF: Actor = { kind: 'self', userId: 1, hasLadvStartpass: true }
const ADMIN: Actor = { kind: 'admin', userId: 99 }
const D1: RegistrationDisciplinePair = { discipline: '100', ageClass: 'M' }
const D2: RegistrationDisciplinePair = { discipline: '200', ageClass: 'M' }

describe('decideRegisterNotifications', () => {
  describe('self', () => {
    it('ladv → registration_confirmation mit Wunsch- und LADV-Stand', () => {
      expect(decideRegisterNotifications(SELF, 'ladv', 1, false, [D1], null)).toEqual([
        { type: 'registration_confirmation', userId: 1, wishDisciplines: [D1], ladvDisciplines: null },
      ])
    })

    it('ladv → registration_confirmation reicht vorhandenen LADV-Stand durch', () => {
      expect(decideRegisterNotifications(SELF, 'ladv', 1, false, [D1, D2], [D1])).toEqual([
        { type: 'registration_confirmation', userId: 1, wishDisciplines: [D1, D2], ladvDisciplines: [D1] },
      ])
    })

    it.each(['competition', 'training', 'social'] as const)('%s → []', (type) => {
      expect(decideRegisterNotifications(SELF, type, 1, false, [], null)).toEqual([])
    })
  })

  describe('admin', () => {
    it('setLadvStand=true mit Disziplinen → ladv_registered', () => {
      expect(decideRegisterNotifications(ADMIN, 'ladv', 1, true, [D1], null)).toEqual([
        { type: 'ladv_registered', userId: 1, disciplines: [D1] },
      ])
    })

    it('setLadvStand=true ohne Disziplinen → admin_registered_member', () => {
      expect(decideRegisterNotifications(ADMIN, 'ladv', 1, true, [], null)).toEqual([
        { type: 'admin_registered_member', userId: 1, disciplines: [] },
      ])
    })

    it('setLadvStand=false → admin_registered_member', () => {
      expect(decideRegisterNotifications(ADMIN, 'ladv', 1, false, [D1], null)).toEqual([
        { type: 'admin_registered_member', userId: 1, disciplines: [D1] },
      ])
    })

    it.each(['competition', 'training', 'social'] as const)('%s → admin_registered_member', (type) => {
      expect(decideRegisterNotifications(ADMIN, type, 1, false, [], null)).toEqual([
        { type: 'admin_registered_member', userId: 1, disciplines: [] },
      ])
    })
  })
})

describe('decideStatusChangeNotifications', () => {
  it('self storniert nach LADV-Meldung → athlete_canceled_after_ladv mit LADV-Stand', () => {
    const reg = { userId: 1, ladvDisciplines: [D1] }
    expect(decideStatusChangeNotifications(SELF, reg, 'registered', 'canceled')).toEqual([
      { type: 'athlete_canceled_after_ladv', disciplines: [D1] },
    ])
  })

  it('self storniert ohne LADV-Meldung → []', () => {
    const reg = { userId: 1, ladvDisciplines: null }
    expect(decideStatusChangeNotifications(SELF, reg, 'registered', 'canceled')).toEqual([])
  })

  it('self setzt no nach LADV-Meldung → athlete_canceled_after_ladv mit LADV-Stand', () => {
    const reg = { userId: 1, ladvDisciplines: [D1] }
    expect(decideStatusChangeNotifications(SELF, reg, 'maybe', 'no')).toEqual([
      { type: 'athlete_canceled_after_ladv', disciplines: [D1] },
    ])
  })

  it('self ändert auf maybe (kein cancel) → []', () => {
    const reg = { userId: 1, ladvDisciplines: [D1] }
    expect(decideStatusChangeNotifications(SELF, reg, 'registered', 'maybe')).toEqual([])
  })

  it('admin ändert fremde Anmeldung → admin_changed_member_registration', () => {
    const reg = { userId: 1, ladvDisciplines: null }
    expect(decideStatusChangeNotifications(ADMIN, reg, 'registered', 'maybe')).toEqual([
      { type: 'admin_changed_member_registration', userId: 1 },
    ])
  })

  it('admin ändert fremd + silent → []', () => {
    const reg = { userId: 1, ladvDisciplines: null }
    expect(decideStatusChangeNotifications(ADMIN, reg, 'registered', 'maybe', { silent: true })).toEqual([])
  })

  it('admin ändert eigene Anmeldung → []', () => {
    const reg = { userId: 99, ladvDisciplines: null }
    expect(decideStatusChangeNotifications(ADMIN, reg, 'registered', 'maybe')).toEqual([])
  })
})

describe('decideWishChangeNotifications', () => {
  it('Wunsch unverändert → []', () => {
    expect(decideWishChangeNotifications([D1], [D1], [D1])).toEqual([])
  })

  it('LADV null → []', () => {
    expect(decideWishChangeNotifications([D1], [D1, D2], null)).toEqual([])
  })

  it('Wunsch ändert sich, Diff zu LADV → athlete_changed_after_ladv mit beiden Ständen', () => {
    expect(decideWishChangeNotifications([D1], [D1, D2], [D1])).toEqual([
      { type: 'athlete_changed_after_ladv', wishDisciplines: [D1, D2], ladvDisciplines: [D1] },
    ])
  })

  it('Wunsch ändert sich, kein Diff zu LADV → []', () => {
    expect(decideWishChangeNotifications([D1], [D1, D2], [D1, D2])).toEqual([])
  })
})

describe('decideLadvStandNotifications', () => {
  it('null → ladv_canceled mit vorherigem Stand', () => {
    expect(decideLadvStandNotifications(1, null, [D1])).toEqual([
      { type: 'ladv_canceled', userId: 1, disciplines: [D1] },
    ])
  })

  it('leeres Array → ladv_canceled mit vorherigem Stand', () => {
    expect(decideLadvStandNotifications(1, [], [D1, D2])).toEqual([
      { type: 'ladv_canceled', userId: 1, disciplines: [D1, D2] },
    ])
  })

  it('null + kein vorheriger Stand → ladv_canceled mit leerer Liste', () => {
    expect(decideLadvStandNotifications(1, null, null)).toEqual([
      { type: 'ladv_canceled', userId: 1, disciplines: [] },
    ])
  })

  it('mit Disziplinen → ladv_registered', () => {
    expect(decideLadvStandNotifications(1, [D1], null)).toEqual([
      { type: 'ladv_registered', userId: 1, disciplines: [D1] },
    ])
  })
})
