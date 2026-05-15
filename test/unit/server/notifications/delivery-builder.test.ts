import { describe, expect, it } from 'vitest'
import { buildDeliveryTasks } from '../../server/notifications/delivery-builder'
import type { NotificationRecipient } from '../../server/notifications/types'

const recipient = (userId: number): NotificationRecipient => ({ userId, email: `user${userId}@example.com` })

const noPrefs = new Map()

describe('buildDeliveryTasks', () => {
  // new_event: email default off, push default on
  it('erstellt Push-Task wenn Preference aktiv und Subscription vorhanden', () => {
    const tasks = buildDeliveryTasks(
      'new_event',
      [recipient(1)],
      noPrefs,
      new Set([1]),
    )
    expect(tasks).toEqual([{ recipient: recipient(1), channel: 'push' }])
  })

  it('überspringt Push-Task wenn Preference aktiv aber keine Subscription', () => {
    const tasks = buildDeliveryTasks(
      'new_event',
      [recipient(1)],
      noPrefs,
      new Set(),
    )
    expect(tasks).toHaveLength(0)
  })

  it('überspringt Push-Task wenn Preference deaktiviert, auch bei vorhandener Subscription', () => {
    const prefs = new Map([[1, [{ channel: 'push' as const, enabled: 0 }]]])
    const tasks = buildDeliveryTasks(
      'new_event',
      [recipient(1)],
      prefs,
      new Set([1]),
    )
    expect(tasks).toHaveLength(0)
  })

  // reminder_deadline_athlete: email + push default on
  it('erstellt Push-Task gemäß Default wenn keine explizite Preference und Subscription vorhanden', () => {
    const tasks = buildDeliveryTasks(
      'reminder_deadline_athlete',
      [recipient(1)],
      noPrefs,
      new Set([1]),
    )
    const channels = tasks.map(t => t.channel)
    expect(channels).toContain('push')
    expect(channels).toContain('email')
  })

  it('Email-Tasks sind unabhängig vom Subscription-Status', () => {
    // ladv_registered: email mandatory
    const tasks = buildDeliveryTasks(
      'ladv_registered',
      [recipient(1)],
      noPrefs,
      new Set(), // keine Push-Subscription
    )
    const channels = tasks.map(t => t.channel)
    expect(channels).toContain('email')
    expect(channels).not.toContain('push')
  })
})
