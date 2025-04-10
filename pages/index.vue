<script setup>
definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div>
    <div class="py-12 bg-[#ffb700] mb-8">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold text-black mb-4">
          BTC Wettkampfanmeldung
        </h1>
        <p class="text-xl text-black">
          Einfache Anmeldung zu Vereinswettkämpfen für BTC-Mitglieder
        </p>
      </div>
    </div>

    <div class="container mx-auto px-4">
      <h2 class="text-2xl font-bold mb-6">
        Aktuelle Wettkämpfe
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Beispiel für einen Wettkampf-Card (wird später dynamisch) -->
        <div class="border rounded-lg overflow-hidden shadow-md">
          <div class="bg-black text-white p-4">
            <h3 class="text-xl font-bold">
              Beispiel-Wettkampf
            </h3>
            <p class="text-[#ffb700]">
              15. Dezember 2024
            </p>
          </div>
          <div class="p-4">
            <p class="mb-2">
              Ort: Berlin
            </p>
            <p class="mb-4">
              Meldefrist: 1. Dezember 2024
            </p>
            <div class="flex space-x-2">
              <NuxtLink to="/competitions/1" class="bg-[#ffb700] text-black px-4 py-2 rounded hover:bg-yellow-600">
                Details
              </NuxtLink>
              <NuxtLink to="/register/1" class="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Anmelden
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Platzhalter für weitere Wettkämpfe -->
        <div class="border rounded-lg overflow-hidden shadow-md bg-gray-50 flex items-center justify-center p-8">
          <p class="text-gray-400 text-center">
            Weitere Wettkämpfe werden hier angezeigt
          </p>
        </div>
      </div>

      <div class="mt-12 mb-8">
        <h2 class="text-2xl font-bold mb-6">
          Über das Anmeldesystem
        </h2>
        <div class="bg-gray-50 p-6 rounded-lg">
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
</template>
