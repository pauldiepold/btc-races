export type DomainError = {
  readonly code: string
  readonly message: string
  readonly data?: unknown
}

export function makeDomainErrorMapping<E extends DomainError>(
  ErrorClass: new (...args: never[]) => E,
  toStatus: (code: E['code']) => number,
) {
  return async function withDomainErrorMapping<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    }
    catch (err) {
      if (err instanceof ErrorClass) {
        throw createError({
          statusCode: toStatus(err.code),
          statusMessage: err.message,
          data: err.data,
        })
      }
      throw err
    }
  }
}
