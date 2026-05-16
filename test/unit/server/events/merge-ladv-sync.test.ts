import { describe, expect, it } from 'vitest'
import { LADV_FIELD_RULES, mergeLadvSync } from '~~/server/events/merge-ladv-sync'
import type { EventRow } from '~~/server/events/persistence'
import { normalizeLadvData } from '~~/server/utils/ladv'
import type { LadvAusschreibung, NormalizedLadvData } from '~~/shared/types/ladv'

const JUNE_15_2024_BERLIN_MS = new Date('2024-06-15T00:00:00+02:00').getTime()
const AUG_01_2024_BERLIN_MS = new Date('2024-08-01T00:00:00+02:00').getTime()
const JUNE_20_2024_BERLIN_MS = new Date('2024-06-20T18:30:00+02:00').getTime()
const AUG_05_2024_BERLIN_MS = new Date('2024-08-05T00:00:00+02:00').getTime()

const BASE_RAW: LadvAusschreibung = {
  id: 42008,
  name: 'Abendsportfest Zehlendorf',
  sportstaette: 'Stadion Zehlendorf',
  meldAdresse: '',
  meldEmail: '',
  veranstalter: 'BTC Berlin',
  ausrichter: 'BTC Berlin',
  beschreibung: '',
  datum: JUNE_15_2024_BERLIN_MS,
  datumText: '15.06.2024',
  meldDatum: AUG_01_2024_BERLIN_MS,
  meldDatumText: '01.08.2024',
  abgesagt: false,
  url: 'https://ladv.de/ausschreibung/detail/42008/x.htm',
  tags: '',
  kategorien: ['bahn'],
  ort: { id: 1, name: 'Berlin', lv: 'BLV', land: 'DE', lng: 13.4, lat: 52.5 },
  veranstaltungen: [],
  lvs: '',
  landesverband: [],
  links: [],
  attachements: [],
  wettbewerbe: [],
}

const BASE_NORMALIZED: NormalizedLadvData = normalizeLadvData(BASE_RAW)

function buildEvent(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: 1,
    type: 'ladv',
    name: BASE_NORMALIZED.name,
    date: BASE_NORMALIZED.date,
    startTime: BASE_NORMALIZED.start_time,
    duration: null,
    location: BASE_NORMALIZED.location,
    description: null,
    registrationDeadline: BASE_NORMALIZED.registration_deadline,
    announcementLink: null,
    cancelledAt: null,
    raceType: BASE_NORMALIZED.race_type,
    championshipType: null,
    isWrc: BASE_NORMALIZED.is_wrc,
    priority: null,
    ladvId: BASE_RAW.id,
    ladvData: BASE_RAW,
    ladvLastSync: new Date('2024-06-01T00:00:00Z'),
    createdBy: null,
    createdAt: new Date('2024-06-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    ...overrides,
  } as EventRow
}

describe('LADV_FIELD_RULES — Klassifizierung', () => {
  const byMode = (mode: 'ladv-protected' | 'ladv-always') =>
    LADV_FIELD_RULES.filter(r => r.mode === mode).map(r => r.column)

  it('listet die protected Felder', () => {
    expect(byMode('ladv-protected').sort()).toEqual(
      ['date', 'location', 'name', 'raceType', 'registrationDeadline'],
    )
  })

  it('listet die always-Felder', () => {
    expect(byMode('ladv-always').sort()).toEqual(['isWrc', 'startTime'])
  })

  it('enthält keine Nicht-LADV-Felder (priority, championshipType, description, announcementLink)', () => {
    const columns = LADV_FIELD_RULES.map(r => r.column)
    for (const col of ['priority', 'championshipType', 'description', 'announcementLink']) {
      expect(columns).not.toContain(col)
    }
  })
})

describe('mergeLadvSync — ladv-protected ohne manuellen Override', () => {
  it('überschreibt name wenn DB-Wert = letzter LADV-Wert', () => {
    const dbEvent = buildEvent()
    const newRaw: LadvAusschreibung = { ...BASE_RAW, name: 'Neuer Name' }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.name).toBe('Neuer Name')
  })

  it('überschreibt date wenn DB-Wert = letzter LADV-Wert', () => {
    const dbEvent = buildEvent()
    const newRaw: LadvAusschreibung = { ...BASE_RAW, datum: JUNE_20_2024_BERLIN_MS }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.date).toBe('2024-06-20')
  })

  it('überschreibt location wenn DB-Wert = letzter LADV-Wert', () => {
    const dbEvent = buildEvent()
    const newRaw: LadvAusschreibung = {
      ...BASE_RAW,
      ort: { ...BASE_RAW.ort, name: 'Hamburg' },
      sportstaette: 'Hauptstadion',
    }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.location).toBe('Hamburg · Hauptstadion')
  })

  it('überschreibt registrationDeadline wenn DB-Wert = letzter LADV-Wert', () => {
    const dbEvent = buildEvent()
    const newRaw: LadvAusschreibung = { ...BASE_RAW, meldDatum: AUG_05_2024_BERLIN_MS }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.registrationDeadline).toBe('2024-08-05')
  })

  it('überschreibt raceType wenn DB-Wert = letzter LADV-Wert', () => {
    const dbEvent = buildEvent()
    const newRaw: LadvAusschreibung = { ...BASE_RAW, kategorien: ['strasse'] }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.raceType).toBe('road')
  })
})

