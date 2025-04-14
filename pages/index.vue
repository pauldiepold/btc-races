<script setup lang="ts">
import type { Database } from '~/types/database.types'

const client = useSupabaseClient<Database>()

const { data: competitions } = await useAsyncData('competitions', async () => {
  const { data } = await client
    .from('competitions')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(3)

  return data
})
</script>

<template>
  <div class="container mx-auto">
    <div class="flex flex-col gap-8 lg:flex-row">
      <!-- Hauptinhalt -->
      <div class="flex-1">
        <h2 class="mb-6 text-2xl font-bold">Aktuelle Wettkämpfe</h2>

        <div class="space-y-4">
          <div v-for="competition in competitions" :key="competition.id">
            <CompetitionCard
              :competition="competition"
              class="block w-full transition-all duration-300"
            />
          </div>

          <div
            v-if="competitions?.length === 0"
            class="flex items-center justify-center rounded-xl border bg-white p-8 shadow-lg"
          >
            <p class="text-center text-gray-400">
              Aktuell sind keine Wettkämpfe verfügbar
            </p>
          </div>
        </div>

        <div class="mt-8">
          <NuxtLink to="/competitions">
            <button
              class="w-full cursor-pointer rounded-md border border-gray-200 bg-gray-50 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-100"
            >
              Alle Wettkämpfe anzeigen
            </button>
          </NuxtLink>
        </div>
      </div>

      <!-- Trennlinie für mobile Ansicht -->
      <hr class="my-2 border-gray-200 lg:hidden" />

      <!-- Seitenleiste -->
      <div class="space-y-6 lg:w-1/3">
        <div class="rounded-lg bg-white p-6 shadow-md">
          <h2 class="mb-4 text-lg font-semibold">Über das Anmeldesystem</h2>
          <p class="mb-4 text-gray-600">
            Das BTC-Wettkampfanmeldesystem ermöglicht Vereinsmitgliedern eine
            einfache Anmeldung zu aktuellen Wettkämpfen.
          </p>
          <p class="text-gray-600">
            Um dich anzumelden, wähle einen Wettkampf aus der Liste aus und
            klicke auf "Anmelden". Nach Auswahl deines Namens aus der
            Mitgliederliste erhältst du eine Bestätigungs-E-Mail.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
