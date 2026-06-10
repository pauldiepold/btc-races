import { describe, it, expect } from 'vitest'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { collectWishFilterOptions, filterRegistrationsByWish } from '../../../../shared/utils/registration-discipline-filter'

type Reg = { id: number, wishDisciplines: RegistrationDisciplinePair[] }

function reg(id: number, pairs: [string, string][]): Reg {
  return { id, wishDisciplines: pairs.map(([discipline, ageClass]) => ({ discipline, ageClass })) }
}

describe('collectWishFilterOptions', () => {
  it('returns distinct disciplines in canonical order', () => {
    // TWEI (Weitsprung) comes after the L-prefixed track disciplines in the LADV order
    const regs = [reg(1, [['TWEI', 'M40']]), reg(2, [['L100', 'M40']])]

    const { disciplines } = collectWishFilterOptions(regs)

    expect(disciplines).toEqual(['L100', 'TWEI'])
  })

  it('returns distinct age classes in canonical order', () => {
    // M30 precedes M40 in the LADV age-class order
    const regs = [reg(1, [['L100', 'M40']]), reg(2, [['L100', 'M30']])]

    const { ageClasses } = collectWishFilterOptions(regs)

    expect(ageClasses).toEqual(['M30', 'M40'])
  })
})

describe('filterRegistrationsByWish', () => {
  const ids = (regs: Reg[]) => regs.map(r => r.id)

  it('keeps registrations that have a pair with the selected discipline', () => {
    const regs = [
      reg(1, [['L100', 'M40'], ['TWEI', 'M40']]),
      reg(2, [['L200', 'M40']]),
    ]

    const result = filterRegistrationsByWish(regs, { discipline: 'TWEI' })

    expect(ids(result)).toEqual([1])
  })

  it('keeps registrations that have a pair with the selected age class', () => {
    const regs = [
      reg(1, [['L100', 'M40']]),
      reg(2, [['L100', 'M30']]),
    ]

    const result = filterRegistrationsByWish(regs, { ageClass: 'M30' })

    expect(ids(result)).toEqual([2])
  })

  it('matches discipline and age class field-wise across different pairs', () => {
    // A Masters athlete starting TWEI in the open class M but L100 in M40:
    // no single pair is (TWEI, M40), yet both fields are satisfied → keep.
    const regs = [reg(1, [['TWEI', 'M'], ['L100', 'M40']])]

    const result = filterRegistrationsByWish(regs, { discipline: 'TWEI', ageClass: 'M40' })

    expect(ids(result)).toEqual([1])
  })

  it('returns all registrations when no filter is set', () => {
    const regs = [reg(1, [['L100', 'M40']]), reg(2, [['L200', 'M30']])]

    expect(ids(filterRegistrationsByWish(regs, {}))).toEqual([1, 2])
  })
})
