<script setup lang="ts">
import type { LadvTodo } from '~~/shared/types/events'

definePageMeta({ layout: 'admin', title: 'Admin — LADV-Todos' })

const { data: todos, refresh, status } = await useFetch<LadvTodo[]>('/api/admin/ladv-todos')

const openTodo = ref<LadvTodo | null>(null)

function fullName(todo: LadvTodo): string {
  return [todo.firstName, todo.lastName].filter(Boolean).join(' ') || 'Unbekannt'
}

const columns = [
  { key: 'event', label: 'Event' },
  { key: 'date', label: 'Datum' },
  { key: 'type', label: 'Typ' },
  { key: 'person', label: 'Person' },
  { key: 'disciplines', label: 'Disziplinen' },
  { key: 'action', label: '' },
]
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between gap-4">
      <p class="text-sm text-muted">
        Offene LADV-An- und Abmeldungen über alle Events
      </p>
      <UButton
        icon="i-ph-arrows-clockwise"
        label="Aktualisieren"
        color="neutral"
        variant="outline"
        size="sm"
        :loading="status === 'pending'"
        @click="refresh()"
      />
    </div>

    <!-- Laden -->
    <div
      v-if="status === 'pending'"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-14 w-full"
      />
    </div>

    <!-- Leer -->
    <div
      v-else-if="!todos?.length"
      class="text-center py-20 text-muted space-y-3"
    >
      <UIcon
        name="i-ph-check-circle"
        class="size-12 mx-auto text-success opacity-60"
      />
      <p class="font-medium text-highlighted">
        Keine offenen Todos
      </p>
      <p class="text-sm">
        Alle LADV-Aktionen sind erledigt.
      </p>
    </div>

    <!-- Tabelle -->
    <div
      v-else
      class="rounded-[--ui-radius] border border-default overflow-hidden"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-elevated border-b border-default">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="todo in todos"
            :key="`${todo.registrationId}:${todo.type}`"
            class="hover:bg-elevated/50 transition-colors"
          >
            <!-- Event -->
            <td class="px-4 py-3">
              <NuxtLink
                :to="`/events/${todo.eventId}`"
                class="font-medium text-highlighted hover:text-primary transition-colors"
              >
                {{ todo.eventName }}
              </NuxtLink>
            </td>

            <!-- Datum -->
            <td class="px-4 py-3 text-muted whitespace-nowrap">
              {{ formatDate(todo.eventDate) ?? '–' }}
            </td>

            <!-- Typ -->
            <td class="px-4 py-3">
              <UBadge
                :label="todo.type === 'register' ? 'Anmelden' : 'Abmelden'"
                :color="todo.type === 'register' ? 'info' : 'error'"
                variant="subtle"
                size="sm"
              />
            </td>

            <!-- Person -->
            <td class="px-4 py-3 font-medium text-highlighted whitespace-nowrap">
              {{ fullName(todo) }}
            </td>

            <!-- Disziplinen -->
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <LadvBadge
                  v-for="d in todo.disciplines"
                  :key="d.id"
                  :discipline="d.discipline"
                  :age-class="d.ageClass"
                />
              </div>
            </td>

            <!-- Aktion -->
            <td class="px-4 py-3 text-right">
              <UButton
                label="Details"
                color="neutral"
                variant="ghost"
                size="xs"
                trailing-icon="i-ph-arrow-right"
                @click="openTodo = todo"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <LadvTodoModal
      v-if="openTodo"
      :todo="openTodo"
      :open="!!openTodo"
      @update:open="!$event && (openTodo = null)"
      @done="refresh()"
    />
  </div>
</template>
