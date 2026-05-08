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
