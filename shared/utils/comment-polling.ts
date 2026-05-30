/** Minimal-Form, die Cursor- und Merge-Logik benötigen — Date oder JSON-String. */
type CommentLike = { id: number, createdAt: Date | string }

/**
 * Führt frisch gepollte Kommentare in die vorhandene Liste ein: hängt neue an,
 * verwirft per `id` bereits vorhandene (Boundary-Schutz) und sortiert nach
 * `createdAt` aufsteigend (Chat-Reihenfolge).
 */
export function mergeComments<T extends CommentLike>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map(c => c.id))
  const merged = [...existing]
  for (const c of incoming) {
    if (seen.has(c.id)) continue
    seen.add(c.id)
    merged.push(c)
  }
  return merged.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

/**
 * Spätester `createdAt` der Kommentare — Basis für den `since`-Parameter beim
 * Delta-Polling. `undefined` bei leerer Liste (kein Cursor → Vollabruf).
 */
export function commentCursor(comments: CommentLike[]): Date | undefined {
  let latest: Date | undefined
  for (const c of comments) {
    const at = new Date(c.createdAt)
    if (!latest || at > latest) latest = at
  }
  return latest
}
