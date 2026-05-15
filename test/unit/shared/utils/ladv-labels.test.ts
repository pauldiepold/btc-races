import { describe, expect, it } from 'vitest'
import { ageClassSortIndex, compareDisciplines, disciplineSortIndex, isRunningDiscipline, ladvAgeClassLabel, ladvDisciplineLabel } from '../../shared/utils/ladv-labels'

describe('ladvDisciplineLabel', () => {
  it('returns the German label for a known discipline code', () => {
    expect(ladvDisciplineLabel('L100')).toBe('100 m')
  })

  it('returns the label for a track sprint discipline', () => {
    expect(ladvDisciplineLabel('L400')).toBe('400 m')
  })

  it('returns the label for a road race discipline', () => {
    expect(ladvDisciplineLabel('SHAL')).toBe('Halbmarathon')
    expect(ladvDisciplineLabel('SMAR')).toBe('Marathon')
  })

  it('returns the label for a relay discipline', () => {
    expect(ladvDisciplineLabel('X4X1')).toBe('4×100 m Staffel')
  })

  it('returns the label for a hurdles discipline', () => {
    expect(ladvDisciplineLabel('H110')).toBe('110 m Hürden')
  })

  it('returns the code itself for an unknown discipline code', () => {
    expect(ladvDisciplineLabel('UNBEKANNT')).toBe('UNBEKANNT')
  })

  it('returns the code itself for an empty string', () => {
    expect(ladvDisciplineLabel('')).toBe('')
  })
})

describe('isRunningDiscipline', () => {
  it('accepts track running disciplines (L*)', () => {
    expect(isRunningDiscipline('L100')).toBe(true)
    expect(isRunningDiscipline('L800')).toBe(true)
    expect(isRunningDiscipline('L5K0')).toBe(true)
    expect(isRunningDiscipline('L10K')).toBe(true)
  })

  it('accepts road running disciplines (S*)', () => {
    expect(isRunningDiscipline('S5K')).toBe(true)
    expect(isRunningDiscipline('SHAL')).toBe(true)
    expect(isRunningDiscipline('SMAR')).toBe(true)
    expect(isRunningDiscipline('SCR')).toBe(true)
    expect(isRunningDiscipline('STRAIL')).toBe(true)
  })

  it('accepts relay disciplines (X*)', () => {
    expect(isRunningDiscipline('X4X1')).toBe(true)
    expect(isRunningDiscipline('X4X4')).toBe(true)
    expect(isRunningDiscipline('XMARS')).toBe(true)
  })

  it('accepts timed run disciplines (A*)', () => {
    expect(isRunningDiscipline('ASTD')).toBe(true)
    expect(isRunningDiscipline('AHSTD')).toBe(true)
    expect(isRunningDiscipline('ASTD24')).toBe(true)
  })

  it('rejects walking and non-running S* variants', () => {
    expect(isRunningDiscipline('SWALKING')).toBe(false)
    expect(isRunningDiscipline('SNWALKING')).toBe(false)
    expect(isRunningDiscipline('SWANDERN')).toBe(false)
    expect(isRunningDiscipline('SINLINE')).toBe(false)
    expect(isRunningDiscipline('SROLLSTUHL')).toBe(false)
    expect(isRunningDiscipline('SWANDERNWALKING')).toBe(false)
    expect(isRunningDiscipline('SSONSTIGES')).toBe(false)
  })

  it('rejects hurdles disciplines (H*)', () => {
    expect(isRunningDiscipline('H100')).toBe(false)
    expect(isRunningDiscipline('H110')).toBe(false)
    expect(isRunningDiscipline('H400')).toBe(false)
    expect(isRunningDiscipline('H3K0')).toBe(false)
  })

  it('rejects jumps and throws (T*)', () => {
    expect(isRunningDiscipline('THOC')).toBe(false)
    expect(isRunningDiscipline('TWEI')).toBe(false)
    expect(isRunningDiscipline('TKUG')).toBe(false)
    expect(isRunningDiscipline('TSPE')).toBe(false)
  })

  it('rejects race walking (GB*, GS*)', () => {
    expect(isRunningDiscipline('GB5')).toBe(false)
    expect(isRunningDiscipline('GS10')).toBe(false)
    expect(isRunningDiscipline('GSMAR')).toBe(false)
  })

  it('rejects combined events, wheelchair, KiLa, DMM', () => {
    expect(isRunningDiscipline('M10K')).toBe(false)
    expect(isRunningDiscipline('BL100')).toBe(false)
    expect(isRunningDiscipline('KKILA')).toBe(false)
    expect(isRunningDiscipline('ADM1')).toBe(false)
  })
})

