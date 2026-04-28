<script setup lang="ts">
import type { EventDetail, LadvTodo } from '~~/shared/types/events'
import { diffLadvRegistration } from '~~/shared/utils/ladv-diff'

const props = defineProps<{
  event: EventDetail
}>()

const emit = defineEmits<{ refresh: [] }>()

const openRegistrationId = ref<number | null>(null)

const todos = computed<LadvTodo[]>(() => {
  const result: LadvTodo[] = []

  for (const reg of props.event.registrations) {
    if (reg.status === 'registered') {
      const diff = diffLadvRegistration(reg.wishDisciplines, reg.ladvDisciplines)
      if (diff.length > 0) {
        result.push({
          type: 'register',
          eventId: props.event.id,
          eventName: props.event.name,
          eventDate: props.event.date,
          ladvId: props.event.ladvId,
          registrationId: reg.id,
          diff,
          wishDisciplines: reg.wishDisciplines,
          userId: reg.userId,
          firstName: reg.firstName,
          lastName: reg.lastName,
          avatarUrl: reg.avatarUrl,
        })
      }
    }

    if (reg.status === 'canceled' && reg.ladvDisciplines && reg.ladvDisciplines.length > 0) {
      const diff = reg.ladvDisciplines.map(d => ({ type: 'remove' as const, discipline: d.discipline, ageClass: d.ageClass }))
      result.push({
        type: 'cancel',
        eventId: props.event.id,
        eventName: props.event.name,
        eventDate: props.event.date,
        ladvId: props.event.ladvId,
        registrationId: reg.id,
        diff,
        wishDisciplines: reg.wishDisciplines,
        userId: reg.userId,
        firstName: reg.firstName,
        lastName: reg.lastName,
        avatarUrl: reg.avatarUrl,
      })
    }
  }

  return result
})

function fullName(todo: LadvTodo): string {
  return [todo.firstName, todo.lastName].filter(Boolean).join(' ') || 'Unbekannt'
}
</script>

<template>
  <div>
    <h2 class="font-display font-semibold text-highlighted mb-2">
      LADV-Todos
      <span
        v-if="todos.length > 0"
        class="ml-2 text-sm font-normal text-muted"
      >({{ todos.length }} offen)</span>
    </h2>

    <!-- Leerzustand -->
    <div
      v-if="todos.length === 0"
      class="py-8 text-center text-sm text-muted"
    >
      <UIcon
        name="i-ph-check-circle"
        class="size-7 mx-auto mb-2 text-success opacity-70"
      />
      <p>Alle LADV-Aktionen erledigt.</p>
    </div>

    <!-- Todo-Liste -->
    <div
      v-else
      class="divide-y divide-default"
    >
      <button
        v-for="todo in todos"
        :key="`${todo.registrationId}:${todo.type}`"
        class="w-full flex items-center gap-3 py-3 text-left hover:bg-elevated/50 rounded-lg px-2 -mx-2 transition-colors"
        @click="openRegistrationId = todo.registrationId"
      >
        <UAvatar
          :src="todo.avatarUrl ?? undefined"
          :alt="`${todo.firstName ?? ''} ${todo.lastName ?? ''}`"
          size="sm"
          class="shrink-0"
        />

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-medium text-highlighted">{{ fullName(todo) }}</span>
            <UBadge
              :label="todo.type === 'register' ? 'Anmelden' : 'Abmelden'"
              :color="todo.type === 'register' ? 'info' : 'error'"
              variant="subtle"
              size="xs"
            />
          </div>
          <div class="flex flex-wrap gap-1 mt-1">
            <LadvBadge
              v-for="entry in todo.diff"
              :key="`${entry.discipline}:${entry.ageClass}`"
              :discipline="entry.discipline"
              :age-class="entry.ageClass"
            />
          </div>
        </div>

        <UIcon
          name="i-ph-arrow-right"
          class="size-4 text-muted shrink-0"
        />
      </button>
    </div>

    <RegistrationCoachModal
      v-if="openRegistrationId"
      :registration-id="openRegistrationId"
      :open="!!openRegistrationId"
      @update:open="!$event && (openRegistrationId = null)"
      @done="emit('refresh')"
    />
  </div>
</template>
