/**
 * YYYY-MM-DD plus Tage. Reine Datums-Arithmetik ohne Timezone-Shenanigans.
 * Nutzt UTC, weil Events die Datumsstrings als "kalendarische Tage" speichern.
 */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}
