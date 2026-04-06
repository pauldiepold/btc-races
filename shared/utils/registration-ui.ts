import type { EventType } from './registration'

export type BadgeColor = 'success' | 'error' | 'warning' | 'neutral' | 'info' | 'primary' | 'secondary'

/** Anzeige-Label des aktuellen Status (Badge, Übersicht) */
export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  registered: 'Angemeldet',
  canceled: 'Abgemeldet',
  maybe: 'Vielleicht',
  yes: 'Ja',
  no: 'Nein',
}

/** Aktions-Label je Event-Typ (Buttons zum Status-Wechsel) */
export function getRegistrationActionLabels(eventType: EventType): Record<string, string> {
  if (eventType === 'ladv') return { registered: 'Anmelden', canceled: 'Abmelden' }
  if (eventType === 'competition') return { registered: 'Anmelden', maybe: 'Vielleicht', no: 'Nein' }
  return { yes: 'Ja', maybe: 'Vielleicht', no: 'Nein' }
}

/** Badge-Farbe je Status (UBadge color-Prop) */
export const REGISTRATION_STATUS_BADGE_COLORS: Record<string, BadgeColor> = {
  registered: 'success',
  canceled: 'error',
  maybe: 'warning',
  yes: 'success',
  no: 'error',
}

/** Button-Farbe für Status-Aktionen */
export const REGISTRATION_STATUS_BUTTON_COLORS: Record<string, BadgeColor> = {
  registered: 'success',
  canceled: 'error',
  maybe: 'warning',
  yes: 'success',
  no: 'error',
}

/** Tailwind-Textfarbe für den bold Status-Header */
export const REGISTRATION_STATUS_TEXT_CLASSES: Record<string, string> = {
  registered: 'text-green-600 dark:text-green-400',
  canceled: 'text-red-600 dark:text-red-400',
  maybe: 'text-amber-600 dark:text-amber-400',
  yes: 'text-green-600 dark:text-green-400',
  no: 'text-zinc-500 dark:text-zinc-400',
}

/** Tab-Konfiguration für die Anmeldeliste je Event-Typ */
export function getRegistrationTabConfig(eventType: EventType): Array<{ key: string, label: string }> {
  if (eventType === 'ladv') {
    return [
      { key: 'registered', label: 'Angemeldet' },
      { key: 'canceled', label: 'Abgemeldet' },
    ]
  }
  if (eventType === 'competition') {
    return [
      { key: 'registered', label: 'Angemeldet' },
      { key: 'maybe', label: 'Vielleicht' },
      { key: 'no', label: 'Nein' },
    ]
  }
  return [
    { key: 'yes', label: 'Ja' },
    { key: 'maybe', label: 'Vielleicht' },
    { key: 'no', label: 'Nein' },
  ]
}
