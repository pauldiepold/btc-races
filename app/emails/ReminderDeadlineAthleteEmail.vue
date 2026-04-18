<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
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

withDefaults(defineProps<Props>(), {
  firstName: 'Max',
  eventName: 'Herbstmeeting 2025',
  eventDate: '15.03.2025',
  eventLocation: 'Berlin',
  registrationDeadline: '10.03.2025',
  eventVenue: undefined,
  eventLink: 'https://btc-races.de/events/1',
})
</script>

<template>
  <EmailLayout
    header-title="Meldefrist endet bald"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      die Meldefrist für <strong>{{ eventName }}</strong> endet am <strong>{{ registrationDeadline }}</strong>. Falls du deine Meldung noch anpassen willst, tu das jetzt.
    </EmailText>

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
