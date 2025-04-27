/**
 * Konfigurationsmodul für den LADV-Service
 */

/**
 * Unterstützte Provider-Typen
 */
export type LadvProviderType = 'api' | 'mock'

/**
 * Konfiguration für den LADV-Service
 */
export interface LadvConfig {
  /** Zu verwendender Provider ('api' oder 'mock') */
  provider: LadvProviderType

  /** API-Key für den LADV-Service (nur für API-Provider erforderlich) */
  apiKey?: string
}

/**
 * Lädt und validiert die LADV-Konfiguration aus Umgebungsvariablen
 */
export function loadLadvConfig(): LadvConfig {
  const provider = (process.env.NUXT_LADV_PROVIDER || 'mock') as LadvProviderType
  const apiKey = process.env.NUXT_LADV_API_KEY

  // Validiere den Provider
  if (provider !== 'api' && provider !== 'mock') {
    console.warn(
      `[LadvConfig] Ungültiger Provider "${provider}". Verwende 'mock' als Fallback.`
    )
  }

  const config: LadvConfig = {
    provider: provider === 'api' ? 'api' : 'mock',
  }

  // API-spezifische Konfiguration
  if (config.provider === 'api') {
    if (!apiKey) {
      throw new Error(
        '[LadvConfig] NUXT_LADV_API_KEY ist nicht gesetzt, aber API Provider wird verwendet.'
      )
    }
    config.apiKey = apiKey
  }

  console.log(
    `[LadvConfig] Konfiguration geladen: Provider=${config.provider}`
  )

  return config
}

// Exportiere eine einzelne Instanz der Konfiguration
export const ladvConfig = loadLadvConfig() 