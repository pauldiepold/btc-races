<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useRepositories } from '~/composables/useRepositories'
import { useToastMessages } from '~/composables/useToastMessages'

definePageMeta({
  colorMode: 'dark',
})

// Die Wettkampf-ID aus der Route
const route = useRoute()
const competitionId = route.params.id as string

const { competitions } = useRepositories()
const { showError, showSuccess } = useToastMessages()

const { data: competition } = await useAsyncData(
  `competition-${competitionId}`,
  async () => {
    const result = await competitions.findById(competitionId)
    if (!result) {
      showError('Wettkampf konnte nicht geladen werden')
    }
    return result
  }
)

// Umleitung zur Übersichtsseite, wenn der Wettkampf nicht gefunden wurde
if (!competition.value) {
  navigateTo('/')
}

const memberStore = useMemberStore()

const { schema, createFormState } = useRegistrationSchema()

const state = ref<Partial<RegistrationSchema>>(
  createFormState(parseInt(competitionId))
)
const isSubmitting = ref(false)

const memberOptions = computed(() => {
  return competition.value?.registration_type === 'LADV'
    ? memberStore.startpassMemberOptions
    : memberStore.memberOptions
})

async function onSubmit(event: FormSubmitEvent<RegistrationSchema>) {
  isSubmitting.value = true
  try {
    const { error } = await $fetch('/api/registration', {
      method: 'POST',
      body: {
        ...event.data,
        competition_id: parseInt(competitionId),
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    showSuccess(
      'Deine Anmeldung wurde erfolgreich erstellt. Du erhältst in Kürze eine Bestätigungsmail.'
    )

    // Weiterleitung zur Detailseite
    await navigateTo(`/competitions/${competitionId}`)
  } catch (error: any) {
    showError(error.message || 'Ein Fehler ist aufgetreten.')
  } finally {
    isSubmitting.value = false
  }
}

async function onError(error: any) {
  console.log(error)
  showError('Bitte überprüfe deine Eingaben.')
}
</script>

<template>
  <BasePage
    :heading="competition?.name"
    :back-link="`/competitions/${competition?.id}`"
    back-link-text="Zurück zum Wettkampf"
    max-width="max-w-3xl"
  >
    <h2 class="mb-4 text-lg font-bold">Anmeldung</h2>
    <BaseLayer>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
        @error="onError"
      >
        <UFormField label="Name" name="member" size="lg" required>
          <USelect
            v-model="state.member_id"
            :items="memberOptions"
            option-attribute="label"
            value-attribute="value"
            placeholder="Bitte wählen"
            class="w-full"
          />
          <template #help>
            Für einen meldepflichtigen Wettkampf über LADV brauchst du einen
            DLV-Startpass.
          </template>
        </UFormField>

        <UFormField label="Anmerkungen" name="notes" size="lg">
          <UTextarea
            v-model="state.notes"
            class="w-full"
            placeholder="Hast du Anmerkungen zur Anmeldung? (Disziplin, Startblock, etc.)"
          />
        </UFormField>

        <UFormField
          v-if="state.member_id"
          name="terms"
          size="lg"
          required
          color="primary"
        >
          <UCheckbox
            v-model="state.terms_accepted"
            required
            :label="`Ich bestätige hiermit, dass ich ${memberStore.getMemberById(state.member_id)?.name} bin und am Wettkampf ${competition?.name} teilnehmen möchte.`"
            :ui="{
              base: 'dark:ring-(--ui-primary)',
            }"
          />
        </UFormField>

        <p class="text-sm text-gray-400">
          Nach Absenden des Formulars erhältst du eine E-Mail an deine bei uns
          hinterlegte E-Mail-Adresse mit einem Link, über den du deine Teilnahme
          bestätigen musst.
        </p>

        <UButton type="submit" color="primary" :loading="isSubmitting">
          Anmeldung absenden
        </UButton>
      </UForm>
    </BaseLayer>
    <template v-if="competition">
      <h2 class="mt-8 mb-4 text-lg font-bold">
        Wettkampfdetails zu {{ competition.name }}
      </h2>
      <CompetitionDetails :competition="competition" />
    </template>
  </BasePage>
</template>
