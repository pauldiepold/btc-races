import { describe, expect, it } from 'vitest'
import { diffLadvRegistration, shouldNotifyAdminsOnWishChange } from '../../shared/utils/ladv-diff'

describe('diffLadvRegistration', () => {
  it('returns empty diff for identical sets', () => {
    const wish = [{ discipline: 'S5K', ageClass: 'M35' }]
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]

    expect(diffLadvRegistration(wish, ladv)).toEqual([])
  })

  it('returns add when discipline exists only in wish', () => {
    const wish = [{ discipline: 'S5K', ageClass: 'M35' }]

    expect(diffLadvRegistration(wish, [])).toEqual([
      { type: 'add', discipline: 'S5K', ageClass: 'M35' },
    ])
  })

  it('returns remove when discipline exists only in ladv', () => {
    const ladv = [{ discipline: 'S10K', ageClass: 'W40' }]

    expect(diffLadvRegistration([], ladv)).toEqual([
      { type: 'remove', discipline: 'S10K', ageClass: 'W40' },
    ])
  })

  it('returns update when discipline matches but age class differs', () => {
    const wish = [{ discipline: 'S5K', ageClass: 'M40' }]
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]

    expect(diffLadvRegistration(wish, ladv)).toEqual([
      { type: 'update', discipline: 'S5K', ageClass: 'M40', previousAgeClass: 'M35' },
    ])
  })

  it('returns mixed add, remove and update entries in stable order', () => {
    const wish = [
      { discipline: 'L800', ageClass: 'WU20' },
      { discipline: 'S10K', ageClass: 'M40' },
    ]
    const ladv = [
      { discipline: 'L800', ageClass: 'WU18' },
      { discipline: 'S5K', ageClass: 'W35' },
    ]

    expect(diffLadvRegistration(wish, ladv)).toEqual([
      { type: 'update', discipline: 'L800', ageClass: 'WU20', previousAgeClass: 'WU18' },
      { type: 'remove', discipline: 'S5K', ageClass: 'W35' },
      { type: 'add', discipline: 'S10K', ageClass: 'M40' },
    ])
  })

  it('treats null ladv state as no coach entries yet', () => {
    const wish = [
      { discipline: 'S5K', ageClass: 'M35' },
      { discipline: 'S10K', ageClass: 'M35' },
    ]

    expect(diffLadvRegistration(wish, null)).toEqual([
      { type: 'add', discipline: 'S5K', ageClass: 'M35' },
      { type: 'add', discipline: 'S10K', ageClass: 'M35' },
    ])
  })

  it('treats empty ladv array same as null for diffing', () => {
    const wish = [{ discipline: 'S5K', ageClass: 'M35' }]

    expect(diffLadvRegistration(wish, [])).toEqual(diffLadvRegistration(wish, null))
  })
})

describe('shouldNotifyAdminsOnWishChange', () => {
  const base = [{ discipline: 'S5K', ageClass: 'M35' }]

  it('returns false when ladv is null (coach has not acted yet)', () => {
    expect(shouldNotifyAdminsOnWishChange(base, [{ discipline: 'S10K', ageClass: 'M35' }], null)).toBe(false)
  })

  it('returns false when new wish matches ladv exactly (diff empty)', () => {
    expect(shouldNotifyAdminsOnWishChange(base, base, base)).toBe(false)
  })

  it('returns false when wish has not changed, even if diff vs ladv is non-empty', () => {
    const ladv = [{ discipline: 'S10K', ageClass: 'M35' }]
    expect(shouldNotifyAdminsOnWishChange(base, base, ladv)).toBe(false)
  })

  it('returns true when wish changed and new wish differs from ladv', () => {
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]
    const newWish = [{ discipline: 'S10K', ageClass: 'M35' }]
    expect(shouldNotifyAdminsOnWishChange(base, newWish, ladv)).toBe(true)
  })

  it('returns true when ageClass changes and ladv still has old ageClass', () => {
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]
    const newWish = [{ discipline: 'S5K', ageClass: 'M40' }]
    expect(shouldNotifyAdminsOnWishChange(base, newWish, ladv)).toBe(true)
  })

  it('returns true when discipline added and ladv is non-empty', () => {
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]
    const newWish = [{ discipline: 'S5K', ageClass: 'M35' }, { discipline: 'S10K', ageClass: 'M35' }]
    expect(shouldNotifyAdminsOnWishChange(base, newWish, ladv)).toBe(true)
  })
})
