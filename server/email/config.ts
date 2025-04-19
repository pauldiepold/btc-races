/**
 * Konfigurationsmodul für das E-Mail-System
 */

/**
 * Alle unterstützten E-Mail-Provider
 */
export type EmailProviderType = 'local' | 'azure'

/**
 * Konfiguration für das E-Mail-System
 */
export interface EmailConfig {
  /** Zu verwendender E-Mail-Provider ('local' oder 'azure') */
  provider: EmailProviderType

  /** Testmodus, bei dem alle E-Mails an eine Testadresse umgeleitet werden */
  testMode: boolean

  /** Testadresse für den Testmodus */
  testAddress: string

  /** Azure Communication Services Verbindungsstring (nur für Azure-Provider erforderlich) */
  azureConnectionString?: string

  /** Absenderadresse für E-Mails (meist für Azure-Provider erforderlich) */
  senderAddress?: string

  /** Öffentliche URL der Anwendung für Links in E-Mails */
  publicUrl: string
}

/**
 * Lädt und validiert die E-Mail-Konfiguration aus Umgebungsvariablen
 */
export function loadEmailConfig(): EmailConfig {
  const provider = (
    process.env.EMAIL_PROVIDER || 'local'
  ).toLowerCase() as EmailProviderType
  const testMode = process.env.EMAIL_TEST_MODE === 'true'
  const testAddress = process.env.EMAIL_TEST_ADDRESS || 'test@example.com'
  const publicUrl = process.env.PUBLIC_URL

  // Prüfe, ob die PUBLIC_URL gesetzt ist
  if (!publicUrl) {
    console.warn(
      '[EmailConfig] PUBLIC_URL ist nicht gesetzt. Links in E-Mails werden nicht funktionieren.'
    )
  }

  const config: EmailConfig = {
    provider: provider === 'azure' ? 'azure' : 'local',
    testMode,
    testAddress,
    publicUrl: publicUrl || 'http://localhost:3000',
  }

  // Azure-spezifische Konfiguration
  if (provider === 'azure') {
    const azureConnectionString =
      process.env.AZURE_COMMUNICATION_CONNECTION_STRING
    const senderAddress = process.env.SENDER_EMAIL_ADDRESS

    if (!azureConnectionString) {
      console.warn(
        '[EmailConfig] AZURE_COMMUNICATION_CONNECTION_STRING ist nicht gesetzt, aber Azure Provider wird verwendet.'
      )
    }

    if (!senderAddress) {
      console.warn(
        '[EmailConfig] SENDER_EMAIL_ADDRESS ist nicht gesetzt, aber Azure Provider wird verwendet.'
      )
    }

    config.azureConnectionString = azureConnectionString
    config.senderAddress = senderAddress
  }

  console.log(
    `[EmailConfig] Konfiguration geladen: Provider=${config.provider}, TestMode=${config.testMode}`
  )

  return config
}

// Exportiere eine einzelne Instanz der Konfiguration
export const emailConfig = loadEmailConfig()
