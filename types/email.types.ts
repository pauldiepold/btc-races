/**
 * Typdefinitionen für das E-Mail-System
 */

/**
 * E-Mail-Empfänger
 */
export interface EmailRecipient {
  /** E-Mail-Adresse */
  address: string
  /** Anzeigename des Empfängers */
  displayName?: string
}

/**
 * Template-Informationen für eine E-Mail
 * - name: Name des zu verwendenden Templates
 * - data: Daten, die im Template eingesetzt werden
 */
export interface EmailTemplate {
  /** Name des Templates */
  name: string
  /** Daten für das Template */
  data: any
}

/**
 * E-Mail-Anhang
 */
export interface EmailAttachment {
  /** Dateiname des Anhangs */
  filename: string
  /** Inhalt des Anhangs */
  content: Buffer
  /** MIME-Typ des Anhangs */
  contentType: string
}

export interface EmailMessage {
  /** Empfänger */
  to: EmailRecipient[]
  /** CC-Empfänger (optional) */
  cc?: EmailRecipient[]
  /** BCC-Empfänger (optional) */
  bcc?: EmailRecipient[]
  /** Absender (optional) */
  from?: EmailRecipient
  /** Betreff der E-Mail */
  subject: string
  /** E-Mail-Inhalt (HTML oder Text) */
  content: string
  /** Template (optional) */
  template?: EmailTemplate
  /** Anhänge (optional) */
  attachments?: EmailAttachment[]
}

/**
 * Interface für E-Mail-Provider
 */
export interface EmailProvider {
  /** Sendet eine E-Mail über den Provider */
  sendEmail(message: EmailMessage): Promise<void>
}
