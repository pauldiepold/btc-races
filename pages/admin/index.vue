<script setup>
definePageMeta({
  layout: 'admin',
})

// Später werden diese Daten aus Supabase geladen
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">
      Admin-Dashboard
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Dashboard-Karten -->
      <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#ffb700]">
        <h2 class="text-xl font-bold mb-2">
          Wettkämpfe
        </h2>
        <p class="text-3xl font-bold">
          5
        </p>
        <p class="text-sm text-gray-500 mt-2">
          Aktive Wettkämpfe
        </p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#ffb700]">
        <h2 class="text-xl font-bold mb-2">
          Mitglieder
        </h2>
        <p class="text-3xl font-bold">
          128
        </p>
        <p class="text-sm text-gray-500 mt-2">
          Registrierte Mitglieder
        </p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#ffb700]">
        <h2 class="text-xl font-bold mb-2">
          Anmeldungen
        </h2>
        <p class="text-3xl font-bold">
          42
        </p>
        <p class="text-sm text-gray-500 mt-2">
          Bestätigte Anmeldungen
        </p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#ffb700]">
        <h2 class="text-xl font-bold mb-2">
          Ausstehend
        </h2>
        <p class="text-3xl font-bold">
          8
        </p>
        <p class="text-sm text-gray-500 mt-2">
          Unbestätigte Anmeldungen
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Aktuelle Wettkämpfe -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">
            Aktuelle Wettkämpfe
          </h2>
          <NuxtLink to="/admin/competitions" class="text-[#ffb700] hover:underline text-sm">
            Alle anzeigen
          </NuxtLink>
        </div>

        <div class="space-y-4">
          <div class="border-b pb-4">
            <div class="flex justify-between">
              <h3 class="font-medium">
                Berliner Triathlon Cup
              </h3>
              <span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Aktiv</span>
            </div>
            <p class="text-sm text-gray-500">
              15. Dezember 2024
            </p>
            <div class="flex justify-between mt-2">
              <p class="text-sm">
                12 Anmeldungen
              </p>
              <NuxtLink to="/admin/competitions/1" class="text-[#ffb700] hover:underline text-sm">
                Details
              </NuxtLink>
            </div>
          </div>

          <div class="border-b pb-4">
            <div class="flex justify-between">
              <h3 class="font-medium">
                Hamburg Triathlon
              </h3>
              <span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Aktiv</span>
            </div>
            <p class="text-sm text-gray-500">
              28. Januar 2025
            </p>
            <div class="flex justify-between mt-2">
              <p class="text-sm">
                8 Anmeldungen
              </p>
              <NuxtLink to="/admin/competitions/2" class="text-[#ffb700] hover:underline text-sm">
                Details
              </NuxtLink>
            </div>
          </div>

          <div class="border-b pb-4">
            <div class="flex justify-between">
              <h3 class="font-medium">
                München Marathon
              </h3>
              <span class="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Bald</span>
            </div>
            <p class="text-sm text-gray-500">
              10. März 2025
            </p>
            <div class="flex justify-between mt-2">
              <p class="text-sm">
                Noch keine Anmeldungen
              </p>
              <NuxtLink to="/admin/competitions/3" class="text-[#ffb700] hover:underline text-sm">
                Details
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Neueste Anmeldungen -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">
            Neueste Anmeldungen
          </h2>
          <NuxtLink to="/admin/registrations" class="text-[#ffb700] hover:underline text-sm">
            Alle anzeigen
          </NuxtLink>
        </div>

        <div class="space-y-4">
          <div class="border-b pb-4">
            <div class="flex justify-between">
              <h3 class="font-medium">
                Peter Schmidt
              </h3>
              <span class="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Ausstehend</span>
            </div>
            <p class="text-sm text-gray-500">
              Berliner Triathlon Cup
            </p>
            <div class="flex justify-between mt-2">
              <p class="text-sm text-gray-500">
                Vor 2 Stunden
              </p>
              <div>
                <button class="text-green-600 hover:underline text-sm mr-2">
                  Bestätigen
                </button>
                <button class="text-red-600 hover:underline text-sm">
                  Ablehnen
                </button>
              </div>
            </div>
          </div>

          <div class="border-b pb-4">
            <div class="flex justify-between">
              <h3 class="font-medium">
                Maria Musterfrau
              </h3>
              <span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Bestätigt</span>
            </div>
            <p class="text-sm text-gray-500">
              Hamburg Triathlon
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Vor 5 Stunden
            </p>
          </div>

          <div class="border-b pb-4">
            <div class="flex justify-between">
              <h3 class="font-medium">
                Max Mustermann
              </h3>
              <span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Bestätigt</span>
            </div>
            <p class="text-sm text-gray-500">
              Berliner Triathlon Cup
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Vor 1 Tag
            </p>
          </div>

          <div class="border-b pb-4">
            <div class="flex justify-between">
              <h3 class="font-medium">
                Anna Müller
              </h3>
              <span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Bestätigt</span>
            </div>
            <p class="text-sm text-gray-500">
              Hamburg Triathlon
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Vor 2 Tagen
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
