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

const { eventType } = defineProps<Props>()

const eventLabel = computed(() => getEventTypeLabel(eventType ?? 'competition'))
</script>

<template>
  <EmailLayout
    :header-title="`${eventLabel} findet doch statt`"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      {{ adminName }} hat <strong>{{ eventName }}</strong> reaktiviert. Das Event findet wie geplant statt.
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
