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

export {
  canCreateInAnyRoom,
  canCreateThread,
  canDeleteComment,
  canDeleteThread,
  canEditComment,
  canEditThread,
} from './rules'

export type { AppDb, ThreadRow, ThreadInsert } from './persistence'

export { createThread } from './create-thread'
export type {
  CreateThreadInput,
  CreateThreadDeps,
  CreateThreadResult,
} from './create-thread'

export { listThreads } from './list-threads'
export type { ListThreadsFilter, ListThreadsDeps } from './list-threads'

export { getThread } from './get-thread'
export type { GetThreadInput, GetThreadDeps } from './get-thread'

export { createComment } from './create-comment'
export type {
  CreateCommentInput,
  CreateCommentDeps,
  CreateCommentResult,
} from './create-comment'

export { listComments } from './list-comments'
export type { ListCommentsInput, ListCommentsDeps } from './list-comments'

export { editThread } from './edit-thread'
export type { EditThreadInput, EditThreadDeps } from './edit-thread'

export { deleteThread } from './delete-thread'
export type { DeleteThreadInput, DeleteThreadDeps } from './delete-thread'

export { editComment } from './edit-comment'
export type { EditCommentInput, EditCommentDeps } from './edit-comment'

export { deleteComment } from './delete-comment'
export type { DeleteCommentInput, DeleteCommentDeps } from './delete-comment'
