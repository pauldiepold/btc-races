<script setup>
import { onMounted, ref } from 'vue'
import { formatDate } from '~/utils/date'

const competitions = ref([])

onMounted(async () => {
  try {
    const response = await fetch('/api/competitions/upcoming')
    if (!response.ok)
      throw new Error('Fehler beim Laden der Wettkämpfe')
    competitions.value = await response.json()
  }
  catch (error) {
    console.error('Fehler:', error)
    competitions.value = []
  }
})
</script>

<template>
  <div class="">
    <div class="relative">
      <div class="container mx-auto px-4 relative">
        <h2 class="text-2xl font-bold mb-6">
          Aktuelle Wettkämpfe
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="competition in competitions" :key="competition.id" class="border rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300 bg-white">
            <div class="bg-black text-white p-4">
              <h3 class="text-xl font-bold">
                {{ competition.name }}
              </h3>
              <p class="text-primary">
                {{ formatDate(competition.date) }}
              </p>
            </div>
            <div class="p-4">
              <p class="mb-2">
                Ort: {{ competition.location }}
              </p>
              <p class="mb-4">
                Meldefrist: {{ formatDate(competition.registrationDeadline) }}
              </p>
              <div class="flex space-x-2">
                <NuxtLink
                  :to="`/competitions/${competition.id}`"
                  class="bg-primary text-black px-4 py-2 rounded-lg hover:bg-primary transition-colors duration-300"
                >
                  Details
                </NuxtLink>
                <NuxtLink
                  :to="`/register/${competition.id}`"
                  class="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-300"
                >
                  Anmelden
                </NuxtLink>
              </div>
            </div>
          </div>

          <div v-if="competitions.length === 0" class="border rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center p-8 transform hover:scale-105 transition-transform duration-300">
            <p class="text-gray-400 text-center">
              Aktuell sind keine Wettkämpfe verfügbar
            </p>
          </div>
        </div>

        <div class="mt-12 mb-8">
          <h2 class="text-2xl font-bold mb-6">
            Über das Anmeldesystem
          </h2>
          <div class="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
            <p class="mb-4">
              Das BTC-Wettkampfanmeldesystem ermöglicht Vereinsmitgliedern eine einfache Anmeldung zu aktuellen Wettkämpfen.
            </p>
            <p>
              Um dich anzumelden, wähle einen Wettkampf aus der Liste aus und klicke auf "Anmelden".
              Nach Auswahl deines Namens aus der Mitgliederliste erhältst du eine Bestätigungs-E-Mail.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
