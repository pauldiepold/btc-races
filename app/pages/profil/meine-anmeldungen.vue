<script setup lang="ts">
import type { MyRegistration } from '~~/shared/types/events'
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_BADGE_COLORS,
} from '~~/shared/utils/registration-ui'

definePageMeta({ layout: 'profil', title: 'Meine Anmeldungen' })

const { data: registrations, status } = await useFetch<MyRegistration[]>('/api/me/registrations')
</script>

<template>
  <div>
    <h2 class="font-display font-semibold text-highlighted text-lg mb-6">
      Meine Anmeldungen
    </h2>

    <div
      v-if="status === 'pending'"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-16 w-full"
      />
    </div>

    <div
      v-else-if="!registrations?.length"
      class="text-center py-14 text-muted space-y-2"
    >
      <UIcon
        name="i-ph-calendar-blank"
        class="size-10 mx-auto opacity-30"
      />
      <p class="text-sm">
        Noch keine Anmeldungen
      </p>
      <UButton
        to="/"
        label="Events ansehen"
        color="neutral"
        variant="outline"
        size="sm"
        class="mt-2"
      />
    </div>

    <div
      v-else
      class="divide-y divide-default rounded-[--ui-radius] border border-default overflow-hidden"
    >
      <NuxtLink
        v-for="reg in registrations"
        :key="reg.id"
        :to="`/${reg.event.id}`"
        class="flex items-center gap-4 px-4 py-3.5 hover:bg-elevated transition-colors group"
      >
        <div class="w-16 shrink-0 text-center">
          <template v-if="reg.event.date">
            <p class="text-xs font-semibold text-highlighted leading-none">
              {{ formatDate(reg.event.date, { day: '2-digit', month: 'short' }) }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              {{ formatDate(reg.event.date, { year: 'numeric' }) }}
            </p>
          </template>
          <p
            v-else
            class="text-xs text-muted"
          >
            k. A.
          </p>
        </div>

        <div class="flex-1 min-w-0 space-y-1">
          <p
            class="text-sm font-medium text-highlighted truncate group-hover:text-primary transition-colors"
            :class="{ 'line-through opacity-50': reg.event.cancelledAt }"
          >
            {{ reg.event.name }}
          </p>
          <div class="flex items-center gap-2 flex-wrap">
            <UBadge
              :icon="eventTypeIcons[reg.event.type]"
              :label="eventTypeLabels[reg.event.type]"
              color="neutral"
              variant="subtle"
              size="xs"
            />
            <UBadge
              v-if="reg.event.cancelledAt"
              color="error"
              variant="subtle"
              size="xs"
            >
              Abgesagt
            </UBadge>
          </div>
        </div>

        <div class="shrink-0 flex flex-col items-end gap-1.5">
          <UBadge
            :color="REGISTRATION_STATUS_BADGE_COLORS[reg.status]"
            variant="subtle"
            size="sm"
          >
            {{ REGISTRATION_STATUS_LABELS[reg.status] }}
          </UBadge>
          <UBadge
            v-if="reg.event.type === 'ladv' && reg.ladvDisciplines?.length"
            color="success"
            variant="outline"
            size="xs"
            icon="i-ph-check-circle"
          >
            Bei LADV gemeldet
          </UBadge>
        </div>

        <UIcon
          name="i-ph-caret-right"
          class="size-4 text-muted shrink-0 group-hover:text-primary transition-colors"
        />
      </NuxtLink>
    </div>
  </div>
</template>
