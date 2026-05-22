import { makeDomainErrorMapping } from '~~/server/utils/domain-error'
import { ThreadError } from './errors'
import { errorToHttpStatus } from './http-error'

export { ThreadError } from './errors'
export type { ThreadErrorCode } from './errors'

export { errorToHttpStatus } from './http-error'

export const withThreadErrorMapping = makeDomainErrorMapping(
  ThreadError,
  errorToHttpStatus,
)

export type { ActorKind, ThreadActor } from './actor'
export { actorFromSession } from './actor'

export type { Room } from './rooms'
export { ROOMS, getRoom } from './rooms'

export { canCreateThread, canCreateInAnyRoom } from './rules'

export type { AppDb, ThreadRow, ThreadInsert } from './persistence'

export { createThread } from './create-thread'
export type {
  CreateThreadInput,
  CreateThreadDeps,
  CreateThreadResult,
} from './create-thread'

export { listThreads } from './list-threads'
export type { ListThreadsFilter, ListThreadsDeps } from './list-threads'
