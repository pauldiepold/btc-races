import { runSeed } from '../utils/seed'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Seed database with test data (dev only)',
  },
  async run() {
    return await runSeed()
  },
})
