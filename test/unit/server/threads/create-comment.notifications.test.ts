import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createComment,
  editComment,
  setOverride,
  type AppDb,
  type ThreadActor,
} from '~~/server/threads'
import { createTestDb, type TestDb } from '../../../helpers/test-db'
import { loadNotificationJobs } from '../../../helpers/notification-jobs'

let testDb: TestDb
let db: AppDb

beforeEach(async () => {
  testDb = await createTestDb()
  db = testDb.db
})

afterEach(async () => {
  await testDb.cleanup()
})

async function seedUser(suffix: string): Promise<number> {
  const [user] = await testDb.db.insert(testDb.schema.users).values({
    email: `${suffix}-${Math.random()}@example.com`,
    firstName: suffix,
    membershipStatus: 'active',
  }).returning()
  return user.id
}

async function seedBeitrag(opts: { createdBy: number }): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    title: 'Über das Training',
    body: 'Body',
    lastActivityAt: new Date('2026-01-01'),
    createdBy: opts.createdBy,
  }).returning()
  return row.id
}

async function seedEvent(opts: { createdBy: number }): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.events).values({
    type: 'training',
    name: 'Bahntraining',
    date: '2026-06-01',
    createdBy: opts.createdBy,
  }).returning()
  return row.id
}

async function seedEventThread(eventId: number): Promise<number> {
  const [row] = await testDb.db.insert(testDb.schema.threads).values({
    roomSlug: 'training',
    eventId,
    lastActivityAt: new Date('2026-01-01'),
  }).returning()
  return row.id
}

async function seedRegistration(opts: { eventId: number, userId: number, status: 'registered' | 'yes' | 'maybe' | 'no' | 'canceled' }): Promise<void> {
  await testDb.db.insert(testDb.schema.registrations).values({
    eventId: opts.eventId,
    userId: opts.userId,
    status: opts.status,
  })
}

function selfActor(userId: number): ThreadActor {
  return { kind: 'self', userId }
}

async function newCommentJobRecipientIds(): Promise<number[]> {
  const jobs = await loadNotificationJobs(testDb)
  const job = [...jobs].reverse().find(j => j.type === 'thread_new_comment')
  if (!job) return []
  return job.payload._recipients.map(r => r.userId).sort((a, b) => a - b)
}

