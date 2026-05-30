export type MemberSyncState = 'synced' | 'stale' | 'never'

/**
 * Ein Member gilt als "stale", wenn der letzte Campai-Sync länger als
 * diese Spanne zurückliegt (Sync läuft regulär täglich).
 */
export const SYNC_STALE_AFTER_MS = 48 * 60 * 60 * 1000 // 48h

export function memberSyncState(
  input: { campaiId: string | null, lastSyncedAt: Date | null },
  now: Date,
): MemberSyncState {
  if (!input.campaiId) return 'never'
  if (!input.lastSyncedAt) return 'stale'
  const age = now.getTime() - input.lastSyncedAt.getTime()
  return age > SYNC_STALE_AFTER_MS ? 'stale' : 'synced'
}
