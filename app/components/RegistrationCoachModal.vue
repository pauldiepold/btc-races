<script setup lang="ts">
import type { RegistrationCoachView } from '~~/shared/types/events'
import type { RegistrationDisciplinePair } from '~~/shared/types/db'
import { ladvDisciplineLabel, ladvAgeClassLabel } from '~~/shared/utils/ladv-labels'
import { getCoachModalLineState, getCoachModalRemovals } from '~~/shared/utils/ladv-diff'

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

const editorDisciplines = ref<RegistrationDisciplinePair[]>([])
const selectedStatus = ref<string>('')

watch(reg, (val) => {
  if (!val) return
  editorDisciplines.value = [...val.wishDisciplines]
  selectedStatus.value = val.status
}, { immediate: true })

const ladvSnapshot = computed<RegistrationDisciplinePair[] | null>(() => reg.value?.ladvDisciplines ?? null)
const isInitialLadv = computed(() => ladvSnapshot.value === null)
const removals = computed(() => getCoachModalRemovals(editorDisciplines.value, ladvSnapshot.value))
const editorRows = computed(() =>
  editorDisciplines.value.map(line => ({ line, state: getCoachModalLineState(line, ladvSnapshot.value) })),
)

const fullName = computed(() =>
  [reg.value?.firstName, reg.value?.lastName].filter(Boolean).join(' ') || 'Unbekannt',
)

const isCanceled = computed(() => selectedStatus.value === 'canceled')

