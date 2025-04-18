<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Competition = Database['public']['Tables']['competitions']['Row']

type CompetitionStatusColor = {
  text: string
  color: 'success' | 'error' | 'warning'
}

const props = defineProps<{ competition: Competition }>()

const status = computed<CompetitionStatusColor>(() => {
  const today = new Date().setHours(0, 0, 0, 0)
  const deadline = new Date(props.competition.registration_deadline).setHours(
    0,
    0,
    0,
    0
  )
  const date = new Date(props.competition.date).setHours(0, 0, 0, 0)

  if (today < deadline) {
    return {
      text: 'Anmeldung möglich',
      color: 'success',
    }
  }

  if (today < date) {
    return {
      text: 'Meldefrist verstrichen',
      color: 'error',
    }
  }

  return {
    text: 'Vergangen',
    color: 'warning',
  }
})
</script>
<template>
  <UBadge class="rounded-full" variant="subtle" :color="status.color">
    {{ status.text }}
  </UBadge>
</template>
