/**
 * Formatiert "Vorname N." für die Anzeige in E-Mails.
 */
export function formatActorName(firstName: string, lastName: string): string {
  const initial = lastName.trim().charAt(0)
  return initial ? `${firstName} ${initial}.` : firstName
}
