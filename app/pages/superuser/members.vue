<script setup lang="ts">
import type { MemberAdminOverviewItem, MemberRegistrationItem } from '~~/server/members/admin-overview'

definePageMeta({ title: 'Superuser — Member' })

const { session } = useUserSession()
if (session.value?.user?.role !== 'superuser') {
  await navigateTo('/')
}

const { data: members, status: loadStatus } = await useFetch<MemberAdminOverviewItem[]>('/api/superuser/members')

// ── Filter ───────────────────────────────────────────────────────────
const search = ref('')
const roleFilter = ref<'all' | 'member' | 'admin' | 'superuser'>('all')
const pushFilter = ref<'all' | 'yes' | 'no'>('all')
const syncFilter = ref<'all' | 'synced' | 'stale' | 'never'>('all')

const roleOptions = [
  { value: 'all', label: 'Alle Rollen' },
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'superuser', label: 'Superuser' },
]
const pushOptions = [
  { value: 'all', label: 'Push: alle' },
  { value: 'yes', label: 'Push aktiv' },
  { value: 'no', label: 'Ohne Push' },
]
const syncOptions = [
  { value: 'all', label: 'Sync: alle' },
  { value: 'synced', label: 'Synchronisiert' },
  { value: 'stale', label: 'Veraltet' },
  { value: 'never', label: 'Nie synchronisiert' },
]

const filteredMembers = computed(() => {
  return (members.value ?? []).filter((m) => {
    if (roleFilter.value !== 'all' && m.role !== roleFilter.value) return false
    if (pushFilter.value === 'yes' && m.pushDeviceCount === 0) return false
    if (pushFilter.value === 'no' && m.pushDeviceCount > 0) return false
    if (syncFilter.value !== 'all' && m.syncState !== syncFilter.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.toLowerCase()
      return name.includes(q) || m.email.toLowerCase().includes(q)
    }
    return true
  })
})

// ── Display-Helfer ───────────────────────────────────────────────────
const roleLabels: Record<MemberAdminOverviewItem['role'], string> = {
  member: 'Member',
  admin: 'Admin',
  superuser: 'Superuser',
}
function roleColor(role: MemberAdminOverviewItem['role']) {
  return ({ member: 'neutral', admin: 'info', superuser: 'primary' } as const)[role]
}

const syncLabels: Record<MemberAdminOverviewItem['syncState'], string> = {
  synced: 'Synchronisiert',
  stale: 'Veraltet',
  never: 'Nie',
}
function syncColor(state: MemberAdminOverviewItem['syncState']) {
  return ({ synced: 'success', stale: 'warning', never: 'neutral' } as const)[state]
}

function fullName(m: MemberAdminOverviewItem) {
  return [m.firstName, m.lastName].filter(Boolean).join(' ') || '–'
}

function formatDate(iso: string | null): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Detail-Modal ─────────────────────────────────────────────────────
const selected = ref<MemberAdminOverviewItem | null>(null)
const detailOpen = ref(false)
const registrations = ref<MemberRegistrationItem[]>([])
const registrationsLoading = ref(false)

