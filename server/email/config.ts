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
  const provider = process.env.NUXT_EMAIL_PROVIDER as EmailProviderType
  const testMode = process.env.NUXT_EMAIL_TEST_MODE === 'true'
  const testAddress = process.env.NUXT_EMAIL_TEST_ADDRESS || 'test@example.com'
  const publicUrl = (() => {
    // Produktionsumgebung
    if (process.env.VERCEL_ENV === 'production') {
      return process.env.VERCEL_PROJECT_PRODUCTION_URL
    }
    
    // Vercel Deployment
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    
    // Fallback-Optionen
    return process.env.NUXT_PUBLIC_URL ||
           process.env.NUXT_APP_BASE_URL ||
           'https://btc-races.vercel.app'
  })()

  // Prüfe, ob die PUBLIC_URL gesetzt ist
  if (!publicUrl) {
    throw new Error(
      '[EmailConfig] NUXT_PUBLIC_URL oder NUXT_APP_BASE_URL ist nicht gesetzt. Links in E-Mails werden nicht funktionieren.'
    )
  }

  // Validiere den Provider
  if (provider !== 'local' && provider !== 'azure') {
    console.warn(
      `[EmailConfig] Ungültiger Provider "${provider}". Verwende 'local' als Fallback.`
    )
  }

  const config: EmailConfig = {
    provider: provider === 'azure' ? 'azure' : 'local',
    testMode,
    testAddress,
    publicUrl,
  }

  // Azure-spezifische Konfiguration
  if (config.provider === 'azure') {
    const azureConnectionString =
      process.env.NUXT_AZURE_COMMUNICATION_CONNECTION_STRING
    const senderAddress = process.env.NUXT_SENDER_EMAIL_ADDRESS

    if (!azureConnectionString) {
      throw new Error(
        '[EmailConfig] NUXT_AZURE_COMMUNICATION_CONNECTION_STRING ist nicht gesetzt, aber Azure Provider wird verwendet.'
      )
    }

    if (!senderAddress) {
      throw new Error(
        '[EmailConfig] NUXT_SENDER_EMAIL_ADDRESS ist nicht gesetzt, aber Azure Provider wird verwendet.'
      )
    }

    config.azureConnectionString = azureConnectionString
    config.senderAddress = senderAddress
  }

  console.log(
    `[EmailConfig] Konfiguration geladen: Provider=${config.provider}, TestMode=${config.testMode}, PublicUrl=${config.publicUrl}`
  )

  return config
}

// Exportiere eine einzelne Instanz der Konfiguration
export const emailConfig = loadEmailConfig()
