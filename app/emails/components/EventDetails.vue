<script setup lang="ts">
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
} = defineProps<Props>()

const styles = {
  container: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '5px',
    margin: '15px 0',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  detailText: {
    margin: '5px 0',
    color: '#333',
    fontSize: '14px',
  },
  label: {
    fontWeight: 'bold',
  },
}
</script>

<template>
  <ESection :style="styles.container">
    <EHeading :style="styles.title">
      Wettkampfdetails:
    </EHeading>
    <EText :style="styles.detailText">
      <strong :style="styles.label">Name:</strong> {{ eventName }}
    </EText>
    <EText :style="styles.detailText">
      <strong :style="styles.label">Datum:</strong> {{ eventDate }}
    </EText>
    <EText :style="styles.detailText">
      <strong :style="styles.label">Meldefrist:</strong> {{ registrationDeadline }}
    </EText>
    <EText :style="styles.detailText">
      <strong :style="styles.label">Ort:</strong> {{ eventLocation }}
    </EText>
    <EText
      v-if="eventVenue"
      :style="styles.detailText"
    >
      <strong :style="styles.label">Sportstätte:</strong> {{ eventVenue }}
    </EText>
  </ESection>
</template>
