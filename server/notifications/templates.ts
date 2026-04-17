import type { NotificationType } from './types'

/**
 * Vue-Komponentenname in app/emails/ pro Notification-Typ.
 * Fehlende Einträge → E-Mail-Delivery wird übersprungen (graceful skip).
 */
export const EMAIL_TEMPLATE_MAP: Partial<Record<NotificationType, string>> = {
  ladv_registered: 'LadvRegisteredEmail',
  ladv_canceled: 'LadvCanceledEmail',
  athlete_canceled_after_ladv: 'AthleteCanceledAfterLadvEmail',
  event_canceled: 'EventCanceledEmail',
  new_event: 'NewEventEmail',
  reminder_deadline_athlete: 'ReminderDeadlineAthleteEmail',
  reminder_deadline_admin: 'ReminderDeadlineAdminEmail',
  reminder_event: 'ReminderEventEmail',
}

/**
 * Dynamische Betreffzeilen pro Notification-Typ.
 */
export const EMAIL_SUBJECT_MAP: Record<NotificationType, (payload: Record<string, unknown>) => string> = {
  ladv_registered: p => `LADV-Meldung: ${p.eventName ?? 'Wettkampf'}`,
  ladv_canceled: p => `LADV-Abmeldung: ${p.eventName ?? 'Wettkampf'}`,
  athlete_canceled_after_ladv: p => `Abmeldung nach LADV-Meldung: ${p.eventName ?? 'Wettkampf'}`,
  event_canceled: p => `Abgesagt: ${p.eventName ?? 'Veranstaltung'}`,
  new_event: p => `Neue Veranstaltung: ${p.eventName ?? ''}`,
  reminder_deadline_athlete: p => `Meldeschluss: ${p.eventName ?? 'Wettkampf'}`,
  reminder_deadline_admin: p => `Admin-Erinnerung Meldeschluss: ${p.eventName ?? 'Wettkampf'}`,
  reminder_event: p => `Erinnerung: ${p.eventName ?? 'Veranstaltung'}`,
}

/**
 * Push-Payload-Builder pro Notification-Typ — Stub für spätere Implementierung.
 */
export const PUSH_PAYLOAD_MAP: Partial<Record<NotificationType, (payload: Record<string, unknown>) => { title: string, body: string, url?: string }>> = {
  // Wird in einem späteren Issue implementiert
}
