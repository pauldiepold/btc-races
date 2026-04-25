import { db, schema } from 'hub:db'
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { notificationService } from '~~/server/notifications/service'
import { formatEventDate } from '~~/shared/utils/events'
import { addDaysToIsoDate, todayIsoDate } from '~~/shared/utils/reminder-dates'
import type { NotificationType } from '~~/shared/types/notifications'

interface ReminderResult {
  type: NotificationType
  eventId: number
  eventName: string
  status: 'created' | 'skipped' | 'error'
  error?: string
}

/**
 * Prüft, ob für diesen Event + Typ bereits ein Job existiert (nicht `failed`).
 * `failed` ist erlaubt, damit ein fehlgeschlagener Versand beim nächsten Tag neu versucht wird.
 */
async function hasExistingJob(type: NotificationType, eventId: number): Promise<boolean> {
  const rows = await db.select({ id: schema.notificationJobs.id })
    .from(schema.notificationJobs)
    .where(
      and(
        eq(schema.notificationJobs.type, type),
        sql`json_extract(${schema.notificationJobs.payload}, '$.eventId') = ${eventId}`,
        inArray(schema.notificationJobs.status, ['pending', 'processing', 'done']),
      ),
    )
    .limit(1)
  return rows.length > 0
}

async function getRegisteredRecipients(eventId: number) {
  return db.select({
    userId: schema.users.id,
    email: schema.users.email,
    firstName: schema.users.firstName,
  })
    .from(schema.registrations)
    .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .where(
      and(
        eq(schema.registrations.eventId, eventId),
        inArray(schema.registrations.status, ['registered', 'yes']),
      ),
    )
}

async function getAdminParticipantList(eventId: number): Promise<Array<{ name: string, disciplines?: string }>> {
  const rows = await db.select({
    firstName: schema.users.firstName,
    lastName: schema.users.lastName,
    wishDisciplines: schema.registrations.wishDisciplines,
  })
    .from(schema.registrations)
    .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .where(
      and(
        eq(schema.registrations.eventId, eventId),
        inArray(schema.registrations.status, ['registered', 'yes']),
      ),
    )

  return rows.map((row) => {
    const name = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim()
    const wish = (row.wishDisciplines as Array<{ discipline: string }> | null) ?? []
    const disciplineList = [...new Set(wish.map(d => d.discipline))].join(', ')
    return { name, disciplines: disciplineList || undefined }
  })
}

function buildEventPayload(dbEvent: typeof schema.events.$inferSelect, siteUrl: string) {
  return {
    eventName: dbEvent.name,
    eventDate: formatEventDate(dbEvent.date) ?? undefined,
    eventLocation: dbEvent.location ?? undefined,
    registrationDeadline: formatEventDate(dbEvent.registrationDeadline) ?? undefined,
    eventLink: `${siteUrl}/${encodeEventId(dbEvent.id)}`,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const authHeader = getHeader(event, 'Authorization')

  if (authHeader !== `Bearer ${config.cronToken}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const today = todayIsoDate()
  const siteUrl = config.public.siteUrl
  const results: ReminderResult[] = []

  // -----------------------------------------------------------------------
  // N-06: Meldefrist in 5 Tagen → angemeldete Mitglieder
  // N-07: Meldefrist in 3 Tagen → Admins (inkl. Teilnehmerliste)
  // -----------------------------------------------------------------------
  const deadlineReminders = [
    { days: 5, type: 'reminder_deadline_athlete' as const },
    { days: 3, type: 'reminder_deadline_admin' as const },
  ]

  for (const { days, type } of deadlineReminders) {
    const targetDate = addDaysToIsoDate(today, days)
    const events = await db.select()
      .from(schema.events)
      .where(
        and(
          eq(schema.events.registrationDeadline, targetDate),
          isNull(schema.events.cancelledAt),
        ),
      )

    for (const dbEvent of events) {
      try {
        if (await hasExistingJob(type, dbEvent.id)) {
          results.push({ type, eventId: dbEvent.id, eventName: dbEvent.name, status: 'skipped' })
          continue
        }

        const payload = buildEventPayload(dbEvent, siteUrl)

        if (type === 'reminder_deadline_athlete') {
          const recipients = await getRegisteredRecipients(dbEvent.id)
          if (recipients.length === 0) {
            results.push({ type, eventId: dbEvent.id, eventName: dbEvent.name, status: 'skipped' })
            continue
          }
          await notificationService.enqueue({
            type,
            recipients: recipients.map(r => ({
              userId: r.userId,
              email: r.email,
              firstName: r.firstName ?? undefined,
            })),
            payload,
            eventId: dbEvent.id,
          })
        }
        else {
          const participants = await getAdminParticipantList(dbEvent.id)
          await notificationService.enqueue({
            type,
            recipients: 'all_admins',
            payload: { ...payload, participants },
            eventId: dbEvent.id,
          })
        }

        results.push({ type, eventId: dbEvent.id, eventName: dbEvent.name, status: 'created' })
      }
      catch (err) {
        results.push({
          type,
          eventId: dbEvent.id,
          eventName: dbEvent.name,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  // -----------------------------------------------------------------------
  // N-08: Event in 2 Tagen → angemeldete Mitglieder
  // -----------------------------------------------------------------------
  {
    const type = 'reminder_event' as const
    const targetDate = addDaysToIsoDate(today, 2)
    const events = await db.select()
      .from(schema.events)
      .where(
        and(
          eq(schema.events.date, targetDate),
          isNull(schema.events.cancelledAt),
          isNotNull(schema.events.date),
        ),
      )

    for (const dbEvent of events) {
      try {
        if (await hasExistingJob(type, dbEvent.id)) {
          results.push({ type, eventId: dbEvent.id, eventName: dbEvent.name, status: 'skipped' })
          continue
        }

        const recipients = await getRegisteredRecipients(dbEvent.id)
        if (recipients.length === 0) {
          results.push({ type, eventId: dbEvent.id, eventName: dbEvent.name, status: 'skipped' })
          continue
        }

        await notificationService.enqueue({
          type,
          recipients: recipients.map(r => ({
            userId: r.userId,
            email: r.email,
            firstName: r.firstName ?? undefined,
          })),
          payload: buildEventPayload(dbEvent, siteUrl),
          eventId: dbEvent.id,
        })

        results.push({ type, eventId: dbEvent.id, eventName: dbEvent.name, status: 'created' })
      }
      catch (err) {
        results.push({
          type,
          eventId: dbEvent.id,
          eventName: dbEvent.name,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  return {
    date: today,
    results,
    summary: {
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    },
  }
})
