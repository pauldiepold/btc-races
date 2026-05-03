import { describe, expect, it } from 'vitest'
import { diffLadvRegistration, getCoachModalLineState, getCoachModalRemovals, getRegistrationLadvIndicator, shouldNotifyAdminsOnWishChange } from '../../shared/utils/ladv-diff'

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

describe('getCoachModalLineState', () => {
  it('returns ok when discipline exists in ladv with same age class', () => {
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]
    expect(getCoachModalLineState({ discipline: 'S5K', ageClass: 'M35' }, ladv))
      .toEqual({ type: 'ok' })
  })

  it('returns add when discipline does not exist in ladv', () => {
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]
    expect(getCoachModalLineState({ discipline: 'S10K', ageClass: 'M35' }, ladv))
      .toEqual({ type: 'add' })
  })

  it('returns update with previousAgeClass when ageClass differs', () => {
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]
    expect(getCoachModalLineState({ discipline: 'S5K', ageClass: 'M40' }, ladv))
      .toEqual({ type: 'update', previousAgeClass: 'M35' })
  })

  it('returns initial when ladv is null', () => {
    expect(getCoachModalLineState({ discipline: 'S5K', ageClass: 'M35' }, null))
      .toEqual({ type: 'initial' })
  })

  it('returns add when ladv is empty array (not initial)', () => {
    expect(getCoachModalLineState({ discipline: 'S5K', ageClass: 'M35' }, []))
      .toEqual({ type: 'add' })
  })
})

describe('getCoachModalRemovals', () => {
  it('returns ladv entries that are not in editor', () => {
    const editor = [{ discipline: 'S5K', ageClass: 'M35' }]
    const ladv = [
      { discipline: 'S5K', ageClass: 'M35' },
      { discipline: 'S10K', ageClass: 'M35' },
    ]
    expect(getCoachModalRemovals(editor, ladv)).toEqual([
      { discipline: 'S10K', ageClass: 'M35' },
    ])
  })

  it('does not include entries present in editor regardless of ageClass', () => {
    const editor = [{ discipline: 'S5K', ageClass: 'M40' }]
    const ladv = [{ discipline: 'S5K', ageClass: 'M35' }]
    expect(getCoachModalRemovals(editor, ladv)).toEqual([])
  })

  it('returns empty array when ladv is null', () => {
    expect(getCoachModalRemovals([{ discipline: 'S5K', ageClass: 'M35' }], null))
      .toEqual([])
  })

  it('returns empty array when ladv is empty', () => {
    expect(getCoachModalRemovals([{ discipline: 'S5K', ageClass: 'M35' }], []))
      .toEqual([])
  })

  it('preserves ladv input order across multiple removals', () => {
    const editor: { discipline: string, ageClass: string }[] = []
    const ladv = [
      { discipline: 'S10K', ageClass: 'M35' },
      { discipline: 'L800', ageClass: 'M35' },
      { discipline: 'S5K', ageClass: 'M35' },
    ]
    expect(getCoachModalRemovals(editor, ladv)).toEqual(ladv)
  })
})

describe('getRegistrationLadvIndicator', () => {
  const pair = (discipline: string, ageClass: string) => ({ discipline, ageClass })

  it('returns "none" when registered without wish or ladv state', () => {
    expect(getRegistrationLadvIndicator({
      status: 'registered',
      wishDisciplines: [],
      ladvDisciplines: null,
    })).toBe('none')
  })

  it('returns "diff" when registered with wish but no ladv state yet', () => {
    expect(getRegistrationLadvIndicator({
      status: 'registered',
      wishDisciplines: [pair('S5K', 'M35')],
      ladvDisciplines: null,
    })).toBe('diff')
  })

  it('returns "ok" when registered and wish matches ladv exactly', () => {
    expect(getRegistrationLadvIndicator({
      status: 'registered',
      wishDisciplines: [pair('S5K', 'M35')],
      ladvDisciplines: [pair('S5K', 'M35')],
    })).toBe('ok')
  })

  it('returns "diff" when registered and ladv has different age class', () => {
    expect(getRegistrationLadvIndicator({
      status: 'registered',
      wishDisciplines: [pair('S5K', 'M35')],
      ladvDisciplines: [pair('S5K', 'M40')],
    })).toBe('diff')
  })

  it('returns "pending" when canceled but ladv still has entries', () => {
    expect(getRegistrationLadvIndicator({
      status: 'canceled',
      wishDisciplines: [],
      ladvDisciplines: [pair('S5K', 'M35')],
    })).toBe('pending')
  })

  it('returns "none" when canceled and ladv is null', () => {
    expect(getRegistrationLadvIndicator({
      status: 'canceled',
      wishDisciplines: [pair('S5K', 'M35')],
      ladvDisciplines: null,
    })).toBe('none')
  })

  it('returns "ok" when canceled and ladv is empty array (coach already cleared)', () => {
    expect(getRegistrationLadvIndicator({
      status: 'canceled',
      wishDisciplines: [],
      ladvDisciplines: [],
    })).toBe('ok')
  })
})
