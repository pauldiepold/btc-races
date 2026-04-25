import type { LadvAusschreibung } from '../types/ladv'

export type LadvDiff = Partial<{
  name: string
  date: string // YYYY-MM-DD (LADV-Wert)
  location: string // LADV-Wert
  registrationDeadline: string // YYYY-MM-DD (LADV-Wert)
  raceType: 'track' | 'road' // LADV-abgeleiteter Wert aus kategorien
  // championshipType bewusst nicht im Diff — LADV-Daten enthalten diese Info nicht zuverlässig
}>

const berlinFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function timestampToDate(ms: number): string {
  return berlinFormatter.format(new Date(ms))
}

/**
 * Vergleicht die gespeicherten normalisierten Felder eines Events mit den rohen LADV-Daten.
 * Gibt ein Objekt zurück, das für jedes abweichende Feld den LADV-Wert enthält.
 * Leeres Objekt = kein Diff.
 */
export function detectLadvDiff(
  event: {
    name: string
    date: string | null
    location: string | null
    registrationDeadline: string | null
    raceType: string | null
  },
  ladvData: LadvAusschreibung,
): LadvDiff {
  const diff: LadvDiff = {}

  const ladvName = ladvData.name
  if (event.name !== ladvName) diff.name = ladvName

  const ladvDate = timestampToDate(ladvData.datum)
  if ((event.date?.slice(0, 10) ?? null) !== ladvDate) diff.date = ladvDate

  const ladvLocation = [ladvData.sportstaette, ladvData.ort.name].filter(Boolean).join(' · ')
  if ((event.location ?? '') !== ladvLocation) diff.location = ladvLocation

  const ladvDeadline = timestampToDate(ladvData.meldDatum)
  if ((event.registrationDeadline?.slice(0, 10) ?? null) !== ladvDeadline) diff.registrationDeadline = ladvDeadline

  const ladvRaceType = ladvData.kategorien.includes('bahn') ? 'track' : 'road'
  if (event.raceType !== ladvRaceType) diff.raceType = ladvRaceType

  return diff
}
