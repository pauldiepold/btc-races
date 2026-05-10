import type { NotificationDecision, Notifier, NotifyContext } from '~~/server/registration'

export type RecordedDispatch = {
  decisions: NotificationDecision[]
  ctx: NotifyContext
}

export function createRecorderNotifier() {
  const dispatches: RecordedDispatch[] = []
  const notifier: Notifier = {
    dispatch: async (decisions, ctx) => {
      dispatches.push({ decisions, ctx })
    },
  }
  return {
    notifier,
    dispatches,
    get decisions() {
      return dispatches.flatMap(d => d.decisions)
    },
  }
}