describe('createComment — notification trigger', () => {
  it('enqueues thread_new_comment for the thread author', async () => {
    const author = await seedUser('autor')
    const commenter = await seedUser('kommentator')
    const threadId = await seedBeitrag({ createdBy: author })

    await createComment({ threadId, body: 'Hallo' }, selfActor(commenter), { db })

    const jobs = await loadNotificationJobs(testDb)
    const job = jobs.find(j => j.type === 'thread_new_comment')
    expect(job).toBeDefined()
    expect(job!.actorUserId).toBe(commenter)
    expect(job!.payload._recipients.map(r => r.userId)).toEqual([author])
  })

  it('does not notify the triggering author', async () => {
    const author = await seedUser('autor')
    const threadId = await seedBeitrag({ createdBy: author })

    await createComment({ threadId, body: 'Selbstgespräch' }, selfActor(author), { db })

    const jobs = await loadNotificationJobs(testDb)
    const newCommentJobs = jobs.filter(j => j.type === 'thread_new_comment')
    // Entweder kein Job, oder ein Job mit leerer Recipients-Liste — beides ist akzeptabel.
    const recipients = newCommentJobs.flatMap(j => j.payload._recipients.map(r => r.userId))
    expect(recipients).not.toContain(author)
  })

  it('does not enqueue when there are no recipients', async () => {
    const author = await seedUser('autor')
    const threadId = await seedBeitrag({ createdBy: author })

    await createComment({ threadId, body: 'Selbstgespräch' }, selfActor(author), { db })

    const jobs = await loadNotificationJobs(testDb)
    expect(jobs.filter(j => j.type === 'thread_new_comment')).toHaveLength(0)
  })

  it('includes previous commenters as recipients', async () => {
    const author = await seedUser('autor')
    const c1 = await seedUser('c1')
    const c2 = await seedUser('c2')
    const threadId = await seedBeitrag({ createdBy: author })

    await createComment({ threadId, body: 'erste antwort' }, selfActor(c1), { db })
    await createComment({ threadId, body: 'zweite antwort' }, selfActor(c2), { db })

    // letzter Trigger c2 → Empfänger sind author + c1.
    const recipients = await newCommentJobRecipientIds()
    expect(recipients).toEqual([author, c1].sort((a, b) => a - b))
  })

  it('subtracts muted users from the recipients', async () => {
    const author = await seedUser('autor')
    const muter = await seedUser('muter')
    const trigger = await seedUser('trigger')
    const threadId = await seedBeitrag({ createdBy: author })

    // muter wäre als bisheriger Kommentator Empfänger, schaltet aber stumm.
    await createComment({ threadId, body: 'erst' }, selfActor(muter), { db })
    await setOverride({ threadId, state: 'muted' }, selfActor(muter), { db })

    await createComment({ threadId, body: 'neuer kommentar' }, selfActor(trigger), { db })

    const recipients = await newCommentJobRecipientIds()
    expect(recipients).not.toContain(muter)
    expect(recipients).toContain(author)
  })

  it('adds following users that are not automatic recipients', async () => {
    const author = await seedUser('autor')
    const follower = await seedUser('follower')
    const trigger = await seedUser('trigger')
    const threadId = await seedBeitrag({ createdBy: author })

    await setOverride({ threadId, state: 'following' }, selfActor(follower), { db })
    await createComment({ threadId, body: 'neu' }, selfActor(trigger), { db })

    const recipients = await newCommentJobRecipientIds()
    expect(recipients).toContain(follower)
  })

  it('includes event participants with status registered/yes/maybe on event threads', async () => {
    const eventOwner = await seedUser('owner')
    const eventId = await seedEvent({ createdBy: eventOwner })
    const threadId = await seedEventThread(eventId)

    const reg = await seedUser('registered')
    const yes = await seedUser('yes')
    const maybe = await seedUser('maybe')
    const no = await seedUser('no')
    const canceled = await seedUser('canceled')
    await seedRegistration({ eventId, userId: reg, status: 'registered' })
    await seedRegistration({ eventId, userId: yes, status: 'yes' })
    await seedRegistration({ eventId, userId: maybe, status: 'maybe' })
    await seedRegistration({ eventId, userId: no, status: 'no' })
    await seedRegistration({ eventId, userId: canceled, status: 'canceled' })

    const trigger = await seedUser('trigger')
    await createComment({ threadId, body: 'Wann gehts los?' }, selfActor(trigger), { db })

    const recipients = await newCommentJobRecipientIds()
    expect(recipients).toContain(reg)
    expect(recipients).toContain(yes)
    expect(recipients).toContain(maybe)
    expect(recipients).not.toContain(no)
    expect(recipients).not.toContain(canceled)
  })

  it('does not enqueue a notification when a comment is edited', async () => {
    const author = await seedUser('autor')
    const commenter = await seedUser('kommentator')
    const threadId = await seedBeitrag({ createdBy: author })

    const { id } = await createComment({ threadId, body: 'erst' }, selfActor(commenter), { db })

    const jobsBefore = await loadNotificationJobs(testDb)
    const newCommentBefore = jobsBefore.filter(j => j.type === 'thread_new_comment').length

    await editComment({ commentId: id, body: 'nachbearbeitet' }, selfActor(commenter), { db })

    const jobsAfter = await loadNotificationJobs(testDb)
    const newCommentAfter = jobsAfter.filter(j => j.type === 'thread_new_comment').length

    expect(newCommentAfter).toBe(newCommentBefore)
  })
})
