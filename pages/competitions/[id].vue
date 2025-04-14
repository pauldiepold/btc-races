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
  <NuxtLayout
    name="base"
    :heading="competition?.name"
    back-link="/"
    back-link-text="Zurück zur Übersicht"
  >
    <template #sidebar>
      <div class="space-y-6">
        <UButton
          v-if="competition"
          :to="`/register/${competition.id}`"
          color="primary"
          size="lg"
          class="w-full justify-center"
        >
          Zu diesem Wettkampf anmelden
        </UButton>
        <BaseLayer>
          <h2 class="mb-4 text-xl font-bold">Teilnehmer</h2>
          <p class="mb-4 text-sm">Bereits 12 Mitglieder angemeldet</p>

          <div class="space-y-3">
            <div class="rounded bg-(--ui-bg) p-3">
              <p class="font-medium">Max Mustermann</p>
              <p class="text-sm text-green-600">Bestätigt</p>
            </div>
            <div class="rounded bg-(--ui-bg) p-3">
              <p class="font-medium">Maria Musterfrau</p>
              <p class="text-sm text-green-600">Bestätigt</p>
            </div>
            <div class="rounded bg-(--ui-bg) p-3">
              <p class="font-medium">Peter Schmidt</p>
              <p class="text-sm">Ausstehend</p>
            </div>
          </div>

          <p class="mt-4 text-center text-sm">und 9 weitere...</p>
        </BaseLayer>

        <!-- Kontakt -->
        <BaseLayer>
          <h2 class="mb-4 text-xl font-bold">Fragen?</h2>
          <p class="mb-4">
            Bei Fragen zum Wettkampf kontaktiere bitte unsere Coaches über Final
            Surge.
          </p>
          <UButton
            to="https://www.finalsurge.com/"
            color="neutral"
            variant="outline"
            target="_blank"
            trailing-icon="lucide:external-link"
          >
            Final Surge öffnen
          </UButton>
        </BaseLayer>
      </div>
    </template>

    <div v-if="competition" class="space-y-6">
      <!-- Wettkampfdetails -->
      <BaseLayer>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <UFormField label="Status" size="lg">
            <CompetitionStatus class="mt-2" :competition="competition" />
          </UFormField>

          <UFormField label="Meldefrist" size="lg">
            <UInput
              :model-value="
                new Date(competition.registration_deadline).toLocaleDateString(
                  'de-DE'
                )
              "
              icon="lucide:clock"
              class="w-full"
              disabled
            />
          </UFormField>

          <UFormField label="Datum" size="lg">
            <UInput
              :model-value="
                new Date(competition.date).toLocaleDateString('de-DE')
              "
              icon="lucide:calendar"
              class="w-full"
              disabled
            />
          </UFormField>

          <UFormField label="Ort" size="lg">
            <UInput
              :model-value="competition.location"
              icon="lucide:map-pin"
              class="w-full"
              disabled
            />
          </UFormField>
        </div>
      </BaseLayer>

      <!-- Beschreibung -->
      <BaseLayer>
        <h2 class="mb-4 text-xl font-bold">Beschreibung</h2>
        <div
          v-if="competition.description"
          class="prose max-w-none"
          v-html="competition.description"
        />
        <div v-else>Keine Beschreibung verfügbar.</div>
      </BaseLayer>

      <!-- Ausschreibung -->
      <BaseLayer v-if="competition.announcement_link">
        <h2 class="mb-4 text-xl font-bold">Ausschreibung</h2>
        <p class="mb-4">
          Weitere Details findest du in der offiziellen Ausschreibung:
        </p>
        <UButton
          :to="competition.announcement_link"
          target="_blank"
          color="neutral"
          variant="soft"
          trailing-icon="lucide:external-link"
        >
          Ausschreibung öffnen
        </UButton>
      </BaseLayer>
    </div>
  </NuxtLayout>
</template>
