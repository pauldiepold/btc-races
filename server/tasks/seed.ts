import { db, schema } from 'hub:db'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Seed database with initial users',
  },
  async run() {
    console.log('Seeding database...')

    const testUsers = [
      {
        id: crypto.randomUUID(),
        name: 'Alice Admin',
        email: 'alice@example.com',
        role: 'admin' as const,
      },
      {
        id: crypto.randomUUID(),
        name: 'Bob Member',
        email: 'bob@example.com',
        role: 'member' as const,
      },
      {
        id: crypto.randomUUID(),
        name: 'Charlie Runner',
        email: 'charlie@example.com',
        role: 'member' as const,
      },
      {
        id: crypto.randomUUID(),
        name: 'Doris Dash',
        email: 'doris@example.com',
        role: 'member' as const,
      },
      {
        id: crypto.randomUUID(),
        name: 'Erik Endurance',
        email: 'erik@example.com',
        role: 'member' as const,
      },
    ]

    await db.insert(schema.users).values(testUsers).onConflictDoNothing()

    return { result: 'Database seeded successfully with 5 users' }
  },
})
