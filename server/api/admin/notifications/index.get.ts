import { db, schema } from 'hub:db'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { requireSuperuser } from '~~/server/utils/auth'
import type { NotificationType, NotificationChannel } from '~~/shared/types/notifications'

const querySchema = z.object({
  status: z.enum(['all', 'pending', 'processing', 'done', 'failed']).optional().default('all'),
  type: z.string().optional(),
  eventId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
})

export default defineEventHandler(async (event) => {
  await requireSuperuser(event)

  const rawQuery = getQuery(event)
  const parsed = querySchema.safeParse(rawQuery)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Ungültige Query' })
  }

  const { status, type, eventId, page, limit } = parsed.data

  const filters = []
  if (status !== 'all') filters.push(eq(schema.notificationJobs.status, status))
  if (type) filters.push(eq(schema.notificationJobs.type, type as NotificationType))
  if (eventId !== undefined) {
    filters.push(sql`json_extract(${schema.notificationJobs.payload}, '$.eventId') = ${eventId}`)
  }
  const where = filters.length > 0 ? and(...filters) : undefined

  const [totalRow] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.notificationJobs)
    .where(where)

  const jobs = await db.select()
    .from(schema.notificationJobs)
    .where(where)
    .orderBy(desc(schema.notificationJobs.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  const jobIds = jobs.map(j => j.id)

  const deliveries = jobIds.length > 0
    ? await db.select({
        jobId: schema.notificationDeliveries.jobId,
        channel: schema.notificationDeliveries.channel,
        recipientId: schema.notificationDeliveries.recipientId,
        status: schema.notificationDeliveries.status,
        error: schema.notificationDeliveries.error,
        sentAt: schema.notificationDeliveries.sentAt,
        recipientFirstName: schema.users.firstName,
        recipientLastName: schema.users.lastName,
        recipientEmail: schema.users.email,
      })
        .from(schema.notificationDeliveries)
        .innerJoin(schema.users, eq(schema.notificationDeliveries.recipientId, schema.users.id))
        .where(inArray(schema.notificationDeliveries.jobId, jobIds))
    : []

  const deliveriesByJob = new Map<number, typeof deliveries>()
  for (const d of deliveries) {
    const existing = deliveriesByJob.get(d.jobId) ?? []
    existing.push(d)
    deliveriesByJob.set(d.jobId, existing)
  }

  const items = jobs.map((job) => {
    let parsedPayload: Record<string, unknown> = {}
    try {
      const raw = JSON.parse(job.payload) as Record<string, unknown>
      // _recipients enthält potenziell viele User-Objekte — für die Liste nicht nötig
      const { _recipients: _r, ...rest } = raw
      parsedPayload = rest
    }
    catch {
      parsedPayload = {}
    }

    const jobDeliveries = (deliveriesByJob.get(job.id) ?? []).map(d => ({
      channel: d.channel as NotificationChannel,
      recipientId: d.recipientId,
      recipientName: `${d.recipientFirstName ?? ''} ${d.recipientLastName ?? ''}`.trim() || d.recipientEmail,
      status: d.status,
      error: d.error,
      sentAt: d.sentAt?.toISOString() ?? null,
    }))

    return {
      id: job.id,
      type: job.type as NotificationType,
      status: job.status,
      attempts: job.attempts,
      error: job.error,
      payload: parsedPayload,
      createdAt: job.createdAt.toISOString(),
      processedAt: job.processedAt?.toISOString() ?? null,
      deliveries: jobDeliveries,
      deliveryCount: jobDeliveries.length,
    }
  })

  const [statsTotal] = await db.select({ count: sql<number>`count(*)` }).from(schema.notificationJobs)
  const statsByStatus = await db.select({
    status: schema.notificationJobs.status,
    count: sql<number>`count(*)`,
  })
    .from(schema.notificationJobs)
    .groupBy(schema.notificationJobs.status)

  const stats = {
    total: Number(statsTotal?.count ?? 0),
    pending: 0,
    processing: 0,
    done: 0,
    failed: 0,
  }
  for (const row of statsByStatus) {
    const key = row.status as keyof typeof stats
    if (key in stats) stats[key] = Number(row.count)
  }

  return {
    items,
    pagination: {
      total: Number(totalRow?.count ?? 0),
      page,
      limit,
      pages: Math.ceil(Number(totalRow?.count ?? 0) / limit),
    },
    stats,
  }
})
