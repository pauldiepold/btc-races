<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'
import DisciplineList from './components/DisciplineList.vue'

import type { EventType } from '~~/shared/utils/registration'
import type { DisciplineStatusItem } from '~~/shared/utils/ladv-diff'

interface Props {
  firstName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
  disciplines?: DisciplineStatusItem[]
  eventType?: EventType
}

const {
  firstName,
  eventName,
  eventDate,
  eventLocation,
  registrationDeadline,
  eventVenue,
  eventLink,
  disciplines,
  eventType,
} = defineProps<Props>()
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
