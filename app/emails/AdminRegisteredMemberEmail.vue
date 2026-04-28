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
  disciplines?: string[]
}

const {
  firstName = 'Max',
  eventName = 'Herbstmeeting 2025',
  eventDate = '15.03.2025',
  eventLocation = 'Berlin',
  registrationDeadline = '10.03.2025',
  eventVenue,
  eventLink = 'https://btc-races.de/events/1',
  disciplines,
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
    fontSize: '14px',
    color: '#3f3f46',
    lineHeight: '1.6',
  },
}
</script>

<template>
  <EmailLayout header-title="Du wurdest angemeldet">
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      ein Admin hat dich für <strong>{{ eventName }}</strong> angemeldet.
    </EmailText>

    <EventDetails
      :event-name="eventName"
      :event-date="eventDate"
      :event-location="eventLocation"
      :registration-deadline="registrationDeadline"
      :event-venue="eventVenue"
      :event-link="eventLink"
    />

    <ESection
      v-if="disciplines && disciplines.length > 0"
      :style="styles.disciplineBox"
    >
      <EText :style="styles.disciplineLabel">
        Gewünschte Disziplinen
      </EText>
      <EText :style="styles.disciplineList">
        {{ disciplines.join(', ') }}
      </EText>
    </ESection>
  </EmailLayout>
</template>
