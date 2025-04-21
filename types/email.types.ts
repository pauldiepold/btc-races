import type { Database } from '~/types/database.types'

/**
 * Typdefinitionen für das E-Mail-System
 */

/**
 * E-Mail-Template-Daten
 */
export interface EmailTemplateData {
  [key: string]: any
}

/**
 * E-Mail-Empfänger
 */
export interface EmailRecipient {
  address: string
  displayName?: string
}

/**
 * Optionen für das Senden einer E-Mail
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
 * Kontext für den Versand einer E-Mail mit Token
 * Wird vom RegistrationEmailService für verschiedene E-Mail-Typen verwendet
 */
export interface EmailContext {
  emailType: EmailType
  registrationId: number
  member: MemberWithEmail
  competition: {
    name: string
    date: string
  }
  token: string
  tokenExpiresAt: Date
  templateName: string
  subject: string
  linkUrlPath: string
  linkText: string
}
