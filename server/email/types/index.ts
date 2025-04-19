import type { Database } from '~/types/database.types'

export interface EmailTemplateData {
  [key: string]: any
}

export interface EmailRecipient {
  address: string
  displayName: string
}

export interface EmailOptions {
  to: EmailRecipient[]
  subject: string
  template: string
  data?: EmailTemplateData
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<void>
}

// E-Mail-Typen für verschiedene Anwendungsfälle
export type EmailType =
  | 'registration_confirmation'
  | 'registration_cancellation'
  | 'competition_reminder'
  | 'admin_notification'

// Status einer E-Mail
export type EmailStatus =
  | 'pending' // Noch nicht gesendet
  | 'sent' // Erfolgreich gesendet
  | 'failed' // Fehlgeschlagen
  | 'processing' // Wird gerade verarbeitet

// Datenbankmodell für email_logs Tabelle
export type EmailLog = Database['public']['Tables']['email_logs']['Row']
export type EmailLogInsert =
  Database['public']['Tables']['email_logs']['Insert']
export type EmailLogUpdate =
  Database['public']['Tables']['email_logs']['Update']

// Typen für die Views
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
