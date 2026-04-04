import type { schema } from 'hub:db'

export type User = typeof schema.users.$inferSelect
export type Event = typeof schema.events.$inferSelect
export type Registration = typeof schema.registrations.$inferSelect
export type RegistrationDiscipline = typeof schema.registrationDisciplines.$inferSelect
export type EventComment = typeof schema.eventComments.$inferSelect
export type Reaction = typeof schema.reactions.$inferSelect
export type SentEmail = typeof schema.sentEmails.$inferSelect
