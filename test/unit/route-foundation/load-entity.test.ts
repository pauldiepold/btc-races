import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppDb } from '../../../server/registration'
import { loadEventOrThrow } from '../../../server/utils/load-entity'
import { createTestDb, type TestDb } from '../../helpers/test-db'

let testDb: TestDb
let db: AppDb

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db as unknown as AppDb
  vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number, statusMessage: string }
    err.statusCode = opts.statusCode
    err.statusMessage = opts.statusMessage
    return err
  })
})

afterEach(async () => {
  await testDb.cleanup()
  vi.unstubAllGlobals()
})

describe('loadEventOrThrow', () => {
  it('returns the event when it exists', async () => {
    const inserted = await db.insert(testDb.schema.events).values({
      name: 'Test',
      type: 'training',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: testDb.schema.events.id })

    const dbEvent = await loadEventOrThrow(inserted[0]!.id, db)
    expect(dbEvent.name).toBe('Test')
  })

  it('throws 404 when the event does not exist', async () => {
    await expect(loadEventOrThrow(99_999, db)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Event nicht gefunden',
    })
  })
})
