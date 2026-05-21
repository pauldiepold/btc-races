<script setup lang="ts">
import { computed } from 'vue'
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'
import DisciplineList from './components/DisciplineList.vue'
import type { EventType } from '~~/shared/utils/registration'
import { getEventTypeLabel } from '~~/shared/utils/registration'
import type { DisciplineStatusItem } from '~~/shared/utils/ladv-diff'

interface Props {
  firstName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
  eventType?: EventType
  disciplines?: DisciplineStatusItem[]
}

const { eventType, disciplines } = defineProps<Props>()

const eventLabel = computed(() => getEventTypeLabel(eventType ?? 'competition'))
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
      Du bist jetzt zum folgenden {{ eventLabel }} angemeldet:
    </EmailText>

    <DisciplineList
      heading="Deine Disziplinen"
      :items="disciplines"
      show-status
    />

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
