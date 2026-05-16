import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegistrationError, withRegistrationErrorMapping } from '../../../../server/registration'

beforeEach(() => {
  vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number, statusMessage: string }
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('withRegistrationErrorMapping', () => {
  it('returns the value for non-throwing functions', async () => {
    await expect(withRegistrationErrorMapping(async () => 'ok')).resolves.toBe('ok')
  })

  it('maps event_not_found to 404', async () => {
    await expect(
      withRegistrationErrorMapping(async () => {
        throw new RegistrationError('event_not_found', 'Event weg')
      }),
    ).rejects.toMatchObject({ statusCode: 404, statusMessage: 'Event weg' })
  })

  it('maps already_registered to 409', async () => {
    await expect(
      withRegistrationErrorMapping(async () => {
        throw new RegistrationError('already_registered')
      }),
    ).rejects.toMatchObject({ statusCode: 409 })
  })

  it('maps deadline_expired to 422', async () => {
    await expect(
      withRegistrationErrorMapping(async () => {
        throw new RegistrationError('deadline_expired')
      }),
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('maps forbidden to 403', async () => {
    await expect(
      withRegistrationErrorMapping(async () => {
        throw new RegistrationError('forbidden')
      }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('rethrows non-RegistrationError unchanged', async () => {
    const original = new Error('boom')
    await expect(
      withRegistrationErrorMapping(async () => {
        throw original
      }),
    ).rejects.toBe(original)
  })
})
