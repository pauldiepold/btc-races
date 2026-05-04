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

const { adminName } = defineProps<Props>()
</script>

<template>
  <EmailLayout
    header-title="LADV-Meldung zurückgezogen"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      {{ adminName ?? 'Ein Admin' }} hat deine LADV-Meldung für <strong>{{ eventName }}</strong> zurückgezogen. Du bist damit nicht mehr für diesen Wettkampf gemeldet.
    </EmailText>

    <EventDetails
      :event-name="eventName"
      :event-date="eventDate"
      :event-location="eventLocation"
      :registration-deadline="registrationDeadline"
      :event-venue="eventVenue"
      :event-link="eventLink"
    />

    <EmailText>
      Bei Fragen wende dich an das Trainer-Team.
    </EmailText>
  </EmailLayout>
</template>
