// null = kein Deadline-Check nötig → gibt immer false zurück
// Vergleich tagesweise in Berliner Zeit: der gesamte Stichtag ist gültig.
const berlinDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })

export function isDeadlineExpired(deadline: Date | string | null, now: Date = new Date()): boolean {
  if (deadline === null) return false
  const deadlineStr = typeof deadline === 'string'
    ? deadline.slice(0, 10)
    : berlinDateFormatter.format(deadline)
  const todayStr = berlinDateFormatter.format(now)
  return todayStr > deadlineStr
}

// Prüft, ob heute (Berliner Zeit) ≤ `days` Kalendertage vor (oder am) Stichtag liegt.
// false, wenn deadline === null oder bereits abgelaufen.
export function isWithinDeadlineWindow(
  deadline: string | null,
  days: number,
  now: Date = new Date(),
): boolean {
  if (deadline === null) return false
  const deadlineStr = deadline.slice(0, 10)
  const todayStr = berlinDateFormatter.format(now)
  if (todayStr > deadlineStr) return false
  const diffDays = Math.round(
    (Date.parse(`${deadlineStr}T00:00:00Z`) - Date.parse(`${todayStr}T00:00:00Z`)) / 86_400_000,
  )
  return diffDays <= days
}
