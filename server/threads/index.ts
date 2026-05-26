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

export { eventTypeToRoom } from './event-mapping'

export { ensureEventThread } from './ensure-event-thread'
export type {
  EnsureEventThreadInput,
  EnsureEventThreadDeps,
  EnsureEventThreadResult,
} from './ensure-event-thread'

export { backfillEventThreads } from './backfill-event-threads'
export type {
  BackfillEventThreadsDeps,
  BackfillEventThreadsResult,
} from './backfill-event-threads'

export {
  canCreateInAnyRoom,
  canCreateThread,
  canDeleteComment,
  canDeleteThread,
  canEditComment,
  canEditThread,
  canPinComment,
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

export { pinComment, unpinComment } from './pin-comment'
export type { PinCommentInput, PinCommentDeps } from './pin-comment'

export { setOverride } from './set-override'
export type { SetOverrideInput, SetOverrideDeps } from './set-override'

export {
  resolveRecipients,
  loadRecipientInputs,
} from './recipients'
export type {
  ResolveRecipientsInput,
  ThreadOverrideEntry,
  ThreadOverrideState,
  LoadRecipientInputsArgs,
} from './recipients'
