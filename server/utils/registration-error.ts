import { RegistrationError, errorToHttpStatus } from '~~/server/registration'

export async function withRegistrationErrorMapping<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  }
  catch (err) {
    if (err instanceof RegistrationError) {
      throw createError({
        statusCode: errorToHttpStatus(err.code),
        statusMessage: err.message,
      })
    }
    throw err
  }
}
