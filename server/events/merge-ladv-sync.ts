import { normalizeLadvData } from '~~/server/utils/ladv'
import type { LadvAusschreibung, NormalizedLadvData } from '~~/shared/types/ladv'
import type { EventInsert, EventRow } from './persistence'

export type LadvFieldMode = 'ladv-protected' | 'ladv-always'

export type LadvFieldRule = {
  column: keyof EventInsert
  mode: LadvFieldMode
  fromDb: (event: EventRow) => unknown
  fromLadv: (data: NormalizedLadvData) => unknown
}

export const LADV_FIELD_RULES: ReadonlyArray<LadvFieldRule> = [
  {
    column: 'name',
    mode: 'ladv-protected',
    fromDb: e => e.name,
    fromLadv: d => d.name,
  },
  {
    column: 'date',
    mode: 'ladv-protected',
    fromDb: e => e.date?.slice(0, 10) ?? null,
    fromLadv: d => d.date,
  },
  {
    column: 'location',
    mode: 'ladv-protected',
    fromDb: e => e.location ?? '',
    fromLadv: d => d.location,
  },
  {
    column: 'registrationDeadline',
    mode: 'ladv-protected',
    fromDb: e => e.registrationDeadline?.slice(0, 10) ?? null,
    fromLadv: d => d.registration_deadline,
  },
  {
    column: 'raceType',
    mode: 'ladv-protected',
    fromDb: e => e.raceType,
    fromLadv: d => d.race_type,
  },
  {
    column: 'startTime',
    mode: 'ladv-always',
    fromDb: e => e.startTime,
    fromLadv: d => d.start_time,
  },
  {
    column: 'isWrc',
    mode: 'ladv-always',
    fromDb: e => e.isWrc,
    fromLadv: d => d.is_wrc,
  },
]

export function mergeLadvSync(
  dbEvent: EventRow,
  ladvData: NormalizedLadvData,
): Partial<EventInsert> {
  const lastSeen = dbEvent.ladvData
    ? normalizeLadvData(dbEvent.ladvData as LadvAusschreibung)
    : null

  const updates: Record<string, unknown> = {}

  for (const rule of LADV_FIELD_RULES) {
    const newValue = rule.fromLadv(ladvData)

    if (rule.mode === 'ladv-always') {
      updates[rule.column] = newValue
      continue
    }

    const dbValue = rule.fromDb(dbEvent)
    const lastSeenValue = lastSeen ? rule.fromLadv(lastSeen) : null
    if (dbValue === lastSeenValue) {
      updates[rule.column] = newValue
    }
  }

  return updates as Partial<EventInsert>
}
