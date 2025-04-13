<script setup lang="ts">
import type { Database } from '~/types/database.types'

const client = useSupabaseClient<Database>()
const user = useSupabaseUser()

// Filter-Status
const searchQuery = ref('')

// Hilfsfunktionen für Datumsprüfung
const today = computed(() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
})

function isEventInPast(date: string) {
  if (!date) return false
  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)
  return eventDate < today.value
}

// Hilfsfunktion für Datumssortierung
const sortByDate = (a: any, b: any) =>
  new Date(a.date).getTime() - new Date(b.date).getTime()

// Status für die Anzahl der zusätzlich angezeigten Events
const additionalPastEvents = ref(0)
const additionalFutureEvents = ref(0)
const eventsPerLoad = 2

const {
  data: competitions,
  pending: loading,
  error,
} = await useAsyncData('competitions', async () => {
  const { data, error: supabaseError } = await client
    .from('competitions')
    .select('*')
    .order('date', { ascending: true })

  if (supabaseError) throw supabaseError

  return data
})

// Gefilterte Events
const filteredEvents = computed(() => {
  if (!competitions.value) return []

  return competitions.value.filter((event) => {
    // Wenn keine Suche aktiv ist, alle Events zurückgeben
    if (!searchQuery.value) return true

    // Suchbegriffe in Kleinbuchstaben aufteilen
    const suchbegriffe = searchQuery.value.toLowerCase().split(' ')

    // Zu durchsuchende Felder vorbereiten
    const eventFelder = [event.name, event.description, event.location]

    // Leere Felder entfernen und in Kleinbuchstaben umwandeln
    const durchsuchbareFelder = eventFelder
      .filter((feld) => feld) // Leere Felder entfernen
      .map((feld) => feld?.toLowerCase())

    // Prüfen ob ALLE Suchbegriffe in MINDESTENS EINEM Feld vorkommen
    return suchbegriffe.every((begriff) => {
      return durchsuchbareFelder.some((feld) => feld?.includes(begriff))
    })
  })
})

// Aufgeteilte Events
const pastEvents = computed(() => {
  return filteredEvents.value
    .filter((event) => isEventInPast(event.date))
    .sort((a, b) => -sortByDate(a, b)) // Neueste vergangene zuerst
})

const futureEvents = computed(() => {
  return filteredEvents.value
    .filter((event) => !isEventInPast(event.date))
    .sort(sortByDate) // Nächste zuerst
})

// Sichtbare Events
const visibleEvents = computed(() => {
  // Wenn eine Suche aktiv ist, zeige alle gefundenen Events
  if (searchQuery.value) {
    return [...pastEvents.value, ...futureEvents.value].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })
  }

  // Ansonsten zeige nur die angeforderte Anzahl
  const visiblePast = pastEvents.value.slice(0, additionalPastEvents.value)
  const visibleFuture = futureEvents.value.slice(
    0,
    eventsPerLoad + additionalFutureEvents.value
  )

  return [...visiblePast, ...visibleFuture].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })
})

// Prüfen, ob es mehr Events gibt
const hasMorePastEvents = computed(() => {
  // Keine "Mehr laden" Buttons während der Suche
  if (searchQuery.value) return false
  return additionalPastEvents.value < pastEvents.value.length
})

const hasMoreFutureEvents = computed(() => {
  // Keine "Mehr laden" Buttons während der Suche
  if (searchQuery.value) return false
  return (
    eventsPerLoad + additionalFutureEvents.value < futureEvents.value.length
  )
})

// Funktionen zum Laden weiterer Events
function loadMorePastEvents() {
  additionalPastEvents.value += eventsPerLoad
}

function loadMoreFutureEvents() {
  additionalFutureEvents.value += eventsPerLoad
}

// Reset der Anzahl angezeigter Events wenn die Suche beendet wird
watch(searchQuery, (newValue) => {
  if (!newValue) {
    additionalPastEvents.value = 0
    additionalFutureEvents.value = 0
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Veranstaltungen</h1>
      <NuxtLink
        v-if="user"
        to="/admin/competitions/new"
        class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
      >
        Neue Veranstaltung
      </NuxtLink>
    </div>

    <div class="flex flex-col gap-8 lg:flex-row">
      <!-- Hauptinhalt -->
      <div class="flex-1">
        <!-- Suchfeld -->
        <div class="mb-8">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Veranstaltung suchen..."
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
          </div>
        </div>

        <!-- Lade-Status -->
        <div v-if="loading" class="py-8 text-center">
          <div
            class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
          />
        </div>

        <!-- Fehlermeldung -->
        <div
          v-else-if="error"
          class="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
        >
          Ein Fehler ist aufgetreten beim Laden der Veranstaltungen.
        </div>

        <!-- Keine Ergebnisse -->
        <div
          v-else-if="visibleEvents.length === 0"
          class="py-8 text-center text-gray-500"
        >
          Keine Veranstaltungen gefunden
        </div>

        <template v-else>
          <!-- "Ältere anzeigen" Button -->
          <div v-if="hasMorePastEvents" class="mb-6">
            <button
              class="w-full rounded-md border border-gray-200 bg-gray-50 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-100"
              @click="loadMorePastEvents"
            >
              Ältere Veranstaltungen anzeigen
            </button>
          </div>

          <!-- Veranstaltungsliste -->
          <TransitionGroup name="list" tag="div" class="space-y-4">
            <div v-for="competition in visibleEvents" :key="competition.id">
              <CompetitionCard
                :competition="competition"
                class="block w-full transition-all duration-300"
              />
            </div>
          </TransitionGroup>

          <!-- "Weitere anzeigen" Button -->
          <div v-if="hasMoreFutureEvents" class="mt-6">
            <button
              class="w-full rounded-md border border-gray-200 bg-gray-50 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-100"
              @click="loadMoreFutureEvents"
            >
              Weitere Veranstaltungen anzeigen
            </button>
          </div>
        </template>
      </div>

      <!-- Seitenleiste -->
      <div class="space-y-6 lg:w-1/3">
        <div class="rounded-lg bg-white p-6 shadow-md">
          <h2 class="mb-4 text-lg font-semibold">Seitenleiste</h2>
          <p class="text-gray-600">Hier kommt später weiterer Inhalt hin.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(0px);
}

.list-leave-active {
  position: absolute;
}
</style>