describe('disciplineSortIndex', () => {
  it('returns a defined index for known codes', () => {
    const idx100 = disciplineSortIndex('L100')
    const idx800 = disciplineSortIndex('L800')
    expect(idx100).toBeGreaterThanOrEqual(0)
    expect(idx800).toBeGreaterThan(idx100)
  })

  it('L-codes come before S-codes in sort order', () => {
    expect(disciplineSortIndex('L100')).toBeLessThan(disciplineSortIndex('SMAR'))
  })

  it('returns 9999 for unknown codes', () => {
    expect(disciplineSortIndex('UNBEKANNT')).toBe(9999)
    expect(disciplineSortIndex('')).toBe(9999)
  })
})

describe('ageClassSortIndex', () => {
  it('returns a defined index for known codes', () => {
    const idxM = ageClassSortIndex('M')
    const idxM30 = ageClassSortIndex('M30')
    expect(idxM).toBeGreaterThanOrEqual(0)
    expect(idxM30).toBeGreaterThan(idxM)
  })

  it('returns 9999 for unknown codes', () => {
    expect(ageClassSortIndex('UNBEKANNT')).toBe(9999)
    expect(ageClassSortIndex('')).toBe(9999)
  })
})

describe('compareDisciplines', () => {
  it('sorts by discipline first', () => {
    const a = { discipline: 'L100', ageClass: 'M' }
    const b = { discipline: 'SMAR', ageClass: 'M' }
    expect(compareDisciplines(a, b)).toBeLessThan(0)
    expect(compareDisciplines(b, a)).toBeGreaterThan(0)
  })

  it('returns 0 for equal discipline and age class', () => {
    const a = { discipline: 'L800', ageClass: 'W' }
    expect(compareDisciplines(a, a)).toBe(0)
  })

  it('sorts by age class when discipline is equal', () => {
    const a = { discipline: 'L800', ageClass: 'M' }
    const b = { discipline: 'L800', ageClass: 'M30' }
    expect(compareDisciplines(a, b)).toBeLessThan(0)
    expect(compareDisciplines(b, a)).toBeGreaterThan(0)
  })

  it('handles missing ageClass (null/undefined)', () => {
    const a = { discipline: 'L800', ageClass: null }
    const b = { discipline: 'L800', ageClass: 'M' }
    expect(typeof compareDisciplines(a, b)).toBe('number')
  })

  it('sorts unknown codes after known ones', () => {
    const known = { discipline: 'L100', ageClass: 'M' }
    const unknown = { discipline: 'UNBEKANNT', ageClass: 'M' }
    expect(compareDisciplines(known, unknown)).toBeLessThan(0)
  })
})

describe('ladvAgeClassLabel', () => {
  it('returns the German label for men', () => {
    expect(ladvAgeClassLabel('M')).toBe('Männer')
  })

  it('returns the German label for women', () => {
    expect(ladvAgeClassLabel('W')).toBe('Frauen')
  })

  it('returns the label for a masters age class', () => {
    expect(ladvAgeClassLabel('M40')).toBe('M40')
    expect(ladvAgeClassLabel('W55')).toBe('W55')
  })

  it('returns the label for a youth age class', () => {
    expect(ladvAgeClassLabel('MJU18')).toBe('Männl. Jugend U18')
    expect(ladvAgeClassLabel('WJU20')).toBe('Weibl. Jugend U20')
  })

  it('returns the label for a junior age class', () => {
    expect(ladvAgeClassLabel('MU23')).toBe('Junioren U23')
    expect(ladvAgeClassLabel('WU23')).toBe('Juniorinnen U23')
  })

  it('returns the label for a mixed age class', () => {
    expect(ladvAgeClassLabel('X')).toBe('Männer/Frauen')
    expect(ladvAgeClassLabel('XJU16')).toBe('Jugend U16')
  })

  it('returns the code itself for an unknown age class code', () => {
    expect(ladvAgeClassLabel('UNBEKANNT')).toBe('UNBEKANNT')
  })

  it('returns the code itself for an empty string', () => {
    expect(ladvAgeClassLabel('')).toBe('')
  })
})
