import { describe, it, expect } from 'vitest'
import { validateAdminRegistration } from '../../server/utils/admin-register'

describe('validateAdminRegistration', () => {
  describe('ladv', () => {
    it('verlangt mindestens eine Disziplin', () => {
      const result = validateAdminRegistration('ladv', { disciplines: [] })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/Disziplin/)
    })

    it('verlangt disciplines-Feld', () => {
      const result = validateAdminRegistration('ladv', {})
      expect(result.ok).toBe(false)
    })

    it('akzeptiert Disziplinen und setzt Status registered', () => {
      const result = validateAdminRegistration('ladv', {
        disciplines: [{ discipline: '100', ageClass: 'M' }],
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.status).toBe('registered')
        expect(result.wishDisciplines).toEqual([{ discipline: '100', ageClass: 'M' }])
      }
    })

    it('lehnt Status maybe ab', () => {
      const result = validateAdminRegistration('ladv', {
        status: 'maybe',
        disciplines: [{ discipline: '100', ageClass: 'M' }],
      })
      expect(result.ok).toBe(false)
    })
  })

  describe('competition', () => {
    it('akzeptiert Status registered', () => {
      const result = validateAdminRegistration('competition', { status: 'registered' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.status).toBe('registered')
        expect(result.wishDisciplines).toEqual([])
      }
    })

    it('akzeptiert Status maybe', () => {
      const result = validateAdminRegistration('competition', { status: 'maybe' })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.status).toBe('maybe')
    })

    it('lehnt Status no ab', () => {
      const result = validateAdminRegistration('competition', { status: 'no' })
      expect(result.ok).toBe(false)
    })

    it('default ohne Status ist registered', () => {
      const result = validateAdminRegistration('competition', {})
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.status).toBe('registered')
    })
  })

  describe('training', () => {
    it('lehnt Status registered ab', () => {
      const result = validateAdminRegistration('training', { status: 'registered' })
      expect(result.ok).toBe(false)
    })

    it.each(['yes', 'maybe', 'no'] as const)('akzeptiert Status %s', (status) => {
      const result = validateAdminRegistration('training', { status })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.status).toBe(status)
    })

    it('default ohne Status ist yes', () => {
      const result = validateAdminRegistration('training', {})
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.status).toBe('yes')
    })
  })

  describe('social', () => {
    it.each(['yes', 'maybe', 'no'] as const)('akzeptiert Status %s', (status) => {
      const result = validateAdminRegistration('social', { status })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.status).toBe(status)
    })

    it('default ohne Status ist yes', () => {
      const result = validateAdminRegistration('social', {})
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.status).toBe('yes')
    })
  })
})
