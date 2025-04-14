<script setup lang="ts">
import type { Database } from '~/types/database.types'

const client = useSupabaseClient<Database>()

const {
  data: activeCompetitionsCount,
  pending: _loading,
  error: _error,
} = await useAsyncData('activeCompetitionsCount', async () => {
  const { count, error: supabaseError } = await client
    .from('competitions')
    .select('*', { count: 'exact', head: true })
    .gte('date', new Date().toISOString().split('T')[0])

  if (supabaseError) throw supabaseError

  return count || 0
})

const {
  data: membersCount,
  pending: _loadingMembers,
  error: _errorMembers,
} = await useAsyncData('membersCount', async () => {
  const { count, error: supabaseError } = await client
    .from('members')
    .select('*', { count: 'exact', head: true })

  if (supabaseError) throw supabaseError

  return count || 0
})

const {
  data: confirmedRegistrationsCount,
  pending: _loadingConfirmed,
  error: _errorConfirmed,
} = await useAsyncData('confirmedRegistrationsCount', async () => {
  const { count, error: supabaseError } = await client
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')

  if (supabaseError) throw supabaseError

  return count || 0
})

const {
  data: pendingRegistrationsCount,
  pending: _loadingPending,
  error: _errorPending,
} = await useAsyncData('pendingRegistrationsCount', async () => {
  const { count, error: supabaseError } = await client
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (supabaseError) throw supabaseError

  return count || 0
})

const {
  data: activeCompetitions,
  pending: _loadingActive,
  error: _errorActive,
} = await useAsyncData('activeCompetitions', async () => {
  const { data, error: supabaseError } = await client
    .from('competitions')
    .select(
      `
      *,
      registrations:registrations(count)
    `
    )
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(5)

  if (supabaseError) throw supabaseError

  return data
})

const {
  data: newestRegistrations,
  pending: _loadingNewest,
  error: _errorNewest,
} = await useAsyncData('newestRegistrations', async () => {
  const { data, error: supabaseError } = await client
    .from('registrations')
    .select(
      `
      *,
      member:members(name),
      competition:competitions(name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(5)

  if (supabaseError) throw supabaseError

  return data
})
</script>

<template>
  <NuxtLayout
    name="base"
    heading="Admin Dashboard"
    back-link="/"
    back-link-text="Zurück zur Startseite"
  >
    <template #actions>
      <UButton
        to="/admin/members/import"
        color="primary"
        class="w-full justify-center md:w-auto md:justify-start"
      >
        Mitglieder importieren
      </UButton>
    </template>

    <div class="space-y-8">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <!-- Dashboard-Karten -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Wettkämpfe</h2>
          </template>
          <p class="text-3xl font-bold">{{ activeCompetitionsCount }}</p>
          <p class="mt-2 text-sm text-(--ui-text-dimmed)">Aktive Wettkämpfe</p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Mitglieder</h2>
          </template>
          <p class="text-3xl font-bold">{{ membersCount }}</p>
          <p class="mt-2 text-sm text-(--ui-text-dimmed)">
            Registrierte Mitglieder
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Anmeldungen</h2>
          </template>
          <p class="text-3xl font-bold">{{ confirmedRegistrationsCount }}</p>
          <p class="mt-2 text-sm text-(--ui-text-dimmed)">
            Bestätigte Anmeldungen
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Ausstehend</h2>
          </template>
          <p class="text-3xl font-bold">{{ pendingRegistrationsCount }}</p>
          <p class="mt-2 text-sm text-(--ui-text-dimmed)">
            Unbestätigte Anmeldungen
          </p>
        </UCard>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Aktuelle Wettkämpfe -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold">Aktuelle Wettkämpfe</h2>
              <UButton
                to="/"
                variant="ghost"
                color="primary"
                trailing-icon="lucide:arrow-right"
              >
                Alle anzeigen
              </UButton>
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="competition in activeCompetitions"
              :key="competition.id"
              class="border-b pb-4"
            >
              <div class="flex justify-between">
                <h3 class="font-medium">{{ competition.name }}</h3>
                <UBadge color="success" variant="soft">Aktiv</UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">
                {{ new Date(competition.date).toLocaleDateString() }}
              </p>
              <div class="mt-2 flex justify-between">
                <p class="text-sm">
                  {{ competition.registrations[0]?.count || 0 }} Anmeldungen
                </p>
                <UButton
                  :to="`/admin/competitions/${competition.id}`"
                  variant="ghost"
                  color="primary"
                  trailing-icon="lucide:arrow-right"
                >
                  Details
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Neueste Anmeldungen -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Neueste Anmeldungen</h2>
          </template>

          <div class="space-y-4">
            <div
              v-for="registration in newestRegistrations"
              :key="registration.id"
              class="border-b pb-4"
            >
              <div class="flex justify-between">
                <h3 class="font-medium">{{ registration.member?.name }}</h3>
                <UBadge
                  :color="
                    registration.status === 'confirmed' ? 'success' : 'warning'
                  "
                  variant="soft"
                >
                  {{
                    registration.status === 'confirmed'
                      ? 'Bestätigt'
                      : 'Ausstehend'
                  }}
                </UBadge>
              </div>
              <p class="text-sm text-(--ui-text-dimmed)">
                {{ registration.competition?.name }}
              </p>
              <p class="mt-2 text-sm text-(--ui-text-dimmed)">
                {{ new Date(registration.created_at).toLocaleString() }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </NuxtLayout>
</template>
