<template>
  <div>
    <div class="py-8 bg-gray-100 mb-8">
      <div class="container mx-auto px-4">
        <h1 class="text-3xl font-bold mb-2">
          Wettkämpfe
        </h1>
        <p class="text-gray-600">
          Hier findest du alle aktuellen Wettkämpfe des BTC
        </p>
      </div>
    </div>

    <div class="container mx-auto px-4">
      <!-- Filteroptionen -->
      <div class="mb-8 p-4 bg-white border rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold mb-4">
          Filter
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Zeitraum</label>
            <select class="w-full border-gray-300 rounded-md shadow-sm">
              <option>Alle Zeiträume</option>
              <option>Nächste 30 Tage</option>
              <option>Nächste 90 Tage</option>
              <option>Dieses Jahr</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ort</label>
            <select class="w-full border-gray-300 rounded-md shadow-sm">
              <option>Alle Orte</option>
              <option>Berlin</option>
              <option>Hamburg</option>
              <option>München</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select class="w-full border-gray-300 rounded-md shadow-sm">
              <option>Alle</option>
              <option>Anmeldung möglich</option>
              <option>Meldefrist abgelaufen</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Wettkampfliste -->
      <div class="space-y-6">
        <!-- Beispiel für einen Wettkampf (wird später dynamisch) -->
        <div class="border rounded-lg overflow-hidden shadow-md">
          <div class="bg-black text-white p-4">
            <h3 class="text-xl font-bold">
              Berliner Triathlon Cup
            </h3>
            <p class="text-primary">
              15. Dezember 2024
            </p>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p class="text-sm text-gray-500">
                  Ort
                </p>
                <p>Berlin, Wannsee</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">
                  Meldefrist
                </p>
                <p>1. Dezember 2024</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">
                  Status
                </p>
                <p class="text-green-600">
                  Anmeldung möglich
                </p>
              </div>
            </div>
            <div class="flex space-x-2">
              <NuxtLink to="/competitions/1" class="bg-primary text-black px-4 py-2 rounded hover:bg-primary">
                Details
              </NuxtLink>
              <NuxtLink to="/register/1" class="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Anmelden
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Beispiel für einen weiteren Wettkampf -->
        <div class="border rounded-lg overflow-hidden shadow-md">
          <div class="bg-black text-white p-4">
            <h3 class="text-xl font-bold">
              Hamburg Triathlon
            </h3>
            <p class="text-primary">
              28. Januar 2025
            </p>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p class="text-sm text-gray-500">
                  Ort
                </p>
                <p>Hamburg, Alster</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">
                  Meldefrist
                </p>
                <p>15. Januar 2025</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">
                  Status
                </p>
                <p class="text-green-600">
                  Anmeldung möglich
                </p>
              </div>
            </div>
            <div class="flex space-x-2">
              <NuxtLink to="/competitions/2" class="bg-primary text-black px-4 py-2 rounded hover:bg-primary">
                Details
              </NuxtLink>
              <NuxtLink to="/register/2" class="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Anmelden
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
