<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EventDetails from './components/EventDetails.vue'

interface Participant {
  name: string
  disciplines?: string
}

interface Props {
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
  participants?: Participant[]
}

const {
  participants = [
    { name: 'Max Mustermann', disciplines: '100m, 200m' },
    { name: 'Erika Musterfrau', disciplines: '800m' },
    { name: 'Jonas Schmidt' },
  ],
} = defineProps<Props>()

const styles = {
  listBox: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '3px',
    padding: '16px',
    margin: '16px 0',
  },
  listTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: '700' as const,
    color: '#09090b',
  },
  listItem: {
    margin: '4px 0',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#18181b',
  },
  listItemName: {
    fontWeight: '600' as const,
    color: '#09090b',
  },
  listItemDisciplines: {
    color: '#71717a',
  },
  emptyText: {
    margin: '0',
    fontSize: '14px',
    color: '#71717a',
    fontStyle: 'italic' as const,
  },
}

const participantCount = participants?.length ?? 0
</script>

<template>
  <EmailLayout
    header-title="Meldefrist-Erinnerung"
    show-unsubscribe
  >
    <EmailText>
      Liebe Coaches,
    </EmailText>

    <EmailText>
      die Meldefrist für <strong>{{ eventName }}</strong> endet am <strong>{{ registrationDeadline }}</strong>.
      Aktuell liegen <strong>{{ participantCount }} Anmeldung{{ participantCount === 1 ? '' : 'en' }}</strong> vor.
    </EmailText>

    <ESection :style="styles.listBox">
      <EText :style="styles.listTitle">
        Angemeldete Teilnehmer
      </EText>
      <EText
        v-if="participants.length === 0"
        :style="styles.emptyText"
      >
        Noch keine Anmeldungen.
      </EText>
      <EText
        v-for="(p, idx) in participants"
        :key="idx"
        :style="styles.listItem"
      >
        <span :style="styles.listItemName">{{ p.name }}</span>
        <span
          v-if="p.disciplines"
          :style="styles.listItemDisciplines"
        > · {{ p.disciplines }}</span>
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
