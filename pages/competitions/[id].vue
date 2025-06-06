<script setup lang="ts">
import { useCompetitionRegistration } from '~/composables/useCompetitionRegistration'
import { useRepositories } from '~/composables/useRepositories'
import { useToastMessages } from '~/composables/useToastMessages'

definePageMeta({
  colorMode: 'dark',
})

const route = useRoute()
const user = useSupabaseUser()
const competitionId = route.params.id as string

const { competitions } = useRepositories()
const { showError } = useToastMessages()

const {
  data: competition,
  refresh,
  pending,
} = await useLazyAsyncData(`competition-${competitionId}`, async () => {
  const result = await competitions.findById(competitionId)
  if (!result) {
    showError('Wettkampf konnte nicht geladen werden')
    setTimeout(() => {
      navigateTo('/')
    }, 500)
  }
  return result
})

const canRegister = computed(() => {
  if (!competition.value) return false
  return useCompetitionRegistration(competition.value) === 'REGISTRATION_OPEN'
})

async function refreshCompetition() {
  await refresh()
}
</script>

<template>
  <BasePage
    :heading="competition?.name"
    back-link="/"
    back-link-text="Zurück zur Übersicht"
  >
    <template v-if="!pending && competition" #actions>
      <div class="flex flex-col gap-4 lg:flex-row">
        <UButton
          v-if="canRegister"
          :to="`/competitions/register/${competition.id}`"
          color="primary"
          icon="i-lucide-user-plus"
          size="lg"
          class="w-full justify-center lg:w-auto lg:justify-start"
        >
          Anmelden
        </UButton>

        <CompetitionSyncButton
          :competition="competition"
          @sync-success="refreshCompetition"
        />

        <UButton
          v-if="user"
          :to="`/admin/competitions/${competition.id}/edit`"
          color="neutral"
          icon="i-lucide-pencil"
          variant="outline"
          size="lg"
          class="w-full justify-center lg:w-auto lg:justify-start"
        >
          Wettkampf bearbeiten
        </UButton>
      </div>
    </template>

    <template v-if="!pending && competition" #rightOfHeading>
      <CompetitionStatus :competition="competition" />
    </template>

    <template v-if="pending">
      <div class="flex flex-col gap-4">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-32 w-full" />
        <USkeleton class="h-20 w-full" />
      </div>
    </template>

    <div v-else-if="competition" class="space-y-6">
      <!-- Wettkampfdetails -->
      <CompetitionDetails :competition="competition" />

      <!-- Teilnehmer:innen Komponente -->
      <CompetitionParticipants :competition="competition" />
    </div>

    <template #sidebar>
      <div class="space-y-6">
        <!-- Ausschreibung -->
        <BaseLayer v-if="competition && competition.announcement_link">
          <p class="mb-4">
            Weitere Details findest du in der offiziellen Ausschreibung:
          </p>
          <UButton
            :to="competition.announcement_link"
            target="_blank"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-external-link"
          >
            Ausschreibung öffnen
          </UButton>
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
            trailing-icon="i-lucide-external-link"
          >
            Final Surge öffnen
          </UButton>
        </BaseLayer>
      </div>
    </template>
  </BasePage>
</template>
