<script setup lang="ts">
import { useRepositories } from '~/composables/useRepositories'
import { useToastMessages } from '~/composables/useToastMessages'

definePageMeta({
  colorMode: 'dark',
})

const { competitions, members, registrations } = useRepositories()
const { showError } = useToastMessages()

const {
  data: activeCompetitionsCount,
  pending: _loading,
  error: _error,
} = await useAsyncData('activeCompetitionsCount', async () => {
  const result = await competitions.countActive()
  if (result === 0) {
    // Wir prüfen hier, ob wirklich null zurückkommt (Fehler) oder nur 0 (kein Fehler, aber keine aktiven Wettbewerbe)
    console.log('Keine aktiven Wettbewerbe gefunden oder Fehler beim Zählen.')
  }
  return result
})

const {
  data: membersCount,
  pending: _loadingMembers,
  error: _errorMembers,
} = await useAsyncData('membersCount', async () => {
  const result = await members.count()
  if (result === 0 && _errorMembers.value) {
    showError('Fehler beim Laden der Mitglieder')
  }
  return result
})

const {
  data: confirmedRegistrationsCount,
  pending: _loadingConfirmed,
  error: _errorConfirmed,
} = await useAsyncData('confirmedRegistrationsCount', async () => {
  return registrations.count({ status: 'confirmed' })
})

const {
  data: pendingRegistrationsCount,
  pending: _loadingPending,
  error: _errorPending,
} = await useAsyncData('pendingRegistrationsCount', async () => {
  return registrations.count({ status: 'pending' })
})

const {
  data: activeCompetitions,
  pending: _loadingActive,
  error: _errorActive,
} = await useAsyncData('activeCompetitions', async () => {
  const result = await competitions.findActiveWithRegistrationsCount(5)
  if (!result || result.length === 0) {
    console.log('Keine aktiven Wettbewerbe gefunden oder Fehler beim Laden.')
  }
  return result || []
})

const {
  data: newestRegistrations,
  pending: _loadingNewest,
  error: _errorNewest,
} = await useAsyncData('newestRegistrations', async () => {
  const result = await registrations.findNewestWithDetails(5)
  if (!result || result.length === 0) {
    console.log('Keine Registrierungen gefunden oder Fehler beim Laden.')
  }
  return result || []
})
</script>

<template>
  <BasePage
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
                  :to="`/competitions/${competition.id}`"
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
  </BasePage>
</template>
