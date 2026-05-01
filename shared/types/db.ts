import type { schema } from 'hub:db'

export type User = typeof schema.users.$inferSelect
export type Event = typeof schema.events.$inferSelect
export type Registration = typeof schema.registrations.$inferSelect
export type RegistrationDisciplinePair = {
  discipline: string
  ageClass: string
}
export type NotificationJob = typeof schema.notificationJobs.$inferSelect
export type NotificationDelivery = typeof schema.notificationDeliveries.$inferSelect
export type NotificationPreference = typeof schema.notificationPreferences.$inferSelect
export type PushSubscription = typeof schema.pushSubscriptions.$inferSelect
