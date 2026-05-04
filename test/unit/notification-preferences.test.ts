import { describe, expect, it } from 'vitest'
import { resolveChannelsForRecipient } from '../../server/notifications/resolve-channels'

describe('resolveChannelsForRecipient', () => {
  // ladv_registered: email mandatory, push default on
  describe('mandatory channels', () => {
    it('includes mandatory channel even without preferences', () => {
      const channels = resolveChannelsForRecipient('ladv_registered', [])
      expect(channels).toContain('email')
    })

    it('includes mandatory channel even when user disabled it', () => {
      const channels = resolveChannelsForRecipient('ladv_registered', [
        { channel: 'email', enabled: 0 },
      ])
      expect(channels).toContain('email')
    })
  })

  // new_event: email default off, push default on — neither mandatory
  describe('non-mandatory channels with defaults', () => {
    it('excludes channel that is off by default without user preference', () => {
      const channels = resolveChannelsForRecipient('new_event', [])
      expect(channels).not.toContain('email')
      expect(channels).toContain('push')
    })

    it('respects user opt-in for default-off channel', () => {
      const channels = resolveChannelsForRecipient('new_event', [
        { channel: 'email', enabled: 1 },
      ])
      expect(channels).toContain('email')
    })

    it('respects user opt-out for default-on channel', () => {
      const channels = resolveChannelsForRecipient('new_event', [
        { channel: 'push', enabled: 0 },
      ])
      expect(channels).not.toContain('push')
    })
  })

  // reminder_deadline_athlete: both default on, neither mandatory
  describe('both channels default on, non-mandatory', () => {
    it('returns both channels without preferences', () => {
      const channels = resolveChannelsForRecipient('reminder_deadline_athlete', [])
      expect(channels).toEqual(['email', 'push'])
    })

    it('user can opt out of email', () => {
      const channels = resolveChannelsForRecipient('reminder_deadline_athlete', [
        { channel: 'email', enabled: 0 },
      ])
      expect(channels).toEqual(['push'])
    })

    it('user can opt out of both', () => {
      const channels = resolveChannelsForRecipient('reminder_deadline_athlete', [
        { channel: 'email', enabled: 0 },
        { channel: 'push', enabled: 0 },
      ])
      expect(channels).toEqual([])
    })
  })
})
