// E-Mail-System - Zentraler Export aller Komponenten

// Konfiguration
export { emailConfig, loadEmailConfig } from './config'

// Typen
export * from './types'

// Manager und Factory
export { EmailManager } from './manager'
export { createEmailService } from './factory'

// Services
export { RegistrationEmailService } from './services/registration-emails'

// Provider-Implementierungen
export { AzureEmailService } from './services/azure'
export { LocalEmailService } from './providers/local'

// Template-Service
export { TemplateService } from './services/template'
