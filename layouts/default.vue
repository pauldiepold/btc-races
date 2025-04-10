<script setup>
// Layout-spezifische Logik kann hier hinzugefügt werden
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-black text-white p-4">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold">
          <NuxtLink to="/" class="flex items-center">
            <span class="text-[#ffb700] mr-2">BTC</span> Wettkampfanmeldung
          </NuxtLink>
        </h1>
        <nav>
          <ul class="flex space-x-4">
            <li>
              <NuxtLink to="/" class="hover:text-[#ffb700]">
                Startseite
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/competitions" class="hover:text-[#ffb700]">
                Wettkämpfe
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="flex-1 container mx-auto p-4">
      <slot />
    </main>

    <footer class="bg-black text-white p-4 mt-auto">
      <div class="container mx-auto">
        <div class="flex justify-between items-center">
          <div>
            <p>© {{ new Date().getFullYear() }} BTC Wettkampfanmeldung</p>
          </div>
          <div>
            <p>Entwickelt mit Nuxt und Supabase</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Layout-spezifische Stile können hier hinzugefügt werden */
</style>
