import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { ageClassSortIndex, disciplineSortIndex } from '~~/shared/utils/ladv-labels'

type WishRegistration = { wishDisciplines: RegistrationDisciplinePair[] }

export function collectWishFilterOptions<T extends WishRegistration>(
  registrations: T[],
): { disciplines: string[], ageClasses: string[] } {
  const disciplines = new Set<string>()
  const ageClasses = new Set<string>()
  for (const reg of registrations) {
    for (const pair of reg.wishDisciplines) {
      disciplines.add(pair.discipline)
      ageClasses.add(pair.ageClass)
    }
  }
  return {
    disciplines: [...disciplines].sort((a, b) => disciplineSortIndex(a) - disciplineSortIndex(b)),
    ageClasses: [...ageClasses].sort((a, b) => ageClassSortIndex(a) - ageClassSortIndex(b)),
  }
}

export function filterRegistrationsByWish<T extends WishRegistration>(
  registrations: T[],
  filter: { discipline?: string, ageClass?: string },
): T[] {
  return registrations.filter((reg) => {
    if (filter.discipline && !reg.wishDisciplines.some(p => p.discipline === filter.discipline)) {
      return false
    }
    if (filter.ageClass && !reg.wishDisciplines.some(p => p.ageClass === filter.ageClass)) {
      return false
    }
    return true
  })
}
