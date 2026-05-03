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

defineProps<Props>()
</script>

<template>
  <EmailLayout
    header-title="Anmeldebestätigung"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      Du bist jetzt zum folgenden Wettkampf angemeldet:
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
