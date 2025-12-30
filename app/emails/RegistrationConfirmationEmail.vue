<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailButton from './components/EmailButton.vue'
import EventDetails from './components/EventDetails.vue'

interface Props {
  firstName?: string
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  confirmationLink?: string
  expiryDate?: string
  eventLink?: string
}

const {
  firstName = 'Max',
  eventName = 'Herbstmeeting 2025',
  eventDate = '15.03.2025',
  eventLocation = 'Berlin',
  registrationDeadline = '10.03.2025',
  eventVenue,
  confirmationLink = 'https://btc-races.de/registrations/confirm?token=example',
  expiryDate = '10.03.2025',
  eventLink = 'https://btc-races.de/events/1',
} = defineProps<Props>()

const styles = {
  text: {
    color: '#333',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 15px 0',
  },
  strong: {
    fontWeight: 'bold',
  },
  urlBox: {
    wordBreak: 'break-all' as const,
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    margin: '10px 0',
  },
}
</script>

<template>
  <EmailLayout
    header-title="Anmeldebestätigung"
    header-color="#ffb700"
  >
    <EText :style="styles.text">
      Hallo {{ firstName }},
    </EText>

    <EText :style="styles.text">
      Du hast Dich zum folgenden Wettkampf angemeldet:
    </EText>

    <EventDetails
      :event-name="eventName"
      :event-date="eventDate"
      :event-location="eventLocation"
      :registration-deadline="registrationDeadline"
      :event-venue="eventVenue"
      :event-lint="eventLink"
    />

    <EText :style="styles.text">
      Um deine Anmeldung zu bestätigen, klicke bitte auf den folgenden Link:
    </EText>

    <EmailButton
      :href="confirmationLink"
      text="Anmeldung bestätigen"
    />

    <EText :style="styles.text">
      Oder kopiere diese URL in deinen Browser:
    </EText>
    <EText :style="styles.urlBox">
      {{ confirmationLink }}
    </EText>

    <EText :style="styles.text">
      Dieser Link ist gültig bis zum {{ expiryDate }}.
    </EText>

    <EText :style="styles.text">
      Falls du dich nicht zu diesem Wettkampf angemeldet hast, kannst du diese E-Mail ignorieren.
    </EText>

    <EText :style="styles.text">
      Bei Fragen stehen wir dir gerne zur Verfügung.
    </EText>
  </EmailLayout>
</template>
