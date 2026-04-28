<script setup lang="ts">
import type { RegistrationCoachView } from '~~/shared/types/events'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { diffLadvRegistration } from '~~/shared/utils/ladv-diff'
import { ladvDisciplineLabel, ladvAgeClassLabel } from '~~/shared/utils/ladv-labels'

const props = defineProps<{
  registrationId: number
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'done': []
}>()

const toast = useToast()
const loading = ref(false)

const { data: reg, status: fetchStatus } = await useFetch<RegistrationCoachView>(
  () => `/api/registrations/${props.registrationId}`,
)

// LADV-Stand editor state — null → init from wish, non-null → keep
const editorDisciplines = ref<RegistrationDisciplinePair[]>([])
const selectedStatus = ref<string>('')

watch(reg, (val) => {
  if (!val) return
  editorDisciplines.value = val.ladvDisciplines === null
    ? [...val.wishDisciplines]
    : [...val.ladvDisciplines]
  selectedStatus.value = val.status
}, { immediate: true })

const diff = computed(() =>
  diffLadvRegistration(editorDisciplines.value, reg.value?.ladvDisciplines ?? []),
)

const fullName = computed(() =>
  [reg.value?.firstName, reg.value?.lastName].filter(Boolean).join(' ') || 'Unbekannt',
)

// Wettbewerbe für Selects
const wettbewerbe = computed(() => reg.value?.event.wettbewerbe ?? [])

const uniqueDisciplines = computed(() => {
  const seen = new Set<string>()
  return wettbewerbe.value.filter((w) => {
    if (seen.has(w.disziplinNew)) return false
    seen.add(w.disziplinNew)
    return true
  })
})

const usedCodes = computed(() => new Set(editorDisciplines.value.map(d => d.discipline)))

const availableDisciplineItems = computed(() =>
  uniqueDisciplines.value
    .filter(w => !usedCodes.value.has(w.disziplinNew))
    .map(w => ({ label: ladvDisciplineLabel(w.disziplinNew), value: w.disziplinNew })),
)

function ageClassItemsFor(disciplineCode: string) {
  return wettbewerbe.value
    .filter(w => w.disziplinNew === disciplineCode)
    .map(w => ({ label: ladvAgeClassLabel(w.klasseNew), value: w.klasseNew }))
}

// Add-row state
const showAddRow = ref(false)
const addCode = ref('')
const addAgeClass = ref('')

const addAgeClassItems = computed(() => ageClassItemsFor(addCode.value))

watch(addCode, (code) => {
  const items = ageClassItemsFor(code)
  addAgeClass.value = items[0]?.value ?? ''
})

function confirmAddRow() {
  if (!addCode.value || !addAgeClass.value) return
  editorDisciplines.value.push({ discipline: addCode.value, ageClass: addAgeClass.value })
  addCode.value = ''
  addAgeClass.value = ''
  showAddRow.value = false
}

function removeRow(index: number) {
  editorDisciplines.value.splice(index, 1)
}

// LADV links
const ladvId = computed(() => reg.value?.event.ladvId)
const ladvRegisterUrl = computed(() => ladvId.value ? `https://ladv.de/meldung/addathlet/${ladvId.value}` : undefined)
const ladvListUrl = computed(() => ladvId.value ? `https://ladv.de/meldung/anmeldungen/${ladvId.value}` : undefined)

// Status options
const statusOptions = computed(() => {
  const current = reg.value?.status
  if (!current) return []
  // For LADV events: registered ↔ canceled
  const all = [
    { label: 'Angemeldet', value: 'registered' },
    { label: 'Storniert', value: 'canceled' },
  ]
  return all
})

