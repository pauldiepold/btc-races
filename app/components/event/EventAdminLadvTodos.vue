<script setup lang="ts">
import type { EventDetail, LadvTodo } from '~~/shared/types/events'

const props = defineProps<{
  event: EventDetail
}>()

const emit = defineEmits<{ refresh: [] }>()

const openTodo = ref<LadvTodo | null>(null)

const todos = computed<LadvTodo[]>(() => {
  const result: LadvTodo[] = []

  for (const reg of props.event.registrations) {
    // register-Todo: status=registered und mind. eine Disziplin ohne ladvRegisteredAt
    if (reg.status === 'registered') {
      const pending = reg.disciplines.filter(d => !d.ladvRegisteredAt)
      if (pending.length > 0) {
        result.push({
          type: 'register',
          eventId: props.event.id,
          eventName: props.event.name,
          eventDate: props.event.date,
          ladvId: props.event.ladvId,
          registrationId: reg.id,
          disciplines: pending.map(d => ({ id: d.id, discipline: d.discipline, ageClass: d.ageClass })),
          userId: reg.userId,
          firstName: reg.firstName,
          lastName: reg.lastName,
        })
      }
    }

    // cancel-Todo: mind. eine Disziplin hat ladvRegisteredAt aber kein ladvCanceledAt
    const toCancel = reg.disciplines.filter(d => d.ladvRegisteredAt && !d.ladvCanceledAt)
    // Nur relevant wenn die Anmeldung canceled wurde (= Person hat abgemeldet)
    if (reg.status === 'canceled' && toCancel.length > 0) {
      result.push({
        type: 'cancel',
        eventId: props.event.id,
        eventName: props.event.name,
        eventDate: props.event.date,
        ladvId: props.event.ladvId,
        registrationId: reg.id,
        disciplines: toCancel.map(d => ({ id: d.id, discipline: d.discipline, ageClass: d.ageClass })),
        userId: reg.userId,
        firstName: reg.firstName,
        lastName: reg.lastName,
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
        @click="openTodo = todo"
      >
        <UAvatar
          :src="useAvatarUrl(todo.userId)"
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
              v-for="d in todo.disciplines"
              :key="d.id"
              :discipline="d.discipline"
              :age-class="d.ageClass"
            />
          </div>
        </div>

        <UIcon
          name="i-ph-arrow-right"
          class="size-4 text-muted shrink-0"
        />
      </button>
    </div>

    <LadvTodoModal
      v-if="openTodo"
      :todo="openTodo"
      :open="!!openTodo"
      @update:open="!$event && (openTodo = null)"
      @done="emit('refresh')"
    />
  </div>
</template>
