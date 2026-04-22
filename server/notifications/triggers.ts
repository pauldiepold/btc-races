import { notificationService } from './service'
import { formatEventDate } from '~~/shared/utils/events'

/**
 * N-05: Neues Event veröffentlicht — Benachrichtigung an alle aktiven Mitglieder.
 * Legt einen Queue-Job an (INSERT). Der Cron-Worker verarbeitet ihn asynchron.
 * Fehler werden geloggt und nicht an den Caller weitergereicht.
 */
export async function triggerNewEventNotification(eventData: {
  id: number
  name: string
  date: string | null
  location: string | null
  registrationDeadline: string | null
}): Promise<void> {
  try {
    const siteUrl = useRuntimeConfig().public.siteUrl

    await notificationService.enqueue({
      type: 'new_event',
      recipients: 'all_members',
      payload: {
        eventName: eventData.name,
        eventDate: formatEventDate(eventData.date) ?? undefined,
        eventLocation: eventData.location ?? undefined,
        registrationDeadline: formatEventDate(eventData.registrationDeadline) ?? undefined,
        eventLink: `${siteUrl}/${encodeEventId(eventData.id)}`,
      },
      eventId: eventData.id,
    })
  }
  catch (err) {
    console.error('[Notification] Fehler beim Erstellen des Jobs:', err)
  }
}