async function save() {
  loading.value = true
  try {
    await $fetch(`/api/registrations/${props.registrationId}/ladv-stand`, {
      method: 'PUT',
      body: { disciplines: editorDisciplines.value },
    })

    if (selectedStatus.value !== reg.value?.status) {
      await $fetch(`/api/registrations/${props.registrationId}`, {
        method: 'PATCH',
        body: { status: selectedStatus.value },
      })
    }

    toast.add({ title: 'Gespeichert', color: 'success' })
    emit('update:open', false)
    emit('done')
  }
  catch {
    toast.add({ title: 'Fehler beim Speichern', color: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <!-- Laden -->
      <div
        v-if="fetchStatus === 'pending'"
        class="p-6 space-y-4"
      >
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-24 w-full" />
        <USkeleton class="h-24 w-full" />
      </div>

      <div
        v-else-if="reg"
        class="p-6 space-y-5"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <UAvatar
              :src="reg.avatarUrl ?? undefined"
              :alt="`${reg.firstName ?? ''} ${reg.lastName ?? ''}`"
              size="md"
              class="shrink-0"
            />
            <div class="min-w-0">
              <p class="font-semibold text-highlighted text-base">
                {{ fullName }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                {{ reg.event.name }}
              </p>
            </div>
          </div>
          <UBadge
            v-if="diff.length > 0"
            :label="reg.status === 'canceled' ? 'Von LADV abmelden' : 'In LADV anmelden'"
            :color="reg.status === 'canceled' ? 'error' : 'info'"
            variant="subtle"
            class="shrink-0"
          />
        </div>

        <!-- Wunschstand (read-only) -->
        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            Wunschstand (Athlet)
          </p>
          <div
            v-if="reg.wishDisciplines.length"
            class="flex flex-wrap gap-1.5"
          >
            <LadvBadge
              v-for="d in reg.wishDisciplines"
              :key="d.discipline"
              :discipline="d.discipline"
              :age-class="d.ageClass"
              size="sm"
            />
          </div>
          <p
            v-else
            class="text-sm text-muted italic"
          >
            Keine Disziplinen gewählt
          </p>
        </div>

        <!-- LADV-Stand Editor -->
        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            LADV-Stand (Coach)
          </p>

          <div
            v-if="editorDisciplines.length"
            class="space-y-2 mb-2"
          >
            <div
              v-for="(entry, i) in editorDisciplines"
              :key="i"
              class="flex items-center gap-2"
            >
              <UBadge
                :label="`${ladvDisciplineLabel(entry.discipline)} · ${ladvAgeClassLabel(entry.ageClass)}`"
                color="neutral"
                variant="outline"
                size="sm"
                class="flex-1"
              />
              <UButton
                icon="i-ph-x"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="removeRow(i)"
              />
            </div>
          </div>

          <!-- Add-Row -->
          <div
            v-if="showAddRow"
            class="flex items-center gap-2 mt-2"
          >
            <USelect
              v-model="addCode"
              :items="availableDisciplineItems"
              placeholder="Disziplin"
              size="sm"
              class="flex-1"
            />
            <USelect
              v-model="addAgeClass"
              :items="addAgeClassItems"
              placeholder="AK"
              size="sm"
              class="w-24"
              :disabled="!addCode"
            />
            <UButton
              icon="i-ph-check"
              color="primary"
              variant="ghost"
              size="sm"
              :disabled="!addCode || !addAgeClass"
              @click="confirmAddRow"
            />
            <UButton
              icon="i-ph-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="showAddRow = false"
            />
          </div>

          <UButton
            v-if="!showAddRow && availableDisciplineItems.length > 0"
            icon="i-ph-plus"
            label="Disziplin hinzufügen"
            color="neutral"
            variant="ghost"
            size="xs"
            class="mt-1"
            @click="showAddRow = true"
          />
        </div>

        <!-- Diff-Vorschau -->
        <div v-if="diff.length > 0">
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            Änderungen auf ladv.de
          </p>
          <div class="space-y-1.5">
            <div
              v-for="entry in diff"
              :key="`${entry.discipline}:${entry.ageClass}`"
              class="flex items-center gap-2"
            >
              <UIcon
                :name="entry.type === 'add' ? 'i-ph-plus-circle' : entry.type === 'remove' ? 'i-ph-minus-circle' : 'i-ph-arrow-right'"
                :class="entry.type === 'add' ? 'text-success' : entry.type === 'remove' ? 'text-error' : 'text-warning'"
                class="size-4 shrink-0"
              />
              <LadvBadge
                :discipline="entry.discipline"
                :age-class="entry.ageClass"
                size="sm"
                :variant="entry.type === 'add' ? 'subtle' : 'outline'"
              />
              <span
                v-if="entry.type === 'update'"
                class="text-xs text-muted"
              >
                (war: {{ ladvAgeClassLabel(entry.previousAgeClass) }})
              </span>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex items-center gap-2 text-xs text-muted"
        >
          <UIcon
            name="i-ph-check-circle"
            class="size-4 text-success"
          />
          Keine Änderungen gegenüber dem aktuellen LADV-Stand.
        </div>

        <!-- Status-Picker -->
        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            Anmeldestatus
          </p>
          <div class="flex gap-2">
            <UButton
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :color="selectedStatus === opt.value ? (opt.value === 'canceled' ? 'error' : 'primary') : 'neutral'"
              :variant="selectedStatus === opt.value ? 'solid' : 'outline'"
              size="sm"
              @click="selectedStatus = opt.value"
            />
          </div>
        </div>

        <!-- LADV-Direktlinks -->
        <div
          v-if="ladvId"
          class="flex flex-col gap-2"
        >
          <UButton
            :to="ladvRegisterUrl"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-ph-user-plus"
            label="In LADV anmelden"
            color="neutral"
            variant="outline"
            trailing-icon="i-ph-arrow-up-right-bold"
            size="sm"
            block
          />
          <UButton
            :to="ladvListUrl"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-ph-list"
            label="LADV-Anmeldeliste"
            color="neutral"
            variant="ghost"
            trailing-icon="i-ph-arrow-up-right-bold"
            size="sm"
            block
          />
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 pt-1 border-t border-default">
          <UButton
            label="Schließen"
            color="neutral"
            variant="ghost"
            @click="emit('update:open', false)"
          />
          <UButton
            label="Speichern"
            color="primary"
            :loading="loading"
            @click="save"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
