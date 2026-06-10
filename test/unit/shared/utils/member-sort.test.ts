import { describe, it, expect } from 'vitest'
import { sortMembers } from '../../../../shared/utils/member-sort'

type Member = {
  firstName: string | null
  lastName: string | null
  lastLoginAt: string | null
  lastSyncedAt: string | null
  registrationCount: number
  pushDeviceCount: number
}

function member(overrides: Partial<Member>): Member {
  return {
    firstName: 'Test',
    lastName: 'Person',
    lastLoginAt: null,
    lastSyncedAt: null,
    registrationCount: 0,
    pushDeviceCount: 0,
    ...overrides,
  }
}

const ids = (members: Member[]) => members.map(m => m.lastName)

describe('sortMembers', () => {
  it('sorts by last login ascending with never-logged-in members on top', () => {
    const recent = member({ lastName: 'Recent', lastLoginAt: '2026-06-01T10:00:00Z' })
    const old = member({ lastName: 'Old', lastLoginAt: '2026-01-01T10:00:00Z' })
    const never = member({ lastName: 'Never', lastLoginAt: null })

    const sorted = sortMembers([recent, old, never], 'lastLoginAt', 'asc')

    expect(ids(sorted)).toEqual(['Never', 'Old', 'Recent'])
  })

  it('sorts by last login descending with never-logged-in members at the bottom', () => {
    const recent = member({ lastName: 'Recent', lastLoginAt: '2026-06-01T10:00:00Z' })
    const old = member({ lastName: 'Old', lastLoginAt: '2026-01-01T10:00:00Z' })
    const never = member({ lastName: 'Never', lastLoginAt: null })

    const sorted = sortMembers([recent, old, never], 'lastLoginAt', 'desc')

    expect(ids(sorted)).toEqual(['Recent', 'Old', 'Never'])
  })

  it('sorts by name using last name then first name', () => {
    const a = member({ firstName: 'Bea', lastName: 'Schmidt' })
    const b = member({ firstName: 'Anna', lastName: 'Schmidt' })
    const c = member({ firstName: 'Zoe', lastName: 'Albers' })

    const sorted = sortMembers([a, b, c], 'name', 'asc')

    expect(sorted.map(m => `${m.lastName} ${m.firstName}`)).toEqual([
      'Albers Zoe',
      'Schmidt Anna',
      'Schmidt Bea',
    ])
  })

  it('sorts by a numeric count descending', () => {
    const few = member({ lastName: 'Few', registrationCount: 1 })
    const many = member({ lastName: 'Many', registrationCount: 9 })
    const none = member({ lastName: 'None', registrationCount: 0 })

    const sorted = sortMembers([few, many, none], 'registrationCount', 'desc')

    expect(ids(sorted)).toEqual(['Many', 'Few', 'None'])
  })

  it('does not mutate the input array', () => {
    const input = [
      member({ lastName: 'B', lastLoginAt: '2026-01-01T10:00:00Z' }),
      member({ lastName: 'A', lastLoginAt: '2026-06-01T10:00:00Z' }),
    ]
    const before = ids(input)

    sortMembers(input, 'lastLoginAt', 'asc')

    expect(ids(input)).toEqual(before)
  })
})
