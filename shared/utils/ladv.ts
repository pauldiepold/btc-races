import type { LadvAusschreibung } from '../types/ladv'

export type LadvDiff = Partial<{
  name: string
  date: string // YYYY-MM-DD (LADV-Wert)
  location: string // LADV-Wert
  registrationDeadline: string // YYYY-MM-DD (LADV-Wert)
  raceType: 'track' | 'road' // LADV-abgeleiteter Wert aus kategorien
  // championshipType bewusst nicht im Diff — LADV-Daten enthalten diese Info nicht zuverlässig
}>

function timestampToDate(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms))
}

const berlinFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function dateToString(d: Date | string | null | undefined): string | null {
  if (!d) return null
  if (typeof d === 'string') return d.slice(0, 10)
  return berlinFormatter.format(d)
}

/**
 * Vergleicht die gespeicherten normalisierten Felder eines Events mit den rohen LADV-Daten.
 * Gibt ein Objekt zurück, das für jedes abweichende Feld den LADV-Wert enthält.
 * Leeres Objekt = kein Diff.
 */
export function detectLadvDiff(
  event: {
    name: string
    date: Date | string | null
    location: string | null
    registrationDeadline: Date | string | null
    raceType: string | null
  },
  ladvData: LadvAusschreibung,
): LadvDiff {
  const diff: LadvDiff = {}

  const ladvName = ladvData.name
  if (event.name !== ladvName) diff.name = ladvName

  const ladvDate = timestampToDate(ladvData.datum)
  if (dateToString(event.date) !== ladvDate) diff.date = ladvDate

  const ladvLocation = ladvData.ort.name
  if ((event.location ?? '') !== ladvLocation) diff.location = ladvLocation

  const ladvDeadline = timestampToDate(ladvData.meldDatum)
  if (dateToString(event.registrationDeadline) !== ladvDeadline) diff.registrationDeadline = ladvDeadline

  const ladvRaceType = ladvData.kategorien.includes('bahn') ? 'track' : 'road'
  if (event.raceType !== ladvRaceType) diff.raceType = ladvRaceType

  return diff
}
