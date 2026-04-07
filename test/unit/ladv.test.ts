import { describe, expect, it } from 'vitest'
import type { LadvAusschreibung } from '../../server/utils/ladv'
import { normalizeLadvData, parseLadvIdFromUrl } from '../../server/utils/ladv'

describe('parseLadvIdFromUrl', () => {
  it('extracts ID from a valid LADV URL', () => {
    expect(parseLadvIdFromUrl('https://ladv.de/ausschreibung/detail/42008/Abendsportfest-Berlin-Zehlendorf.htm')).toBe(42008)
  })

  it('extracts ID when slug contains special characters', () => {
    expect(parseLadvIdFromUrl('https://ladv.de/ausschreibung/detail/45980/BTC-Berlin-Open.htm')).toBe(45980)
  })

  it('returns null for a URL without the expected pattern', () => {
    expect(parseLadvIdFromUrl('https://ladv.de/veranstaltungen/')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseLadvIdFromUrl('')).toBeNull()
  })

  it('returns null for an arbitrary string', () => {
    expect(parseLadvIdFromUrl('nicht-eine-url')).toBeNull()
  })
})

// Unix-Timestamp für 2024-06-15T00:00:00 Berliner Zeit (CEST = UTC+2)
const JUNE_15_2024_BERLIN_MS = new Date('2024-06-15T00:00:00+02:00').getTime()
const AUG_01_2024_BERLIN_MS = new Date('2024-08-01T00:00:00+02:00').getTime()

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
  url: 'https://ladv.de/ausschreibung/detail/42008/Abendsportfest-Berlin-Zehlendorf.htm',
  tags: '',
  kategorien: [],
  ort: { id: 1, name: 'Berlin', lv: 'BLV', land: 'DE', lng: 13.4, lat: 52.5 },
  veranstaltungen: [],
  lvs: '',
  landesverband: [],
  links: [],
  attachements: [],
  wettbewerbe: [{ disziplin: '100m', klasse: 'M30', disziplinNew: '100m', klasseNew: 'M30' }],
}

describe('normalizeLadvData', () => {
  it('maps name from raw', () => {
    expect(normalizeLadvData(BASE_RAW).name).toBe('Abendsportfest Zehlendorf')
  })

  it('converts datum timestamp to YYYY-MM-DD in Berlin timezone', () => {
    expect(normalizeLadvData(BASE_RAW).date).toBe('2024-06-15')
  })

  it('converts meldDatum timestamp to YYYY-MM-DD in Berlin timezone', () => {
    expect(normalizeLadvData(BASE_RAW).registration_deadline).toBe('2024-08-01')
  })

  it('uses ort.name as location', () => {
    expect(normalizeLadvData(BASE_RAW).location).toBe('Berlin')
  })

  it('passes through the announcement URL', () => {
    expect(normalizeLadvData(BASE_RAW).announcement_link).toBe(BASE_RAW.url)
  })

  it('includes the raw ladv_data object', () => {
    expect(normalizeLadvData(BASE_RAW).ladv_data).toBe(BASE_RAW)
  })

  it('sets race_type to "track" when "bahn" is in kategorien', () => {
    const raw = { ...BASE_RAW, kategorien: ['bahn', 'freiluft'] }
    expect(normalizeLadvData(raw).race_type).toBe('track')
  })

  it('sets race_type to "road" when "bahn" is not in kategorien', () => {
    const raw = { ...BASE_RAW, kategorien: ['straße'] }
    expect(normalizeLadvData(raw).race_type).toBe('road')
  })

  it('sets race_type to "road" when kategorien is empty', () => {
    expect(normalizeLadvData(BASE_RAW).race_type).toBe('road')
  })

  it('sets is_wrc to 1 when wrc is true', () => {
    const raw = { ...BASE_RAW, wrc: true }
    expect(normalizeLadvData(raw).is_wrc).toBe(1)
  })

  it('sets is_wrc to 0 when wrc is false', () => {
    const raw = { ...BASE_RAW, wrc: false }
    expect(normalizeLadvData(raw).is_wrc).toBe(0)
  })

  it('sets is_wrc to 0 when wrc is undefined', () => {
    const { wrc: _, ...rawWithoutWrc } = BASE_RAW
    expect(normalizeLadvData(rawWithoutWrc as LadvAusschreibung).is_wrc).toBe(0)
  })

  it('sets championship_type to null', () => {
    expect(normalizeLadvData(BASE_RAW).championship_type).toBeNull()
  })
})
