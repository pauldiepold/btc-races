<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'

interface Props {
  firstName?: string
  adminName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
}

const {
  firstName,
  adminName,
  eventName,
  eventDate,
  eventLocation,
  registrationDeadline,
  eventVenue,
  eventLink,
} = defineProps<Props>()
</script>

<template>
  <EmailLayout
    header-title="Anmeldung geändert"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      {{ adminName ?? 'Ein Admin' }} hat deine Anmeldung für <strong>{{ eventName }}</strong> geändert. Bitte prüfe deinen aktuellen Anmeldestatus in der App.
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
