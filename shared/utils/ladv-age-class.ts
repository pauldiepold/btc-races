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

// Wählt die passende Altersklasse für einen Athleten aus dem Angebot einer
// Disziplin (`availableClasses` = die LADV-`klasseNew`-Werte dieser Disziplin).
// Masters-Athleten (35+) dürfen ersatzweise in der offenen Hauptklasse (M/W)
// starten, wenn ihre Masters-Klasse nicht angeboten wird.
// Gibt '' zurück, wenn keine passende Klasse angeboten wird oder Geburtsjahr/
// Geschlecht fehlen — der Aufrufer entscheidet dann, ob er einen Fallback setzt.
export function pickAgeClass(
  availableClasses: string[],
  user: { birthYear: number | null, gender: 'm' | 'w' | null },
  competitionYear: number,
): string {
  if (!user.birthYear || !user.gender) return ''
  const auto = getLadvAgeClass(user.birthYear, user.gender, competitionYear)
  const openClass = user.gender === 'm' ? 'M' : 'W'
  // Masters-Klassen sehen aus wie M35/W40 (Präfix + Zahl); JU-Klassen und die
  // Hauptklasse M/W sind keine Masters und bekommen keinen Hauptklassen-Fallback.
  const candidates = /^[MW]\d+$/.test(auto) ? [auto, openClass] : [auto]
  return candidates.find(c => availableClasses.includes(c)) ?? ''
}
