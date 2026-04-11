// null = kein Deadline-Check nötig → gibt immer false zurück
export function isDeadlineExpired(deadline: Date | string | null, now: Date = new Date()): boolean {
  if (deadline === null) return false
  const d = deadline instanceof Date ? deadline : new Date(deadline)
  return d < now
}
