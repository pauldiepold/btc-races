/**
 * Definiert welche Campai-Sections automatisch die Admin-Rolle erhalten
 *
 * Diese Liste kann einfach erweitert werden, wenn neue Admin-Sections
 * in Campai hinzugefügt werden.
 */
export const ADMIN_SECTIONS = [
  'Vorstand',
  'Geschäftsstelle',
]

/**
 * Prüft ob eine Section Admin-Rechte verleiht
 */
export function isAdminSection(section: string): boolean {
  return ADMIN_SECTIONS.includes(section)
}
