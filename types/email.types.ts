import type { Database } from '~/types/database.types'
// Import der neuen Template-Typen

/**
 * Typdefinitionen für das E-Mail-System
 */

/**
 * E-Mail-Empfänger
 */
export interface EmailRecipient {
  address: string
  displayName?: string
}

/**
 * Template-Informationen für eine E-Mail
 * - name: Name des zu verwendenden Templates
 * - data: Daten, die im Template eingesetzt werden
 */
export interface EmailTemplate {
  name: string
  data?: Record<string, any>
}

export interface EmailMessage {
  to: EmailRecipient[]
  subject: string
  content: string
  template?: EmailTemplate
  from?: EmailRecipient
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  attachments?: {
    filename: string
    content: Buffer
    contentType: string
  }[]
}

/**
 * Interface für E-Mail-Provider
 */
export interface EmailProvider {
  sendEmail(options: EmailMessage): Promise<void>
}

/**
 * Typen für E-Mail-Logs
 */
export type EmailType =
  | 'registration_confirmation'
  | 'registration_cancellation'
  | 'competition_reminder'
  | 'admin_notification'

/**
 * Status einer E-Mail
 */
export type EmailStatus =
  | 'pending' // Noch nicht gesendet
  | 'sent' // Erfolgreich gesendet
  | 'failed' // Fehlgeschlagen
  | 'processing' // Wird gerade verarbeitet

/**
 * Datenbankmodell für email_logs Tabelle
 */
export type EmailLog = Database['public']['Tables']['email_logs']['Row']
export type EmailLogInsert =
  Database['public']['Tables']['email_logs']['Insert']
export type EmailLogUpdate =
  Database['public']['Tables']['email_logs']['Update']

/**
 * Typen für die Views
 */
export type MemberWithEmail =
  Database['public']['Views']['members_with_emails']['Row']
export type RegistrationWithDetails =
  Database['public']['Views']['registrations_with_details']['Row']
export type PublicRegistration =
  Database['public']['Views']['public_registrations']['Row']

/**
 * Datenstruktur für das Versenden einer E-Mail mit Token für Registrierungen
 * Orientiert sich an der Struktur der email_logs Tabelle mit flacher Hierarchie
 */
export interface RegistrationEmailParams {
  // E-Mail-Informationen
  emailType: EmailType
  subject: string

  // Registrierungsinformationen
  registrationId: number

  // Mitgliedsinformationen (flach statt verschachtelt)
  memberName: string
  memberEmail: string

  // Wettbewerbsinformationen
  competitionName: string
  competitionDate: string

  // Token-Informationen
  token: string
  tokenExpiresAt: Date

  // Template-Informationen
  templateName: string
  linkUrlPath: string
  linkText: string
}
