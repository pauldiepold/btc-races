import type { RegistrationDisciplinePair } from '../types/db'
import { compareDisciplines } from './ladv-labels'

export type LadvRegistrationDiffEntry
  = | { type: 'add', discipline: string, ageClass: string }
    | { type: 'remove', discipline: string, ageClass: string }
    | { type: 'update', discipline: string, ageClass: string, previousAgeClass: string }

export function diffLadvRegistration(
  wish: RegistrationDisciplinePair[],
  ladv: RegistrationDisciplinePair[] | null,
): LadvRegistrationDiffEntry[] {
  const wishByDiscipline = new Map(wish.map(item => [item.discipline, item]))
  const ladvByDiscipline = new Map((ladv ?? []).map(item => [item.discipline, item]))

  const disciplines = Array.from(new Set([
    ...wishByDiscipline.keys(),
    ...ladvByDiscipline.keys(),
  ])).sort((a, b) => compareDisciplines({ discipline: a }, { discipline: b }))

  const diffs: LadvRegistrationDiffEntry[] = []

  for (const discipline of disciplines) {
    const wishEntry = wishByDiscipline.get(discipline)
    const ladvEntry = ladvByDiscipline.get(discipline)

    if (wishEntry && !ladvEntry) {
      diffs.push({
        type: 'add',
        discipline,
        ageClass: wishEntry.ageClass,
      })
      continue
    }

    if (!wishEntry && ladvEntry) {
      diffs.push({
        type: 'remove',
        discipline,
        ageClass: ladvEntry.ageClass,
      })
      continue
    }

    if (wishEntry && ladvEntry && wishEntry.ageClass !== ladvEntry.ageClass) {
      diffs.push({
        type: 'update',
        discipline,
        ageClass: wishEntry.ageClass,
        previousAgeClass: ladvEntry.ageClass,
      })
    }
  }

  return diffs
}
