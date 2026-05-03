<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'

interface Props {
  memberFirstName?: string
  memberLastName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
}

const {
  memberFirstName = 'Max',
  memberLastName = 'Mustermann',
} = defineProps<Props>()

const styles = {
  alertBox: {
    backgroundColor: '#fafafa',
    borderLeft: '4px solid #ffb700',
    padding: '14px 16px',
    margin: '16px 0',
    borderRadius: '3px',
  },
  alertText: {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#18181b',
    fontWeight: '600' as const,
  },
}

const memberFullName = `${memberFirstName} ${memberLastName}`
</script>

<template>
  <EmailLayout
    header-title="LADV-Abmeldung nötig"
    show-unsubscribe
  >
    <EmailText>
      Liebe Coaches,
    </EmailText>

    <EmailText>
      <strong>{{ memberFullName }}</strong> hat die Anmeldung für <strong>{{ eventName }}</strong> storniert — die LADV-Meldung wurde aber bereits gesetzt.
    </EmailText>

    <ESection :style="styles.alertBox">
      <EText :style="styles.alertText">
        Die LADV-Meldung muss manuell zurückgezogen werden.
      </EText>
    </ESection>

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
