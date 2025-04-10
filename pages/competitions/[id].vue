<script setup>
// Die tatsächliche Wettkampf-ID wird aus der Route extrahiert
const route = useRoute()
const competitionId = route.params.id

// Später: Hier werden wir die Wettkampfdaten von Supabase abrufen
// const { data: competition } = await useFetch(`/api/competitions/${competitionId}`)
</script>

<template>
  <div>
    <div class="py-8 bg-gray-100 mb-8">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center">
          <div>
            <NuxtLink to="/competitions" class="text-primary hover:underline mb-2 inline-block">
              &larr; Zurück zur Übersicht
            </NuxtLink>
            <h1 class="text-3xl font-bold">
              Berliner Triathlon Cup
            </h1>
          </div>
          <NuxtLink to="/register/1" class="bg-primary text-black px-6 py-2 rounded-lg hover:bg-primary">
            Anmelden
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div class="col-span-2">
          <div class="bg-white p-6 rounded-lg shadow-md mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Datum
                </h3>
                <p class="text-lg">
                  15. Dezember 2024
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Ort
                </h3>
                <p class="text-lg">
                  Berlin, Wannsee
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Meldefrist
                </h3>
                <p class="text-lg">
                  1. Dezember 2024
                </p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">
                  Status
                </h3>
                <p class="text-lg text-green-600">
                  Anmeldung möglich
                </p>
              </div>
            </div>

            <h2 class="text-xl font-bold mb-4">
              Beschreibung
            </h2>
            <div class="prose max-w-none">
              <p>
                Der Berliner Triathlon Cup ist ein jährlich stattfindender Wettkampf für alle Triathleten des BTC.
                In diesem Jahr findet er am Wannsee statt und beinhaltet folgende Disziplinen:
              </p>
              <ul class="list-disc pl-5 mt-2">
                <li>Schwimmen: 1500m im Wannsee</li>
                <li>Radfahren: 40km durch den Grunewald</li>
                <li>Laufen: 10km entlang des Seeufers</li>
              </ul>
              <p class="mt-4">
                Dieser Wettkampf eignet sich sowohl für Anfänger als auch für erfahrene Triathleten.
              </p>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-bold mb-4">
              Ausschreibung
            </h2>
            <p class="mb-4">
              Weitere Details findest du in der offiziellen Ausschreibung:
            </p>
            <a href="#" class="bg-black text-white px-4 py-2 rounded inline-flex items-center">
              <span class="mr-2">Ausschreibung öffnen</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <div class="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 class="text-xl font-bold mb-4">
              Teilnehmer
            </h2>
            <p class="text-sm text-gray-500 mb-4">
              Bereits 12 Mitglieder angemeldet
            </p>

            <div class="space-y-3">
              <div class="p-3 bg-gray-50 rounded">
                <p class="font-medium">
                  Max Mustermann
                </p>
                <p class="text-sm text-green-600">
                  Bestätigt
                </p>
              </div>
              <div class="p-3 bg-gray-50 rounded">
                <p class="font-medium">
                  Maria Musterfrau
                </p>
                <p class="text-sm text-green-600">
                  Bestätigt
                </p>
              </div>
              <div class="p-3 bg-gray-50 rounded">
                <p class="font-medium">
                  Peter Schmidt
                </p>
                <p class="text-sm text-primary">
                  Ausstehend
                </p>
              </div>
            </div>

            <p class="text-center mt-4 text-sm text-gray-500">
              und 9 weitere...
            </p>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-bold mb-4">
              Fragen?
            </h2>
            <p class="mb-4">
              Bei Fragen zum Wettkampf kontaktiere bitte die Wettkampfleitung.
            </p>
            <a href="mailto:wettkampf@btc.de" class="text-primary hover:underline">wettkampf@btc.de</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
