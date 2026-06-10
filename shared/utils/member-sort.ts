export type MemberSortField
  = | 'name'
    | 'lastLoginAt'
    | 'lastSyncedAt'
    | 'registrationCount'
    | 'pushDeviceCount'

export type SortDirection = 'asc' | 'desc'

/** Strukturelle Mindestform, die zum Sortieren reicht. */
export type SortableMember = {
  firstName: string | null
  lastName: string | null
  lastLoginAt: string | null
  lastSyncedAt: string | null
  registrationCount: number
  pushDeviceCount: number
}

/**
 * Ein `null`-Datum (z. B. „noch nie eingeloggt") zählt als ältester denkbarer
 * Zeitpunkt (−∞). Aufsteigend landet es damit oben, absteigend unten.
 */
function dateValue(iso: string | null): number {
  return iso ? new Date(iso).getTime() : -Infinity
}

function fullName(m: SortableMember): string {
  return `${m.lastName ?? ''} ${m.firstName ?? ''}`.trim()
}

function compare(a: SortableMember, b: SortableMember, field: MemberSortField): number {
  switch (field) {
    case 'name':
      return fullName(a).localeCompare(fullName(b), 'de', { sensitivity: 'base' })
    case 'lastLoginAt':
    case 'lastSyncedAt':
      return dateValue(a[field]) - dateValue(b[field])
    case 'registrationCount':
    case 'pushDeviceCount':
      return a[field] - b[field]
  }
}

export function sortMembers<T extends SortableMember>(
  items: T[],
  field: MemberSortField,
  direction: SortDirection,
): T[] {
  const dir = direction === 'asc' ? 1 : -1
  return [...items].sort((a, b) => dir * compare(a, b, field))
}
