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

export type DeadlineUrgency = 'expired' | 'soon' | 'normal' | 'none'

// Dringlichkeitsstufe einer Meldefrist — einheitlicher SSOT für Farb-Mappings in der UI.
// 'soon' = ≤ 3 Kalendertage bis zum Stichtag.
export function deadlineUrgency(
  deadline: Date | string | null,
  now: Date = new Date(),
): DeadlineUrgency {
  if (deadline === null) return 'none'
  if (isDeadlineExpired(deadline, now)) return 'expired'
  const deadlineStr = typeof deadline === 'string' ? deadline.slice(0, 10) : berlinDateFormatter.format(deadline)
  if (isWithinDeadlineWindow(deadlineStr, 3, now)) return 'soon'
  return 'normal'
}

// Vorzeichenbehaftete Differenz in Kalendertagen (Berliner Zeit): Stichtag − heute.
// > 0 = noch X Tage bis zur Frist, 0 = heute, < 0 = X Tage abgelaufen.
// null, wenn keine Frist gesetzt ist.
export function daysUntilDeadline(
  deadline: Date | string | null,
  now: Date = new Date(),
): number | null {
  if (deadline === null) return null
  const deadlineStr = typeof deadline === 'string' ? deadline.slice(0, 10) : berlinDateFormatter.format(deadline)
  const todayStr = berlinDateFormatter.format(now)
  return Math.round(
    (Date.parse(`${deadlineStr}T00:00:00Z`) - Date.parse(`${todayStr}T00:00:00Z`)) / 86_400_000,
  )
}
