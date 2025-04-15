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
