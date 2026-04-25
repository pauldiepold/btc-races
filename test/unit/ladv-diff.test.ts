import { describe, expect, it } from 'vitest'
import { diffLadvRegistration } from '../../shared/utils/ladv-diff'

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
