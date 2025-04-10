<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient<Database>()

const competitions = ref<Database['public']['Tables']['competitions']['Row'][]>([])
const loading = ref(true)
const error = ref('')

// Filter-Status
const showArchived = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')

// Kategorien aus den Veranstaltungen extrahieren
const categories = computed(() => {
  const allCategories = competitions.value
    .flatMap(c => c.categories?.split(',').map(cat => cat.trim()) || [])
    .filter(Boolean)
  return [...new Set(allCategories)]
})

// Veranstaltungen laden
async function loadCompetitions() {
  try {
    loading.value = true
    const { data, error: supabaseError } = await supabase
      .from('competitions')
      .select('*')
      .order('date', { ascending: true })

    if (supabaseError)
      throw supabaseError
    competitions.value = data
  }
  catch (e) {
    console.error('Fehler beim Laden der Veranstaltungen:', e)
    error.value = 'Es ist ein Fehler beim Laden der Veranstaltungen aufgetreten.'
  }
  finally {
    loading.value = false
  }
}

// Gefilterte Veranstaltungen
const filteredCompetitions = computed(() => {
  return competitions.value.filter((competition) => {
    // Archivierte Veranstaltungen filtern
    if (!showArchived.value && competition.is_archived)
      return false

    // Suchanfrage filtern
    if (searchQuery.value) {
      const searchLower = searchQuery.value.toLowerCase()
      const matchesSearch
        = competition.name.toLowerCase().includes(searchLower)
          || competition.description?.toLowerCase().includes(searchLower)
          || competition.location.toLowerCase().includes(searchLower)
      if (!matchesSearch)
        return false
    }

    // Kategorie filtern
    if (selectedCategory.value) {
      const competitionCategories = competition.categories?.split(',').map(c => c.trim()) || []
      if (!competitionCategories.includes(selectedCategory.value))
        return false
    }

    return true
  })
})

onMounted(() => {
  loadCompetitions()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">
        Veranstaltungen
      </h1>
      <NuxtLink
        to="/admin/competitions/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Neue Veranstaltung
      </NuxtLink>
    </div>

    <!-- Filter-Bereich -->
    <div class="mb-8 space-y-4">
      <!-- Suchfeld -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Veranstaltung suchen..."
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
      </div>

      <!-- Filter-Optionen -->
      <div class="flex flex-wrap gap-4">
        <!-- Kategorie-Filter -->
        <select
          v-model="selectedCategory"
          class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">
            Alle Kategorien
          </option>
          <option
            v-for="category in categories"
            :key="category"
            :value="category"
          >
            {{ category }}
          </option>
        </select>

        <!-- Archiv-Filter -->
        <label class="inline-flex items-center">
          <input
            v-model="showArchived"
            type="checkbox"
            class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
          <span class="ml-2 text-sm text-gray-700">Archivierte anzeigen</span>
        </label>
      </div>
    </div>

    <!-- Lade-Status -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
    </div>

    <!-- Fehlermeldung -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>

    <!-- Keine Ergebnisse -->
    <div v-else-if="filteredCompetitions.length === 0" class="text-center py-8 text-gray-500">
      Keine Veranstaltungen gefunden
    </div>

    <!-- Veranstaltungsliste -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CompetitionCard
        v-for="competition in filteredCompetitions"
        :key="competition.id"
        :competition="competition"
      />
    </div>
  </div>
</template>
