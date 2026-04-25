import { describe, expect, it } from 'vitest'
import { diffEventCoreFields, type EventCoreSnapshot } from '../../server/utils/diff-event-core-fields'

const BASE_SNAPSHOT: EventCoreSnapshot = {
  date: '2026-05-12',
  startTime: '18:30',
  location: 'Berlin',
}

describe('diffEventCoreFields', () => {
  it('returns empty array when snapshots are identical', () => {
    expect(diffEventCoreFields(BASE_SNAPSHOT, BASE_SNAPSHOT)).toEqual([])
  })

  it('returns one change for a changed date', () => {
    const before: EventCoreSnapshot = { ...BASE_SNAPSHOT, date: '2026-05-12' }
    const after: EventCoreSnapshot = { ...BASE_SNAPSHOT, date: '2026-05-13' }

    expect(diffEventCoreFields(before, after)).toEqual([
      {
        field: 'date',
        before: '2026-05-12',
        after: '2026-05-13',
      },
    ])
  })

  it('returns all three fields in stable order when all changed', () => {
    const before: EventCoreSnapshot = {
      date: '2026-05-12',
      startTime: '18:30',
      location: 'Berlin',
    }
    const after: EventCoreSnapshot = {
      date: '2026-06-01',
      startTime: '19:00',
      location: 'Potsdam',
    }

    expect(diffEventCoreFields(before, after)).toEqual([
      { field: 'date', before: '2026-05-12', after: '2026-06-01' },
      { field: 'startTime', before: '18:30', after: '19:00' },
      { field: 'location', before: 'Berlin', after: 'Potsdam' },
    ])
  })

  it('ignores whitespace-only differences', () => {
    const before: EventCoreSnapshot = { ...BASE_SNAPSHOT, location: '  Berlin  ' }
    const after: EventCoreSnapshot = { ...BASE_SNAPSHOT, location: 'Berlin' }

    expect(diffEventCoreFields(before, after)).toEqual([])
  })

  it('detects null to value change', () => {
    const before: EventCoreSnapshot = { ...BASE_SNAPSHOT, location: null }
    const after: EventCoreSnapshot = { ...BASE_SNAPSHOT, location: 'Berlin' }

    expect(diffEventCoreFields(before, after)).toEqual([
      {
        field: 'location',
        before: null,
        after: 'Berlin',
      },
    ])
  })

  it('normalizes empty strings to null', () => {
    const before: EventCoreSnapshot = { ...BASE_SNAPSHOT, startTime: '   ' }
    const after: EventCoreSnapshot = { ...BASE_SNAPSHOT, startTime: null }

    expect(diffEventCoreFields(before, after)).toEqual([])
  })

  it('ignores non-core properties when present at runtime', () => {
    const before = {
      ...BASE_SNAPSHOT,
      name: 'Alt',
    } as EventCoreSnapshot & { name: string }
    const after = {
      ...BASE_SNAPSHOT,
      name: 'Neu',
    } as EventCoreSnapshot & { name: string }

    expect(diffEventCoreFields(before, after)).toEqual([])
  })
})
