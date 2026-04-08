<script setup lang="ts">
import type { MyRegistration } from '~~/shared/types/events'
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_BADGE_COLORS,
  type BadgeColor,
} from '~~/shared/utils/registration-ui'

definePageMeta({ title: 'Meine Anmeldungen' })

const { session } = useUserSession()
const user = computed(() => session.value?.user)

const { data: registrations, status } = await useFetch<MyRegistration[]>('/api/me/registrations')

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  superuser: 'Superuser',
}

const ROLE_COLORS: Record<string, BadgeColor> = {
  admin: 'primary',
  superuser: 'warning',
}

const avatarUrlLarge = computed(() => user.value?.id ? useAvatarUrl(user.value.id, 'large') : undefined)
const avatarAlt = computed(() => `${user.value?.firstName ?? ''} ${user.value?.lastName ?? ''}`)
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-3xl">
    <!-- Profil-Header -->
    <div class="flex items-center gap-5 mb-10">
      <UAvatar
        :src="avatarUrlLarge"
        :alt="avatarAlt"
        :ui="{ root: 'ring-2 ring-primary shrink-0' }"
        size="3xl"
      />

      <div class="min-w-0 space-y-1.5">
        <p class="font-display font-semibold text-highlighted text-2xl leading-snug">
          {{ user?.firstName }} {{ user?.lastName }}
        </p>
        <p class="text-sm text-muted">
          {{ user?.email }}
        </p>
        <div class="flex flex-wrap items-center gap-2 pt-0.5">
          <UBadge
            v-if="user?.role && user.role !== 'member'"
            :color="ROLE_COLORS[user.role]"
            variant="subtle"
          >
            {{ ROLE_LABELS[user.role] }}
          </UBadge>
          <UBadge
            v-for="section in user?.sections"
            :key="section"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ section }}
          </UBadge>
        </div>
      </div>
    </div>

    <USeparator class="mb-8" />

    <!-- Anmeldungsübersicht -->
    <div>
      <h2 class="font-display font-semibold text-highlighted text-lg mb-6">
        Meine Anmeldungen
      </h2>

      <!-- Laden -->
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

      <!-- Leer -->
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

      <!-- Liste -->
      <div
        v-else
        class="divide-y divide-default rounded-[--ui-radius] border border-default overflow-hidden"
      >
        <NuxtLink
          v-for="reg in registrations"
          :key="reg.id"
          :to="`/events/${reg.event.id}`"
          class="flex items-center gap-4 px-4 py-3.5 hover:bg-elevated transition-colors group"
        >
          <!-- Datum -->
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

          <!-- Info -->
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

          <!-- Status + LADV-Status -->
          <div class="shrink-0 flex flex-col items-end gap-1.5">
            <UBadge
              :color="REGISTRATION_STATUS_BADGE_COLORS[reg.status]"
              variant="subtle"
              size="sm"
            >
              {{ REGISTRATION_STATUS_LABELS[reg.status] }}
            </UBadge>
            <UBadge
              v-if="reg.event.type === 'ladv' && reg.disciplines.some(d => d.ladvRegisteredAt)"
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
  </UContainer>
</template>
