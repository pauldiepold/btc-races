import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encodeEventId } from '../../../../server/utils/sqids'
import { requireEventIdParam, requireNumericIdParam } from '../../../../server/utils/route-params'

type FakeEvent = { params?: Record<string, string | undefined> }

beforeEach(() => {
  vi.stubGlobal('getRouterParam', (event: FakeEvent, key: string) => event.params?.[key])
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

function expectError(fn: () => unknown, statusCode: number, statusMessage: string) {
  expect(fn).toThrowError(
    expect.objectContaining({ statusCode, statusMessage }),
  )
}

describe('requireEventIdParam', () => {
  it('decodes a valid sqid to its numeric id', () => {
    const sqid = encodeEventId(42)
    expect(requireEventIdParam({ params: { id: sqid } } as never)).toBe(42)
  })

  it('throws 400 when the param is missing', () => {
    expectError(() => requireEventIdParam({ params: {} } as never), 400, 'Fehlende Event-ID')
  })

  it('throws 404 when the sqid cannot be decoded', () => {
    expectError(() => requireEventIdParam({ params: { id: '!!!!' } } as never), 404, 'Event nicht gefunden')
  })
})

describe('requireNumericIdParam', () => {
  it('returns the parsed integer for a valid id', () => {
    expect(requireNumericIdParam({ params: { id: '7' } } as never, 'Anmeldungs-ID')).toBe(7)
  })

  it('throws 400 with the given label when missing', () => {
    expectError(
      () => requireNumericIdParam({ params: {} } as never, 'Anmeldungs-ID'),
      400,
      'Fehlende Anmeldungs-ID',
    )
  })

  it('throws 400 for non-numeric input', () => {
    expectError(
      () => requireNumericIdParam({ params: { id: 'abc' } } as never, 'Job-ID'),
      400,
      'Ungültige Job-ID',
    )
  })

  it('throws 400 for zero or negative ids', () => {
    expectError(
      () => requireNumericIdParam({ params: { id: '0' } } as never, 'Anmeldungs-ID'),
      400,
      'Ungültige Anmeldungs-ID',
    )
    expectError(
      () => requireNumericIdParam({ params: { id: '-3' } } as never, 'Anmeldungs-ID'),
      400,
      'Ungültige Anmeldungs-ID',
    )
  })

  it('throws 400 for floats', () => {
    expectError(
      () => requireNumericIdParam({ params: { id: '1.5' } } as never, 'Anmeldungs-ID'),
      400,
      'Ungültige Anmeldungs-ID',
    )
  })

  it('reads a custom param name when given', () => {
    expect(requireNumericIdParam({ params: { userId: '5' } } as never, 'User-ID', 'userId')).toBe(5)
  })

  it('throws on missing custom param', () => {
    expectError(
      () => requireNumericIdParam({ params: {} } as never, 'User-ID', 'userId'),
      400,
      'Fehlende User-ID',
    )
  })
})
