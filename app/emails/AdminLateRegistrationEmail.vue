<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'

import type { EventType } from '~~/shared/utils/registration'

interface Props {
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
  eventType?: EventType
  athleteName?: string
  action?: 'registered' | 'reactivated'
  disciplines?: string[]
}

const {
  eventName,
  eventDate,
  eventLocation,
  registrationDeadline,
  eventVenue,
  eventLink,
  eventType,
  athleteName,
  action = 'registered',
  disciplines = [],
} = defineProps<Props>()

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

const verb = action === 'reactivated' ? 'reaktiviert' : 'angemeldet'
</script>

<template>
  <EmailLayout
    header-title="Späte LADV-Anmeldung"
    show-unsubscribe
  >
    <EmailText>
      Liebe Coaches,
    </EmailText>

    <EmailText>
      <strong>{{ athleteName }}</strong> hat sich kurz vor Meldeschluss für
      <strong>{{ eventName }}</strong> {{ verb }}. Meldeschluss ist am
      <strong>{{ registrationDeadline }}</strong> – bitte bei LADV nachmelden.
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
        Wunsch-Disziplinen
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
