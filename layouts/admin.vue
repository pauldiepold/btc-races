<script setup>
// Admin-Layout-spezifische Logik kann hier hinzugefügt werden
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-black text-white p-4">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold">
          <NuxtLink to="/admin" class="flex items-center">
            <span class="text-[#ffb700] mr-2">BTC</span> Admin-Bereich
          </NuxtLink>
        </h1>
        <div class="flex items-center">
          <p class="mr-4">
            Willkommen, Admin
          </p>
          <button class="text-[#ffb700] hover:underline">
            Abmelden
          </button>
        </div>
      </div>
    </header>

    <div class="flex-1 flex">
      <aside class="w-64 bg-gray-100 p-4 border-r">
        <nav>
          <ul class="space-y-2">
            <li>
              <NuxtLink to="/admin" class="block p-2 rounded hover:bg-[#ffb700] hover:text-black">
                Dashboard
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/members" class="block p-2 rounded hover:bg-[#ffb700] hover:text-black">
                Mitglieder
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/competitions" class="block p-2 rounded hover:bg-[#ffb700] hover:text-black">
                Wettkämpfe
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/registrations" class="block p-2 rounded hover:bg-[#ffb700] hover:text-black">
                Anmeldungen
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/emails" class="block p-2 rounded hover:bg-[#ffb700] hover:text-black">
                E-Mail-Verwaltung
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>

    <footer class="bg-black text-white p-4">
      <div class="container mx-auto">
        <div class="flex justify-between items-center">
          <div>
            <p>© {{ new Date().getFullYear() }} BTC Admin-Bereich</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Admin-Layout-spezifische Stile können hier hinzugefügt werden */
</style>
