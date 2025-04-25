<script setup lang="ts">
import { useCompetitionRegistration } from '~/composables/useCompetitionRegistration'
import type { Competition } from '~/types/models.types'

type CompetitionStatusColor = {
  text: string
  color: 'success' | 'error' | 'warning'
}

const props = defineProps<{ competition: Competition }>()

const status = computed<CompetitionStatusColor>(() => {
  const registrationStatus = useCompetitionRegistration(props.competition)

  switch (registrationStatus) {
    case 'REGISTRATION_OPEN':
      return {
        text: 'Anmeldung möglich',
        color: 'success',
      }
    case 'REGISTRATION_CLOSED':
      return {
        text: 'Meldefrist verstrichen',
        color: 'error',
      }
    case 'COMPETITION_ENDED':
      return {
        text: 'Vergangen',
        color: 'warning',
      }
    default:
      // Dieser Fall sollte nie eintreten, aber TypeScript braucht ihn
      return {
        text: 'Unbekannt',
        color: 'warning',
      }
  }
})
</script>
<template>
  <UBadge class="rounded-full" variant="subtle" :color="status.color">
    {{ status.text }}
  </UBadge>
</template>
