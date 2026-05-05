<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'
import type { EventType } from '~~/shared/utils/registration'

interface Props {
  firstName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
  eventType?: EventType
}

const { eventType } = defineProps<Props>()
</script>

<template>
  <EmailLayout
    header-title="Es geht los"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      <strong>{{ eventName }}</strong> findet in zwei Tagen statt. Schau vorher nochmal rein, prüfe deine Anmeldung und halt die Daten zum Veranstaltungsort bereit.
    </EmailText>

    <EventDetails
      :event-name="eventName"
      :event-date="eventDate"
      :event-location="eventLocation"
      :registration-deadline="registrationDeadline"
      :event-venue="eventVenue"
      :event-link="eventLink"
      :event-type="eventType"
    />
  </EmailLayout>
</template>
