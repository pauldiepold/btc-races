import type { NotificationType } from './types'

/**
 * Vue-Komponentenname in app/emails/ pro Notification-Typ.
 * Fehlende Einträge → E-Mail-Delivery wird übersprungen (graceful skip).
 */
export const EMAIL_TEMPLATE_MAP: Partial<Record<NotificationType, string>> = {
  admin_registered_member: 'AdminRegisteredMemberEmail',
  admin_changed_member_registration: 'AdminChangedMemberRegistrationEmail',
  ladv_registered: 'LadvRegisteredEmail',
  ladv_canceled: 'LadvCanceledEmail',
  registration_confirmation: 'RegistrationConfirmationEmail',
  athlete_changed_after_ladv: 'AthleteChangedAfterLadvEmail',
  athlete_canceled_after_ladv: 'AthleteCanceledAfterLadvEmail',
  event_canceled: 'EventCanceledEmail',
  event_changed: 'EventChangedEmail',
  new_event: 'NewEventEmail',
  reminder_deadline_athlete: 'ReminderDeadlineAthleteEmail',
  reminder_deadline_admin: 'ReminderDeadlineAdminEmail',
  reminder_event: 'ReminderEventEmail',
}

/**
 * Dynamische Betreffzeilen pro Notification-Typ.
 */
export const EMAIL_SUBJECT_MAP: Record<NotificationType, (payload: Record<string, unknown>) => string> = {
  admin_registered_member: p => `Anmeldung: ${p.eventName ?? 'Wettkampf'}`,
  admin_changed_member_registration: p => `Anmeldung geändert: ${p.eventName ?? 'Wettkampf'}`,
  ladv_registered: p => `LADV-Meldung: ${p.eventName ?? 'Wettkampf'}`,
  ladv_canceled: p => `LADV-Abmeldung: ${p.eventName ?? 'Wettkampf'}`,
  registration_confirmation: p => `Anmeldebestätigung: ${p.eventName ?? 'Wettkampf'}`,
  athlete_changed_after_ladv: p => `Wunschstand geändert: ${p.eventName ?? 'Wettkampf'}`,
  athlete_canceled_after_ladv: p => `Stornierung nach LADV-Meldung: ${p.eventName ?? 'Wettkampf'}`,
  event_canceled: p => `Abgesagt: ${p.eventName ?? 'Veranstaltung'}`,
  event_changed: p => `Änderung: ${p.eventName ?? 'Veranstaltung'}`,
  new_event: p => `Neue Veranstaltung: ${p.eventName ?? ''}`,
  reminder_deadline_athlete: p => `Meldeschluss: ${p.eventName ?? 'Wettkampf'}`,
  reminder_deadline_admin: p => `Admin-Erinnerung Meldeschluss: ${p.eventName ?? 'Wettkampf'}`,
  reminder_event: p => `Erinnerung: ${p.eventName ?? 'Veranstaltung'}`,
}

/**
 * Push-Payload-Builder pro Notification-Typ.
 */
export const PUSH_PAYLOAD_MAP: Partial<Record<NotificationType, (payload: Record<string, unknown>) => { title: string, body: string, url?: string }>> = {
  admin_registered_member: p => ({
    title: 'Anmeldung',
    body: `Du wurdest für ${p.eventName ?? 'einen Wettkampf'} angemeldet.`,
    url: p.eventLink as string | undefined,
  }),
  admin_changed_member_registration: p => ({
    title: 'Anmeldung geändert',
    body: `Deine Anmeldung für ${p.eventName ?? 'einen Wettkampf'} wurde geändert.`,
    url: p.eventLink as string | undefined,
  }),
  ladv_registered: p => ({
    title: 'LADV-Meldung',
    body: `Du wurdest für ${p.eventName ?? 'einen Wettkampf'} gemeldet.`,
    url: p.eventUrl as string | undefined,
  }),
  ladv_canceled: p => ({
    title: 'LADV-Abmeldung',
    body: `Deine Meldung für ${p.eventName ?? 'einen Wettkampf'} wurde zurückgezogen.`,
    url: p.eventUrl as string | undefined,
  }),
  registration_confirmation: p => ({
    title: 'Anmeldebestätigung',
    body: `Du bist für ${p.eventName ?? 'einen Wettkampf'} angemeldet.`,
    url: p.eventLink as string | undefined,
  }),
  athlete_changed_after_ladv: p => ({
    title: 'Wunschstand geändert',
    body: `${p.athleteName ?? 'Ein Athlet'} hat seinen Wunschstand für ${p.eventName ?? 'einen Wettkampf'} geändert.`,
    url: p.eventUrl as string | undefined,
  }),
  athlete_canceled_after_ladv: p => ({
    title: 'LADV-Abmeldung nötig',
    body: `${p.athleteName ?? 'Ein Athlet'} hat die Anmeldung für ${p.eventName ?? 'einen Wettkampf'} storniert.`,
    url: p.eventLink as string | undefined,
  }),
  event_canceled: p => ({
    title: 'Veranstaltung abgesagt',
    body: `${p.eventName ?? 'Eine Veranstaltung'} wurde abgesagt.`,
    url: p.eventUrl as string | undefined,
  }),
  event_changed: p => ({
    title: 'Veranstaltung geändert',
    body: `${p.eventName ?? 'Eine Veranstaltung'} wurde geändert.`,
    url: p.eventUrl as string | undefined,
  }),
  new_event: p => ({
    title: 'Neue Veranstaltung',
    body: `${p.eventName ?? 'Eine neue Veranstaltung'} wurde veröffentlicht.`,
    url: p.eventUrl as string | undefined,
  }),
  reminder_deadline_athlete: p => ({
    title: 'Meldeschluss',
    body: `Meldeschluss für ${p.eventName ?? 'einen Wettkampf'} steht bevor.`,
    url: p.eventUrl as string | undefined,
  }),
  reminder_deadline_admin: p => ({
    title: 'Admin-Erinnerung',
    body: `Meldeschluss für ${p.eventName ?? 'einen Wettkampf'} steht bevor.`,
    url: p.eventUrl as string | undefined,
  }),
  reminder_event: p => ({
    title: 'Erinnerung',
    body: `${p.eventName ?? 'Eine Veranstaltung'} findet bald statt.`,
    url: p.eventUrl as string | undefined,
  }),
}
