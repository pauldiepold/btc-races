import type { H3Event } from 'h3'
import type { ZodType } from 'zod'

export async function parseBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const result = schema.safeParse(await readBody(event))
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? 'Validierungsfehler'
    throw createError({ statusCode: 400, statusMessage: msg, message: msg })
  }
  return result.data
}
