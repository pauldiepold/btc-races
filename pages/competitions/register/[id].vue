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
    setTimeout(async () => {
      await navigateTo(`/competitions/${competitionId}`)
    }, 1500)
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
    :heading="`Anmeldung: ${competition?.name}`"
    :back-link="`/competitions/${competition?.id}`"
    back-link-text="Zurück zum Wettkampf"
  >
    <BaseLayer class="max-w-2xl">
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
        </UFormField>

        <UFormField label="Anmerkungen" name="notes" size="lg">
          <UTextarea
            v-model="state.notes"
            class="w-full"
            placeholder="Hast du Anmerkungen zur Anmeldung? (Disziplin, Startblock, etc.)"
          />
        </UFormField>

        <UFormField name="terms" size="lg" required color="primary">
          <UCheckbox
            v-model="state.terms_accepted"
            required
            label="Ich bestätige hiermit meine Teilnahme am Wettkampf"
            :ui="{
              base: 'dark:ring-(--ui-primary)',
            }"
          />
          <template #help>
            Nach Absenden des Formulars erhältst du eine E-Mail mit einem
            Bestätigungslink. Klicke diesen an, um deine Teilnahme zu
            bestätigen.
          </template>
        </UFormField>

        <UButton type="submit" color="primary"> Anmeldung absenden </UButton>
      </UForm>
    </BaseLayer>
  </BasePage>
</template>
