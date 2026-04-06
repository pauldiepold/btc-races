// null = kein Deadline-Check nötig → gibt immer false zurück
export function isDeadlineExpired(deadline: Date | null, now: Date = new Date()): boolean {
  if (deadline === null) return false
  return deadline < now
}
