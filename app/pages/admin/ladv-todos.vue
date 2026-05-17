<script setup lang="ts">
import type { LadvTodo } from '~~/shared/types/events'
import { daysUntilDeadline, deadlineUrgency, type DeadlineUrgency } from '~~/shared/utils/deadlines'

definePageMeta({ layout: 'admin', title: 'Admin — LADV-Todos' })

const { data: todos, refresh, status } = await useFetch<LadvTodo[]>('/api/admin/ladv-todos')

const openRegistrationId = ref<number | null>(null)

const columns = [
  { key: 'action', label: '' },
  { key: 'deadline', label: 'Meldefrist' },
  { key: 'person', label: 'Person' },
  { key: 'event', label: 'Event' },
  { key: 'date', label: 'Datum' },
  { key: 'type', label: 'Typ' },
  { key: 'diff', label: 'Änderungen' },
]

const urgencyTextClass: Record<DeadlineUrgency, string> = {
  expired: 'text-error',
  soon: 'text-warning',
  normal: 'text-highlighted',
  none: 'text-muted',
}

function shortName(todo: LadvTodo): string {
  const first = todo.firstName?.trim() || ''
  const lastInitial = todo.lastName?.trim()?.[0] || ''
  if (!first && !lastInitial) return 'Unbekannt'
  return lastInitial ? `${first} ${lastInitial}.` : first
}

function deadlineRelative(deadline: string | null): string | null {
  const diff = daysUntilDeadline(deadline)
  if (diff === null) return null
  if (diff === 0) return 'heute'
  if (diff === 1) return 'morgen'
  if (diff > 1) return `in ${diff} Tagen`
  if (diff === -1) return 'gestern abgelaufen'
  return `abgelaufen seit ${-diff} T`
}
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
      class="rounded-[--ui-radius] border border-default overflow-hidden overflow-x-auto"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-elevated border-b border-default">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-2 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
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
            <!-- Aktion -->
            <td class="px-2 py-3">
              <UButton
                label="Details"
                color="primary"
                variant="soft"
                size="xs"
                trailing-icon="i-ph-arrow-right"
                @click="openRegistrationId = todo.registrationId"
              />
            </td>

            <!-- Meldefrist -->
            <td class="px-2 py-3 whitespace-nowrap">
              <div
                v-if="todo.registrationDeadline"
                class="leading-tight"
                :class="urgencyTextClass[deadlineUrgency(todo.registrationDeadline)]"
              >
                <div class="text-sm font-medium">
                  {{ formatDate(todo.registrationDeadline) }}
                </div>
                <div class="text-xs opacity-80">
                  {{ deadlineRelative(todo.registrationDeadline) }}
                </div>
              </div>
              <span
                v-else
                class="text-muted"
              >–</span>
            </td>

            <!-- Person -->
            <td class="px-2 py-3 font-medium text-highlighted whitespace-nowrap">
              {{ shortName(todo) }}
            </td>

            <!-- Event -->
            <td class="px-2 py-3">
              <NuxtLink
                :to="`/${todo.eventId}`"
                class="font-medium text-highlighted hover:text-primary transition-colors"
              >
                {{ todo.eventName }}
              </NuxtLink>
            </td>

            <!-- Datum -->
            <td class="px-2 py-3 text-muted whitespace-nowrap">
              {{ formatDate(todo.eventDate) ?? '–' }}
            </td>

            <!-- Typ -->
            <td class="px-2 py-3">
              <UBadge
                :label="todo.type === 'register' ? 'Anmelden' : 'Abmelden'"
                :color="todo.type === 'register' ? 'info' : 'error'"
                variant="subtle"
                size="sm"
              />
            </td>

            <!-- Diff -->
            <td class="px-2 py-3">
              <div class="flex flex-wrap gap-1">
                <LadvBadge
                  v-for="entry in todo.diff"
                  :key="`${entry.discipline}:${entry.ageClass}`"
                  :discipline="entry.discipline"
                  :age-class="entry.ageClass"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <RegistrationCoachModal
      v-if="openRegistrationId"
      :registration-id="openRegistrationId"
      :open="!!openRegistrationId"
      @update:open="!$event && (openRegistrationId = null)"
      @done="refresh()"
    />
  </div>
</template>