describe('mergeLadvSync — ladv-protected mit manuellem Override', () => {
  it('überschreibt name NICHT wenn DB-Wert ≠ letzter LADV-Wert', () => {
    const dbEvent = buildEvent({ name: 'Manuell korrigierter Name' })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, name: 'Neuer LADV-Name' }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.name).toBeUndefined()
  })

  it('überschreibt date NICHT wenn DB-Wert ≠ letzter LADV-Wert', () => {
    const dbEvent = buildEvent({ date: '2024-07-01' })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, datum: JUNE_20_2024_BERLIN_MS }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.date).toBeUndefined()
  })

  it('überschreibt location NICHT wenn manuell überschrieben', () => {
    const dbEvent = buildEvent({ location: 'Manuell · Ort' })
    const newRaw: LadvAusschreibung = {
      ...BASE_RAW,
      ort: { ...BASE_RAW.ort, name: 'Hamburg' },
    }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.location).toBeUndefined()
  })

  it('überschreibt registrationDeadline NICHT wenn manuell überschrieben', () => {
    const dbEvent = buildEvent({ registrationDeadline: '2024-09-09' })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, meldDatum: AUG_05_2024_BERLIN_MS }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.registrationDeadline).toBeUndefined()
  })

  it('überschreibt raceType NICHT wenn manuell überschrieben', () => {
    const dbEvent = buildEvent({ raceType: 'trail' })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, kategorien: ['strasse'] }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.raceType).toBeUndefined()
  })
})

describe('mergeLadvSync — ladv-always', () => {
  it('übernimmt startTime auch wenn DB-Wert vom letzten LADV-Wert abweicht', () => {
    const dbEvent = buildEvent({ startTime: '14:00' })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, datum: JUNE_20_2024_BERLIN_MS }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.startTime).toBe('18:30')
  })

  it('übernimmt isWrc auch bei Abweichung', () => {
    const dbEvent = buildEvent({ isWrc: 0 })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, wrc: true }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.isWrc).toBe(1)
  })

  it('setzt isWrc auf 0 wenn LADV es zurücksetzt — auch wenn DB auf 1 stand', () => {
    const dbEvent = buildEvent({ isWrc: 1, ladvData: { ...BASE_RAW, wrc: true } })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, wrc: false }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.isWrc).toBe(0)
  })
})

describe('mergeLadvSync — Felder nicht in der Tabelle werden nie übernommen', () => {
  it('berührt priority, championshipType, description, announcementLink, duration nicht', () => {
    const dbEvent = buildEvent()
    const updates = mergeLadvSync(dbEvent, BASE_NORMALIZED) as Record<string, unknown>
    expect(updates).not.toHaveProperty('priority')
    expect(updates).not.toHaveProperty('championshipType')
    expect(updates).not.toHaveProperty('description')
    expect(updates).not.toHaveProperty('announcementLink')
    expect(updates).not.toHaveProperty('duration')
    expect(updates).not.toHaveProperty('ladvData')
    expect(updates).not.toHaveProperty('ladvLastSync')
    expect(updates).not.toHaveProperty('cancelledAt')
  })
})

describe('mergeLadvSync — fehlende ladvData (Erst-Sync ohne Snapshot)', () => {
  it('protected-Felder werden nicht überschrieben wenn kein letzter LADV-Snapshot vorliegt', () => {
    const dbEvent = buildEvent({ ladvData: null })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, name: 'Neuer Name' }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.name).toBeUndefined()
    expect(updates.date).toBeUndefined()
  })

  it('always-Felder werden auch ohne ladvData übernommen', () => {
    const dbEvent = buildEvent({ ladvData: null, isWrc: 0 })
    const newRaw: LadvAusschreibung = { ...BASE_RAW, wrc: true }
    const updates = mergeLadvSync(dbEvent, normalizeLadvData(newRaw))
    expect(updates.isWrc).toBe(1)
  })
})
