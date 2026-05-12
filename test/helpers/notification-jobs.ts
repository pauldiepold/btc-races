import type { TestDb } from './test-db'
import type { NotificationType } from '~~/shared/types/notifications'

export type NotificationJobRow = {
  id: number
  type: NotificationType
  actorUserId: number | null
  payload: Record<string, unknown> & { _recipients: Array<{ userId: number }> }
}

/**
 * Liest persistierte Notification-Jobs aus der Test-DB und parst das JSON-Payload.
 * Test-Asserts nutzen das statt einer Recorder-Doppelimplementierung.
 */
export async function loadNotificationJobs(testDb: TestDb): Promise<NotificationJobRow[]> {
  const rows = await testDb.db.select().from(testDb.schema.notificationJobs)
  return rows.map(row => ({
    id: row.id,
    type: row.type,
    actorUserId: row.actorUserId,
    payload: JSON.parse(row.payload),
  }))
}
