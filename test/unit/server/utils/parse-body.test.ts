import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { parseBody } from '../../../../server/utils/parse-body'

const schema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  age: z.number().int().positive(),
})

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

function eventWithBody(body: unknown) {
  vi.stubGlobal('readBody', async () => body)
  return {} as never
}

describe('parseBody', () => {
  it('returns parsed data for a valid body', async () => {
    await expect(parseBody(eventWithBody({ name: 'Hans', age: 7 }), schema)).resolves.toEqual({
      name: 'Hans',
      age: 7,
    })
  })

  it('throws 400 with the first issue message for invalid body', async () => {
    await expect(parseBody(eventWithBody({ name: '', age: 7 }), schema)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Name ist erforderlich',
      message: 'Name ist erforderlich',
    })
  })

  it('throws 400 with default message when no issue message is set', async () => {
    const noMsgSchema = z.object({ x: z.string() })
    const err: { statusCode: number, statusMessage: string } = await parseBody(
      eventWithBody({ x: 5 }),
      noMsgSchema,
    ).catch(e => e)
    expect(err.statusCode).toBe(400)
    expect(typeof err.statusMessage).toBe('string')
  })
})
