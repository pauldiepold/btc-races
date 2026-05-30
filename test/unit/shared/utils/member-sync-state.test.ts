import { describe, it, expect } from 'vitest'
import { memberSyncState } from '../../../../shared/utils/member-sync-state'

const NOW = new Date('2026-05-30T12:00:00Z')

describe('memberSyncState', () => {
  it('reports never when the member has no campaiId', () => {
    expect(memberSyncState({ campaiId: null, lastSyncedAt: NOW }, NOW)).toBe('never')
  })

  it('reports synced when the last sync is recent', () => {
    const recent = new Date(NOW.getTime() - 1 * 60 * 60 * 1000) // 1h ago
    expect(memberSyncState({ campaiId: 'c1', lastSyncedAt: recent }, NOW)).toBe('synced')
  })

  it('reports stale when the last sync is older than the threshold', () => {
    const old = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    expect(memberSyncState({ campaiId: 'c1', lastSyncedAt: old }, NOW)).toBe('stale')
  })

  it('reports stale when linked to Campai but never actually synced', () => {
    expect(memberSyncState({ campaiId: 'c1', lastSyncedAt: null }, NOW)).toBe('stale')
  })
})
