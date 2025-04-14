<script setup lang="ts">
import type { Database } from '~/types/database.types'

const route = useRoute()
const competitionId = route.params.id as string

const client = useSupabaseClient<Database>()

const { data: competition } = await useAsyncData(
  `competition-${competitionId}`,
  async () => {
    const { data } = await client
      .from('competitions')
      .select('*')
      .eq('id', competitionId)
      .single()

    return data
  }
)

// Umleitung zur Übersichtsseite, wenn der Wettkampf nicht gefunden wurde
if (!competition.value) {
  navigateTo('/competitions')
}
</script>

<template>
  <div v-if="competition">
    <NuxtLink
      to="/competitions"
      class="text-primary inline-block hover:underline"
    >
      &larr; Zurück zur Übersicht
    </NuxtLink>
    <div class="mt-6 mb-8">
      <div class="container mx-auto">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <h1 class="text-3xl font-bold">{{ competition.name }}</h1>
          <div class="flex justify-start md:justify-end">
            <NuxtLink
              :to="`/register/${competition.id}`"
              class="bg-primary hover:bg-primary rounded-lg px-6 py-2 text-black"
            >
              Anmelden
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto">
      <div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div class="col-span-2">
          <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
            <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 class="mb-1 text-sm font-medium text-gray-500">Datum</h3>
                <p class="text-lg">
                  {{ new Date(competition.date).toLocaleDateString('de-DE') }}
                </p>
              </div>
              <div>
                <h3 class="mb-1 text-sm font-medium text-gray-500">Ort</h3>
                <p class="text-lg">{{ competition.location }}</p>
              </div>
              <div>
                <h3 class="mb-1 text-sm font-medium text-gray-500">
                  Meldefrist
                </h3>
                <p class="text-lg">
                  {{
                    new Date(
                      competition.registration_deadline
                    ).toLocaleDateString('de-DE')
                  }}
                </p>
              </div>
              <div>
                <h3 class="mb-1 text-sm font-medium text-gray-500">Status</h3>
                <p
                  class="text-lg"
                  :class="
                    new Date(competition.registration_deadline) >= new Date()
                      ? 'text-green-600'
                      : 'text-red-600'
                  "
                >
                  {{
                    new Date(competition.registration_deadline) >= new Date()
                      ? 'Anmeldung möglich'
                      : 'Anmeldung geschlossen'
                  }}
                </p>
              </div>
            </div>

            <h2 class="mb-4 text-xl font-bold">Beschreibung</h2>
            <div class="prose max-w-none" v-html="competition.description" />
          </div>

          <div class="rounded-lg bg-white p-6 shadow-md">
            <h2 class="mb-4 text-xl font-bold">Ausschreibung</h2>
            <p class="mb-4">
              Weitere Details findest du in der offiziellen Ausschreibung:
            </p>
            <a
              :href="competition.announcement_link || '#'"
              class="inline-flex items-center rounded bg-black px-4 py-2 text-white"
            >
              <span class="mr-2">Ausschreibung öffnen</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <div class="mb-6 rounded-lg bg-white p-6 shadow-md">
            <h2 class="mb-4 text-xl font-bold">Teilnehmer</h2>
            <p class="mb-4 text-sm text-gray-500">
              Bereits 12 Mitglieder angemeldet
            </p>

            <div class="space-y-3">
              <div class="rounded bg-gray-50 p-3">
                <p class="font-medium">Max Mustermann</p>
                <p class="text-sm text-green-600">Bestätigt</p>
              </div>
              <div class="rounded bg-gray-50 p-3">
                <p class="font-medium">Maria Musterfrau</p>
                <p class="text-sm text-green-600">Bestätigt</p>
              </div>
              <div class="rounded bg-gray-50 p-3">
                <p class="font-medium">Peter Schmidt</p>
                <p class="text-primary text-sm">Ausstehend</p>
              </div>
            </div>

            <p class="mt-4 text-center text-sm text-gray-500">
              und 9 weitere...
            </p>
          </div>

          <div class="rounded-lg bg-white p-6 shadow-md">
            <h2 class="mb-4 text-xl font-bold">Fragen?</h2>
            <p class="mb-4">
              Bei Fragen zum Wettkampf kontaktiere bitte die Wettkampfleitung.
            </p>
            <a
              href="mailto:wettkampf@btc.de"
              class="text-primary hover:underline"
              >wettkampf@btc.de</a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
