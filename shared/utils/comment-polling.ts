/** Minimal-Form, die Cursor- und Merge-Logik benötigen — Date oder JSON-String. */
type CommentLike = { id: number, createdAt: Date | string, updatedAt: Date | string }

/**
 * Führt frisch gepollte Kommentare in die vorhandene Liste ein: ersetzt per `id`
 * bereits vorhandene (Edit/Soft-Delete/Pin propagiert in den View), hängt neue an
 * und sortiert nach `createdAt` aufsteigend (Chat-Reihenfolge — Edits/Pins
 * verschieben einen Kommentar nicht).
 */
export function mergeComments<T extends CommentLike>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map(c => [c.id, c]))
  for (const c of incoming) byId.set(c.id, c)
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

/**
 * Spätestes `updatedAt` der Kommentare — Basis für den `since`-Parameter beim
 * Delta-Polling. `updatedAt` („Row zuletzt berührt") fängt neue *und* geänderte
 * Kommentare in einem Delta ein. `undefined` bei leerer Liste (kein Cursor →
 * Vollabruf).
 */
export function commentCursor(comments: CommentLike[]): Date | undefined {
  let latest: Date | undefined
  for (const c of comments) {
    const at = new Date(c.updatedAt)
    if (!latest || at > latest) latest = at
  }
  return latest
}
