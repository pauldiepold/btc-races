export type EventCoreField = 'date' | 'startTime' | 'location'

export interface EventCoreSnapshot {
  date: string | null
  startTime: string | null
  location: string | null
}

export interface EventFieldChange {
  field: EventCoreField
  before: string | null
  after: string | null
}

const CORE_FIELDS: EventCoreField[] = ['date', 'startTime', 'location']

function normalizeCoreFieldValue(value: string | null): string | null {
  if (value === null) return null
  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

export function toEventCoreSnapshot(
  row: { date: string | null, startTime: string | null, location: string | null },
): EventCoreSnapshot {
  return { date: row.date, startTime: row.startTime, location: row.location }
}

export function diffEventCoreFields(before: EventCoreSnapshot, after: EventCoreSnapshot): EventFieldChange[] {
  const changes: EventFieldChange[] = []

  for (const field of CORE_FIELDS) {
    const beforeValue = normalizeCoreFieldValue(before[field])
    const afterValue = normalizeCoreFieldValue(after[field])

    if (beforeValue === afterValue) continue

    changes.push({
      field,
      before: beforeValue,
      after: afterValue,
    })
  }

  return changes
}
