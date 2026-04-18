<script setup lang="ts">
import EmailButton from './EmailButton.vue'

interface Props {
  eventName?: string
  eventDate?: string
  eventLocation?: string
  registrationDeadline?: string
  eventVenue?: string
  eventLink?: string
}

const {
  eventName = 'Herbstmeeting 2025',
  eventDate = '15.03.2025',
  eventLocation = 'Berlin',
  registrationDeadline = '10.03.2025',
  eventVenue,
  eventLink,
} = defineProps<Props>()

const styles = {
  container: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '3px',
    padding: '16px',
    margin: '16px 0',
  },
  title: {
    margin: '0 0 12px 0',
    color: '#09090b',
    fontSize: '16px',
    fontWeight: '700' as const,
    letterSpacing: '-0.01em',
  },
  row: {
    margin: '4px 0',
    color: '#18181b',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  label: {
    color: '#09090b',
    fontWeight: '600' as const,
  },
  value: {
    color: '#3f3f46',
  },
  buttonWrap: {
    marginTop: '12px',
    marginBottom: '0',
  },
}
</script>

<template>
  <ESection :style="styles.container">
    <EHeading :style="styles.title">
      Wettkampf-Details
    </EHeading>
    <EText :style="styles.row">
      <span :style="styles.label">Name: </span><span :style="styles.value">{{ eventName }}</span>
    </EText>
    <EText :style="styles.row">
      <span :style="styles.label">Datum: </span><span :style="styles.value">{{ eventDate }}</span>
    </EText>
    <EText :style="styles.row">
      <span :style="styles.label">Meldefrist: </span><span :style="styles.value">{{ registrationDeadline }}</span>
    </EText>
    <EText :style="styles.row">
      <span :style="styles.label">Ort: </span><span :style="styles.value">{{ eventLocation }}</span>
    </EText>
    <EText
      v-if="eventVenue"
      :style="styles.row"
    >
      <span :style="styles.label">Sportstätte: </span><span :style="styles.value">{{ eventVenue }}</span>
    </EText>

    <ESection
      v-if="eventLink"
      :style="styles.buttonWrap"
    >
      <EmailButton
        :href="eventLink"
        text="Zum Event"
      />
    </ESection>
  </ESection>
</template>
