<script setup lang="ts">
import { computed } from 'vue'
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'
import type { EventType } from '~~/shared/utils/registration'
import { getEventTypeLabel, getNewEventLabel } from '~~/shared/utils/registration'
import { eventTypeCapabilities } from '~~/shared/utils/event-types/capabilities'

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

const eventLabel = computed(() => getEventTypeLabel(eventType ?? 'competition'))
const newEventLabel = computed(() => getNewEventLabel(eventType ?? 'competition'))
const isNeuterType = computed(() => eventTypeCapabilities[eventType ?? 'competition'].grammaticalGender === 'n')
</script>

<template>
  <EmailLayout
    :header-title="newEventLabel"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      {{ adminName ?? 'Ein Admin' }} hat {{ isNeuterType ? 'ein neues' : 'einen neuen' }} {{ eventLabel }} eingestellt: <strong>{{ eventName }}</strong>. Schau rein und melde dich an, wenn du dabei sein möchtest.
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
