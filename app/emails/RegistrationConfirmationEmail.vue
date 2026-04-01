<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EventDetails from './components/EventDetails.vue'

interface Props {
  firstName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
}

const {
  firstName = 'Max',
  eventName = 'Herbstmeeting 2025',
  eventDate = '15.03.2025',
  eventLocation = 'Berlin',
  registrationDeadline = '10.03.2025',
  eventVenue,
  eventLink = 'https://btc-races.de/events/1',
} = defineProps<Props>()

const styles = {
  text: {
    color: '#333',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 15px 0',
  },
  urlBox: {
    wordBreak: 'break-all' as const,
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    margin: '10px 0',
  },
}
</script>

<template>
  <EmailLayout
    header-title="Anmeldebestätigung"
    header-color="#ffb700"
  >
    <EText :style="styles.text">
      Hallo {{ firstName }},
    </EText>

    <EText :style="styles.text">
      Du bist jetzt zum folgenden Wettkampf angemeldet:
    </EText>

    <EventDetails
      :event-name="eventName"
      :event-date="eventDate"
      :event-location="eventLocation"
      :registration-deadline="registrationDeadline"
      :event-venue="eventVenue"
      :event-link="eventLink"
    />
  </EmailLayout>
</template>
