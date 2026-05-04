<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'

interface Props {
  firstName?: string
  adminName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
  reason?: string
}

const { adminName } = defineProps<Props>()

const styles = {
  reasonBox: {
    backgroundColor: '#fafafa',
    borderLeft: '4px solid #ffb700',
    padding: '14px 16px',
    margin: '16px 0',
    borderRadius: '3px',
  },
  reasonLabel: {
    margin: '0 0 4px 0',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#09090b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  reasonText: {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#18181b',
  },
}
</script>

<template>
  <EmailLayout
    header-title="Wettkampf abgesagt"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      {{ adminName ?? 'Ein Admin' }} hat <strong>{{ eventName }}</strong> abgesagt. Deine Anmeldung ist damit hinfällig — du musst nichts weiter tun.
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
      v-if="reason"
      :style="styles.reasonBox"
    >
      <EText :style="styles.reasonLabel">
        Grund
      </EText>
      <EText :style="styles.reasonText">
        {{ reason }}
      </EText>
    </ESection>
  </EmailLayout>
</template>
