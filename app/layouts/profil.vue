<script setup lang="ts">
import type { BadgeColor } from '~~/shared/utils/registration-ui'

const { session } = useUserSession()
const user = computed(() => session.value?.user)

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: 'Meine Anmeldungen', value: 'meine-anmeldungen', icon: 'i-ph-calendar-check-bold' },
  { label: 'Benachrichtigungen', value: 'benachrichtigungen', icon: 'i-ph-bell-bold' },
]

const activeTab = computed({
  get: () => route.path.endsWith('/benachrichtigungen') ? 'benachrichtigungen' : 'meine-anmeldungen',
  set: (value: string) => router.push(`/profil/${value}`),
})

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  superuser: 'Superuser',
}

const ROLE_COLORS: Record<string, BadgeColor> = {
  admin: 'primary',
  superuser: 'warning',
}

const avatarUrlLarge = computed(() => user.value?.avatarUrl ? `${user.value.avatarUrl}?size=large` : undefined)
const avatarAlt = computed(() => `${user.value?.firstName ?? ''} ${user.value?.lastName ?? ''}`)
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-3xl">
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

    <USeparator class="mb-6" />

    <UTabs
      v-model="activeTab"
      :items="tabs"
      :content="false"
      variant="link"
      color="neutral"
      class="mb-8"
    />

    <slot />
  </UContainer>
</template>
