import type { EmailService } from './types'
import { AzureEmailService } from './services/azure'
import { LocalEmailService } from './providers/local'
import { emailConfig } from './config'

/**
 * Erstellt einen E-Mail-Service basierend auf der Konfiguration
 */
export function createEmailService(): EmailService {
  console.log(`[EmailServiceFactory] E-Mail-Provider: ${emailConfig.provider}`)

  switch (emailConfig.provider) {
    case 'azure':
      return new AzureEmailService()
    case 'local':
    default:
      return new LocalEmailService()
  }
}
