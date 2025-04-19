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
