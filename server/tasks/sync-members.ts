import { runSyncMembers } from '../utils/sync-members'

export default defineTask({
  meta: {
    name: 'sync:members',
    description: 'Sync active members from Campai API to local database',
  },
  async run() {
    return await runSyncMembers()
  },
})
