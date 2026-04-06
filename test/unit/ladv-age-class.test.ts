import { describe, it, expect } from 'vitest'
import { getLadvAgeClass } from '../../shared/utils/ladv-age-class'

describe('getLadvAgeClass', () => {
  describe('youth classes', () => {
    it('returns MJU16 for males under 16', () => {
      expect(getLadvAgeClass(2015, 'm', 2026)).toBe('MJU16') // age 11
      expect(getLadvAgeClass(2011, 'm', 2026)).toBe('MJU16') // age 15
    })

    it('returns WJU16 for females under 16', () => {
      expect(getLadvAgeClass(2011, 'w', 2026)).toBe('WJU16') // age 15
    })

    it('returns MJU18 for males aged 16–17', () => {
      expect(getLadvAgeClass(2010, 'm', 2026)).toBe('MJU18') // age 16
      expect(getLadvAgeClass(2009, 'm', 2026)).toBe('MJU18') // age 17
    })

    it('returns WJU18 for females aged 16–17', () => {
      expect(getLadvAgeClass(2010, 'w', 2026)).toBe('WJU18') // age 16
    })

    it('returns MJU20 for males aged 18–19', () => {
      expect(getLadvAgeClass(2008, 'm', 2026)).toBe('MJU20') // age 18
      expect(getLadvAgeClass(2007, 'm', 2026)).toBe('MJU20') // age 19
    })

    it('returns WJU20 for females aged 18–19', () => {
      expect(getLadvAgeClass(2008, 'w', 2026)).toBe('WJU20') // age 18
    })
  })

  describe('senior class (20–34)', () => {
    it('returns M for males aged 20–34', () => {
      expect(getLadvAgeClass(2006, 'm', 2026)).toBe('M') // age 20
      expect(getLadvAgeClass(1998, 'm', 2026)).toBe('M') // age 28
      expect(getLadvAgeClass(1992, 'm', 2026)).toBe('M') // age 34
    })

    it('returns W for females aged 20–34', () => {
      expect(getLadvAgeClass(1992, 'w', 2026)).toBe('W') // age 34
    })
  })

  describe('masters classes', () => {
    it('returns M35 for males aged 35–39', () => {
      expect(getLadvAgeClass(1991, 'm', 2026)).toBe('M35') // age 35
      expect(getLadvAgeClass(1987, 'm', 2026)).toBe('M35') // age 39
    })

    it('returns M40 for males aged 40–44', () => {
      expect(getLadvAgeClass(1986, 'm', 2026)).toBe('M40') // age 40
      expect(getLadvAgeClass(1982, 'm', 2026)).toBe('M40') // age 44
    })

    it('returns M50 for males aged 50–54', () => {
      expect(getLadvAgeClass(1976, 'm', 2026)).toBe('M50') // age 50
    })

    it('returns W45 for females aged 45–49', () => {
      expect(getLadvAgeClass(1981, 'w', 2026)).toBe('W45') // age 45
      expect(getLadvAgeClass(1977, 'w', 2026)).toBe('W45') // age 49
    })

    it('returns correct masters class at high ages', () => {
      expect(getLadvAgeClass(1951, 'm', 2026)).toBe('M75') // age 75
    })
  })

  describe('boundary: exactly 35', () => {
    it('does not return M for age 35 (first masters bracket)', () => {
      expect(getLadvAgeClass(1991, 'm', 2026)).not.toBe('M')
      expect(getLadvAgeClass(1991, 'm', 2026)).toBe('M35')
    })
  })
})
