import { describe, expect, it } from 'vitest'
import type { LadvAusschreibung } from '../../shared/types/ladv'
import { detectLadvDiff } from '../../shared/utils/ladv'

const JUNE_15_2024_BERLIN_MS = new Date('2024-06-15T00:00:00+02:00').getTime()
const AUG_01_2024_BERLIN_MS = new Date('2024-08-01T00:00:00+02:00').getTime()

const BASE_LADV: LadvAusschreibung = {
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
  url: 'https://ladv.de/ausschreibung/detail/42008/Abendsportfest-Berlin-Zehlendorf.htm',
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

const BASE_EVENT = {
  name: 'Abendsportfest Zehlendorf',
  date: new Date('2024-06-15T00:00:00+02:00'),
  location: 'Berlin',
  registrationDeadline: new Date('2024-08-01T00:00:00+02:00'),
  raceType: 'track' as const,
}

describe('detectLadvDiff', () => {
  it('returns empty object when all fields match', () => {
    expect(detectLadvDiff(BASE_EVENT, BASE_LADV)).toEqual({})
  })

  it('detects name difference', () => {
    const event = { ...BASE_EVENT, name: 'Anderer Name' }
    const diff = detectLadvDiff(event, BASE_LADV)
    expect(diff.name).toBe('Abendsportfest Zehlendorf')
    expect(Object.keys(diff)).toHaveLength(1)
  })

  it('detects location difference', () => {
    const event = { ...BASE_EVENT, location: 'Hamburg' }
    const diff = detectLadvDiff(event, BASE_LADV)
    expect(diff.location).toBe('Berlin')
  })

  it('detects date difference', () => {
    const event = { ...BASE_EVENT, date: new Date('2024-06-16T00:00:00+02:00') }
    const diff = detectLadvDiff(event, BASE_LADV)
    expect(diff.date).toBe('2024-06-15')
  })

  it('detects registrationDeadline difference', () => {
    const event = { ...BASE_EVENT, registrationDeadline: new Date('2024-07-01T00:00:00+02:00') }
    const diff = detectLadvDiff(event, BASE_LADV)
    expect(diff.registrationDeadline).toBe('2024-08-01')
  })

  it('detects raceType difference when stored is road but LADV has bahn', () => {
    const event = { ...BASE_EVENT, raceType: 'road' as const }
    const diff = detectLadvDiff(event, BASE_LADV) // BASE_LADV has kategorien: ['bahn']
    expect(diff.raceType).toBe('track')
  })

  it('detects no raceType diff when both match road', () => {
    const event = { ...BASE_EVENT, raceType: 'road' as const }
    const ladv = { ...BASE_LADV, kategorien: ['straße'] }
    expect(detectLadvDiff(event, ladv).raceType).toBeUndefined()
  })

  it('handles date as string in YYYY-MM-DD format', () => {
    const event = { ...BASE_EVENT, date: '2024-06-15' }
    expect(detectLadvDiff(event, BASE_LADV)).toEqual({})
  })

  it('handles null date in event as diff against LADV date', () => {
    const event = { ...BASE_EVENT, date: null }
    const diff = detectLadvDiff(event, BASE_LADV)
    expect(diff.date).toBe('2024-06-15')
  })

  it('handles null location in event as diff against LADV location', () => {
    const event = { ...BASE_EVENT, location: null }
    const diff = detectLadvDiff(event, BASE_LADV)
    expect(diff.location).toBe('Berlin')
  })

  it('detects multiple diffs simultaneously', () => {
    const event = { ...BASE_EVENT, name: 'Falsch', location: 'Falsch' }
    const diff = detectLadvDiff(event, BASE_LADV)
    expect(Object.keys(diff)).toHaveLength(2)
    expect(diff.name).toBe('Abendsportfest Zehlendorf')
    expect(diff.location).toBe('Berlin')
  })
})