async function openDetail(member: MemberAdminOverviewItem) {
  selected.value = member
  detailOpen.value = true
  registrations.value = []
  registrationsLoading.value = true
  try {
    registrations.value = await $fetch<MemberRegistrationItem[]>(`/api/superuser/members/${member.id}/registrations`)
  }
  finally {
    registrationsLoading.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 lg:py-14 max-w-6xl">
    <div class="mb-8">
      <h1 class="font-display font-semibold text-highlighted text-2xl">
        Superuser
      </h1>
      <p class="text-sm text-muted mt-1">
        Systemfunktionen
      </p>
    </div>

    <!-- Sub-Navigation -->
    <div class="flex gap-2 mb-8 border-b border-default">
      <NuxtLink
        to="/superuser/notifications"
        class="px-4 py-2 text-sm font-medium text-muted hover:text-highlighted transition-colors border-b-2 border-transparent"
      >
        Notifications
      </NuxtLink>
      <NuxtLink
        to="/superuser/members"
        class="px-4 py-2 text-sm font-medium text-highlighted border-b-2 border-primary"
      >
        Member
      </NuxtLink>
      <NuxtLink
        to="/superuser"
        class="px-4 py-2 text-sm font-medium text-muted hover:text-highlighted transition-colors border-b-2 border-transparent"
      >
        System
      </NuxtLink>
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <UFormField
        label="Suche"
        size="sm"
        class="w-full sm:flex-1 sm:min-w-[16rem]"
      >
        <UInput
          v-model="search"
          icon="i-ph-magnifying-glass"
          placeholder="Name oder E-Mail"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Rolle"
        size="sm"
        class="basis-[calc(50%-0.375rem)] sm:basis-auto sm:w-48"
      >
        <USelect
          v-model="roleFilter"
          :items="roleOptions"
          value-key="value"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Push"
        size="sm"
        class="basis-[calc(50%-0.375rem)] sm:basis-auto sm:w-48"
      >
        <USelect
          v-model="pushFilter"
          :items="pushOptions"
          value-key="value"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Sync-Status"
        size="sm"
        class="basis-[calc(50%-0.375rem)] sm:basis-auto sm:w-48"
      >
        <USelect
          v-model="syncFilter"
          :items="syncOptions"
          value-key="value"
          class="w-full"
        />
      </UFormField>
    </div>

    <p class="text-xs text-muted mb-3">
      {{ filteredMembers.length }} von {{ members?.length ?? 0 }} Member
    </p>

    <!-- Loading -->
    <div
      v-if="loadStatus === 'pending' && !members"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-14 w-full"
      />
    </div>

    <!-- Leer -->
    <div
      v-else-if="!filteredMembers.length"
      class="text-center py-20 text-muted space-y-3"
    >
      <UIcon
        name="i-ph-users"
        class="size-12 mx-auto opacity-60"
      />
      <p class="font-medium text-highlighted">
        Keine Member gefunden
      </p>
      <p class="text-sm">
        Keine Member passen zu den aktuellen Filtern.
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
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Member
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Rolle
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">
              Push
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">
              Anmeldungen
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">
              Startpass
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              E-Mail
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Sync
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="m in filteredMembers"
            :key="m.id"
            class="hover:bg-elevated/50 transition-colors cursor-pointer"
            @click="openDetail(m)"
          >
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="m.avatarUrl ?? undefined"
                  :alt="fullName(m)"
                  size="sm"
                />
                <span class="font-medium text-highlighted">{{ fullName(m) }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <UBadge
                :label="roleLabels[m.role]"
                :color="roleColor(m.role)"
                variant="subtle"
                size="sm"
              />
            </td>
            <td class="px-4 py-3">
              <UBadge
                v-if="m.membershipStatus"
                :label="m.membershipStatus === 'active' ? 'Aktiv' : 'Inaktiv'"
                :color="m.membershipStatus === 'active' ? 'success' : 'neutral'"
                variant="soft"
                size="sm"
              />
              <span
                v-else
                class="text-dimmed"
              >–</span>
            </td>
            <td class="px-4 py-3 text-center">
              <span
                v-if="m.pushDeviceCount > 0"
                class="inline-flex items-center gap-1 text-highlighted"
              >
                <UIcon
                  name="i-ph-bell-ringing"
                  class="size-4 text-primary"
                />
                {{ m.pushDeviceCount }}
              </span>
              <span
                v-else
                class="text-dimmed"
              >–</span>
            </td>
            <td class="px-4 py-3 text-center text-muted tabular-nums">
              {{ m.registrationCount }}
            </td>
            <td class="px-4 py-3 text-center">
              <UIcon
                v-if="m.hasLadvStartpass"
                name="i-ph-check-circle-fill"
                class="size-5 text-success"
              />
              <UIcon
                v-else
                name="i-ph-minus"
                class="size-4 text-dimmed"
              />
            </td>
            <td class="px-4 py-3 text-muted">
              {{ m.email }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <UBadge
                  :label="syncLabels[m.syncState]"
                  :color="syncColor(m.syncState)"
                  variant="subtle"
                  size="sm"
                />
                <span class="text-xs text-dimmed">{{ formatDate(m.lastSyncedAt) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail-Modal -->
    <UModal
      v-model:open="detailOpen"
      :title="selected ? fullName(selected) : 'Member'"
    >
      <template #body>
        <div
          v-if="selected"
          class="space-y-6"
        >
          <!-- Stammdaten -->
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <p class="text-xs text-muted uppercase tracking-wider mb-1">
                Rolle
              </p>
              <UBadge
                :label="roleLabels[selected.role]"
                :color="roleColor(selected.role)"
                variant="subtle"
                size="sm"
              />
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wider mb-1">
                Mitgliedsstatus
              </p>
              <p class="text-highlighted">
                {{ selected.membershipStatus === 'active' ? 'Aktiv' : selected.membershipStatus === 'inactive' ? 'Inaktiv' : '–' }}
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-muted uppercase tracking-wider mb-1">
                E-Mail
              </p>
              <p class="text-highlighted break-all">
                {{ selected.email }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wider mb-1">
                Mitgliedsnummer
              </p>
              <p class="text-highlighted">
                {{ selected.membershipNumber ?? '–' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wider mb-1">
                Letzter Sync
              </p>
              <p class="text-highlighted">
                {{ formatDate(selected.lastSyncedAt) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wider mb-1">
                Push-Geräte
              </p>
              <p class="text-highlighted">
                {{ selected.pushDeviceCount }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wider mb-1">
                LADV-Startpass
              </p>
              <p class="text-highlighted">
                {{ selected.hasLadvStartpass ? 'Ja' : 'Nein' }}
              </p>
            </div>
            <div
              v-if="selected.sections?.length"
              class="col-span-2"
            >
              <p class="text-xs text-muted uppercase tracking-wider mb-1">
                Sektionen
              </p>
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="s in selected.sections"
                  :key="s"
                  :label="s"
                  color="neutral"
                  variant="soft"
                  size="xs"
                />
              </div>
            </div>
          </div>

          <!-- Event-Anmeldungen -->
          <div>
            <p class="text-xs text-muted uppercase tracking-wider mb-2">
              Event-Anmeldungen ({{ selected.registrationCount }})
            </p>
            <div
              v-if="registrationsLoading"
              class="space-y-2"
            >
              <USkeleton
                v-for="i in 3"
                :key="i"
                class="h-9 w-full"
              />
            </div>
            <p
              v-else-if="!registrations.length"
              class="text-sm text-muted"
            >
              Keine Anmeldungen.
            </p>
            <div
              v-else
              class="rounded-[--ui-radius] border border-default divide-y divide-default"
            >
              <div
                v-for="r in registrations"
                :key="r.eventId"
                class="flex items-center justify-between px-3 py-2 text-sm"
              >
                <NuxtLink
                  :to="`/${r.eventSlug}`"
                  class="text-highlighted hover:text-primary transition-colors inline-flex items-center gap-1 min-w-0"
                >
                  <span class="truncate">{{ r.eventName }}</span>
                  <UIcon
                    name="i-ph-arrow-up-right"
                    class="size-3.5 shrink-0 opacity-60"
                  />
                </NuxtLink>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-xs text-muted">{{ formatDate(r.eventDate) }}</span>
                  <UBadge
                    :label="r.status"
                    color="neutral"
                    variant="soft"
                    size="xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
