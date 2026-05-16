import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requireCronAuth } from '../../../../server/utils/cron-auth'

type FakeEvent = { headers?: Record<string, string> }

beforeEach(() => {
  vi.stubGlobal('useRuntimeConfig', () => ({ cronToken: 'secret' }))
  vi.stubGlobal('getHeader', (event: FakeEvent, name: string) => event.headers?.[name.toLowerCase()])
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

describe('requireCronAuth', () => {
  it('passes for the correct bearer token', () => {
    expect(() => requireCronAuth({ headers: { authorization: 'Bearer secret' } } as never)).not.toThrow()
  })

  it('throws 401 when the header is missing', () => {
    expect(() => requireCronAuth({ headers: {} } as never)).toThrowError(
      expect.objectContaining({ statusCode: 401, statusMessage: 'Unauthorized' }),
    )
  })

  it('throws 401 for the wrong token', () => {
    expect(() => requireCronAuth({ headers: { authorization: 'Bearer wrong' } } as never)).toThrowError(
      expect.objectContaining({ statusCode: 401, statusMessage: 'Unauthorized' }),
    )
  })

  it('throws 401 for a non-bearer scheme even with the right token', () => {
    expect(() => requireCronAuth({ headers: { authorization: 'secret' } } as never)).toThrowError(
      expect.objectContaining({ statusCode: 401, statusMessage: 'Unauthorized' }),
    )
  })
})
