// Berechnet die LADV-Altersklasse eines Athleten.
// Stichtag: 31.12. des Wettkampfjahres → age = competitionYear - birthYear
// Jugend: U18 (<18), U20 (18–19)
// Aktive: 20–34 → 'M'/'W'
// Masters: ab 35 in 5er-Schritten (35, 40, 45, ...)
export function getLadvAgeClass(
  birthYear: number,
  gender: 'm' | 'w',
  competitionYear: number,
): string {
  const prefix = gender === 'm' ? 'M' : 'W'
  const age = competitionYear - birthYear

  if (age < 16) return `${prefix}JU16`
  if (age < 18) return `${prefix}JU18`
  if (age < 20) return `${prefix}JU20`
  if (age < 35) return prefix

  // Masters: 35, 40, 45, ...
  const mastersAge = Math.floor(age / 5) * 5
  return `${prefix}${mastersAge}`
}