const ctaLabel = computed(() =>
  isCanceled.value ? 'Die Meldung ist in LADV storniert' : 'Dieser Stand ist in LADV gemeldet',
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
const statusOptions = [
  { label: 'Angemeldet', value: 'registered' },
  { label: 'Storniert', value: 'canceled' },
]

async function save() {
  loading.value = true
  try {
    const disciplines = isCanceled.value ? null : editorDisciplines.value

    await $fetch(`/api/registrations/${props.registrationId}/ladv-stand`, {
      method: 'PUT',
      body: { disciplines },
    })

    if (selectedStatus.value !== reg.value?.status) {
      await $fetch(`/api/registrations/${props.registrationId}`, {
        method: 'PATCH',
        body: { status: selectedStatus.value, silent: true },
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
    <!-- Laden -->
    <template
      v-if="fetchStatus === 'pending'"
      #content
    >
      <div class="p-6 space-y-4">
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-24 w-full" />
        <USkeleton class="h-24 w-full" />
      </div>
    </template>

    <!-- Geladen: Header -->
    <template
      v-if="reg"
      #header
    >
      <div class="flex items-center gap-3">
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
    </template>

    <!-- Geladen: Body -->
    <template
      v-if="reg"
      #body
    >
      <div class="space-y-5">
        <!-- LADV-Direktlinks (oben, prominent) -->
        <div
          v-if="ladvId"
          class="flex gap-2"
        >
          <UButton
            :to="ladvRegisterUrl"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-ph-arrow-up-right-bold"
            :label="isCanceled ? 'In LADV abmelden' : 'Zur LADV-Meldung'"
            color="neutral"
            variant="soft"
            size="sm"
            class="flex-1"
          />
          <UButton
            :to="ladvListUrl"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-ph-list"
            label="Zur Meldeliste"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </div>

        <!-- Erstmelde-Hinweis -->
        <p
          v-if="!isCanceled && isInitialLadv && editorDisciplines.length > 0"
          class="flex items-center gap-1.5 text-xs text-info"
        >
          <UIcon
            name="i-ph-info"
            class="size-3.5 shrink-0"
          />
          Erstmeldung — alle Disziplinen müssen in LADV angemeldet werden.
        </p>

        <!-- Disziplinen -->
        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-2">
            Disziplinen
          </p>

          <template v-if="!isCanceled">
            <div
              v-if="editorDisciplines.length"
              class="space-y-2 mb-2"
            >
              <div
                v-for="(row, i) in editorRows"
                :key="i"
                class="flex items-center gap-2"
              >
                <div class="flex-1 flex items-center justify-between gap-3 rounded border border-default px-3 py-1.5">
                  <span class="text-sm font-medium text-highlighted">{{ ladvDisciplineLabel(row.line.discipline) }}</span>
                  <div class="flex items-center gap-2 shrink-0">
                    <UBadge
                      v-if="row.state.type === 'ok'"
                      color="success"
                      variant="subtle"
                      size="sm"
                      label="In LADV gemeldet"
                    />
                    <UBadge
                      v-else-if="row.state.type === 'add'"
                      color="primary"
                      variant="subtle"
                      size="sm"
                      label="In LADV anmelden"
                    />
                    <UBadge
                      v-else-if="row.state.type === 'update'"
                      color="warning"
                      variant="subtle"
                      size="sm"
                      :label="`AK ändern (war: ${ladvAgeClassLabel(row.state.previousAgeClass)})`"
                    />
                    <span class="text-xs text-muted">{{ ladvAgeClassLabel(row.line.ageClass) }}</span>
                  </div>
                </div>
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
              class="mt-2 rounded-md border border-default bg-elevated p-3 space-y-2"
            >
              <USelect
                v-model="addCode"
                :items="availableDisciplineItems"
                placeholder="Disziplin wählen"
                size="sm"
                class="w-full"
              />
              <USelect
                v-model="addAgeClass"
                :items="addAgeClassItems"
                placeholder="Altersklasse wählen"
                size="sm"
                class="w-full"
                :disabled="!addCode"
              />
              <div class="flex justify-end gap-2 pt-1">
                <UButton
                  label="Abbrechen"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="showAddRow = false"
                />
                <UButton
                  label="Hinzufügen"
                  icon="i-ph-plus"
                  color="primary"
                  variant="solid"
                  size="sm"
                  :disabled="!addCode || !addAgeClass"
                  @click="confirmAddRow"
                />
              </div>
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

            <p
              v-if="editorDisciplines.length === 0 && !showAddRow"
              class="flex items-center gap-1.5 text-xs text-error mt-1"
            >
              <UIcon
                name="i-ph-warning"
                class="size-3.5 shrink-0"
              />
              Mindestens eine Disziplin erforderlich.
            </p>
          </template>

          <p
            v-else
            class="text-sm text-muted italic"
          >
            Storniert — keine Disziplinen gemeldet.
          </p>

          <!-- In LADV abzumelden -->
          <div
            v-if="!isCanceled && removals.length > 0"
            class="mt-4 space-y-2"
          >
            <p class="text-xs font-medium text-muted uppercase tracking-widest">
              In LADV abzumelden
            </p>
            <div
              v-for="(entry, i) in removals"
              :key="`removal-${i}`"
              class="flex items-center justify-between gap-3 rounded border border-dashed border-default px-3 py-1.5 opacity-60"
            >
              <span class="text-sm font-medium line-through text-muted">{{ ladvDisciplineLabel(entry.discipline) }}</span>
              <div class="flex items-center gap-2 shrink-0">
                <UBadge
                  color="error"
                  variant="subtle"
                  size="sm"
                  label="In LADV abmelden"
                />
                <span class="text-xs text-muted line-through">{{ ladvAgeClassLabel(entry.ageClass) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Status (sekundär) -->
        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-widest mb-1">
            Anmeldestatus ändern
          </p>
          <p class="text-xs text-muted mb-2">
            Aktuell:
            <span class="font-medium text-highlighted">{{ selectedStatus === 'canceled' ? 'Storniert' : 'Angemeldet' }}</span>
            <span
              v-if="selectedStatus !== reg?.status"
              class="text-warning ml-1"
            >· ungespeichert</span>
          </p>
          <div class="flex gap-2">
            <UButton
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :color="selectedStatus === opt.value ? (opt.value === 'canceled' ? 'error' : 'primary') : 'neutral'"
              :variant="selectedStatus === opt.value ? 'outline' : 'outline'"
              size="sm"
              @click="selectedStatus = opt.value"
            />
          </div>
        </div>

        <!-- E-Mail-Info -->
        <p class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon
            name="i-ph-envelope"
            class="size-3.5 shrink-0"
          />
          {{ reg.firstName ?? 'Der Athlet' }} wird über diese Änderung per E-Mail informiert.
        </p>
      </div>
    </template>

    <!-- Geladen: Footer -->
    <template
      v-if="reg"
      #footer
    >
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="ghost"
          class="sm:w-auto justify-center"
          @click="emit('update:open', false)"
        />
        <UButton
          :label="ctaLabel"
          :color="isCanceled ? 'error' : 'primary'"
          :disabled="!isCanceled && editorDisciplines.length === 0"
          :loading="loading"
          class="sm:w-auto justify-center"
          @click="save"
        />
      </div>
    </template>
  </UModal>
</template>
