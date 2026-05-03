import { runSyncLadvEvents } from '../utils/sync-ladv-events'

export default defineTask({
  meta: {
    name: 'sync:ladv-events',
    description: 'Sync upcoming LADV events from LADV API',
  },
  async run() {
    return await runSyncLadvEvents()
  },
})
