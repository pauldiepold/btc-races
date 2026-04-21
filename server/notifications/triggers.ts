import { notificationService } from './service'
import { formatEventDate } from '~~/shared/utils/events'

/**
 * N-05: Neues Event veröffentlicht — Benachrichtigung an alle aktiven Mitglieder.
 * E-Mail und Push sind Opt-in; die Kanalauswahl passiert im notificationService.
 * Fire-and-forget — Fehler werden nur geloggt, nicht an den Caller weitergereicht.
 */
export function triggerNewEventNotification(eventData: {
  id: number
  name: string
  date: string | null
  location: string | null
  registrationDeadline: string | null
}): void {
  void (async () => {
    try {
      const siteUrl = useRuntimeConfig().public.siteUrl

      await notificationService.send({
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
  })()
}
