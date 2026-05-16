<script setup lang="ts">
import { computed } from 'vue'
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'
import type { EventType } from '~~/shared/utils/registration'
import { getEventTypeLabel } from '~~/shared/utils/registration'
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
  disciplines?: string[]
  eventType?: EventType
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
  disciplines = [],
  eventType,
} = defineProps<Props>()

const eventLabel = computed(() => getEventTypeLabel(eventType ?? 'ladv'))
const isNeuterType = computed(() => eventTypeCapabilities[eventType ?? 'ladv'].grammaticalGender === 'n')

const styles = {
  disciplineBox: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '3px',
    padding: '12px 16px',
    margin: '8px 0 16px 0',
  },
  disciplineLabel: {
    margin: '0 0 6px 0',
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#09090b',
  },
  disciplineList: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#3f3f46',
    lineHeight: '1.6',
  },
  disciplineItem: {
    margin: '2px 0',
  },
}
</script>

<template>
  <EmailLayout
    header-title="LADV-Meldung bestätigt"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      {{ adminName ?? 'Ein Admin' }} hat deine LADV-Meldung für <strong>{{ eventName }}</strong> bestätigt. Du bist damit offiziell für {{ isNeuterType ? 'das' : 'den' }} {{ eventLabel }} gemeldet.
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

    <ESection
      v-if="disciplines && disciplines.length > 0"
      :style="styles.disciplineBox"
    >
      <EText :style="styles.disciplineLabel">
        Deine gemeldeten Disziplinen
      </EText>
      <ul :style="styles.disciplineList">
        <li
          v-for="(d, idx) in disciplines"
          :key="idx"
          :style="styles.disciplineItem"
        >
          {{ d }}
        </li>
      </ul>
    </ESection>
  </EmailLayout>
</template>
