<script setup lang="ts">
import { computed } from 'vue'
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'
import type { EventType } from '~~/shared/utils/registration'
import { getEventTypeLabel } from '~~/shared/utils/registration'

interface Props {
  firstName?: string
  adminName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
  eventType?: EventType
}

const { adminName, eventType } = defineProps<Props>()

const eventLabel = computed(() => getEventTypeLabel(eventType ?? 'ladv'))
const isNeuterType = computed(() => eventType === 'training' || eventType === 'social')
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
      {{ adminName ?? 'Ein Admin' }} hat deine LADV-Meldung für <strong>{{ eventName }}</strong> zurückgezogen. Du bist damit nicht mehr für {{ isNeuterType ? 'dieses' : 'diesen' }} {{ eventLabel }} gemeldet.
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

    <EmailText>
      Bei Fragen wende dich an das Trainer-Team.
    </EmailText>
  </EmailLayout>
</template>
