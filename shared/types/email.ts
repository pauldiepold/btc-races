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

/**
 * E-Mail-Nachricht mit HTML und Plain-Text Inhalt
 */
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
  /** HTML-Inhalt der E-Mail */
  html: string
  /** Plain-Text Inhalt der E-Mail */
  text: string
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
