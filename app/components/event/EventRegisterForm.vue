<script setup lang="ts">
import type { EventDetail } from '~~/shared/types/events'
import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import { getLadvAgeClass } from '~~/shared/utils/ladv-age-class'
import { ladvDisciplineLabel, ladvAgeClassLabel } from '~~/shared/utils/ladv-labels'
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_BUTTON_COLORS,
  REGISTRATION_STATUS_CHIP_CLASSES,
  getRegistrationActionLabels,
} from '~~/shared/utils/registration-ui'

const props = defineProps<{ event: EventDetail }>()
const emit = defineEmits<{ refresh: [] }>()

const { session } = useUserSession()
const toast = useToast()

const ownReg = computed(() =>
  props.event.registrations.find(r => r.userId === session.value?.user?.id),
)

const statusChipClass = computed(() =>
  ownReg.value?.status ? (REGISTRATION_STATUS_CHIP_CLASSES[ownReg.value.status] ?? '') : '',
)

const deadlineExpired = computed(() =>
  isDeadlineExpired(toDate(props.event.registrationDeadline)),
)

const deadlineLocked = computed(() =>
  deadlineExpired.value && (props.event.type === 'ladv' || props.event.type === 'competition'),
)

const hasLadvStartpass = computed(() => session.value?.user?.hasLadvStartpass ?? false)

// ─── LADV Disziplin-Helfer ────────────────────────────────────────────────────

const wettbewerbe = computed(() => props.event.ladvData?.wettbewerbe ?? [])

const uniqueDisciplines = computed(() => {
  const seen = new Set<string>()
  return wettbewerbe.value.filter((w) => {
    if (seen.has(w.disziplinNew)) return false
    seen.add(w.disziplinNew)
    return true
  })
})

function buildDisciplineItems(excludeCodes: Set<string>) {
  return uniqueDisciplines.value
    .filter(w => !excludeCodes.has(w.disziplinNew))
    .map(w => ({ label: ladvDisciplineLabel(w.disziplinNew), value: w.disziplinNew }))
}

function buildAgeClassItems(disciplineCode: string) {
  return wettbewerbe.value
    .filter(w => w.disziplinNew === disciplineCode)
    .map(w => ({ label: ladvAgeClassLabel(w.klasseNew), value: w.klasseNew }))
}

function autoAgeClass(disciplineCode: string): string {
  const classes = wettbewerbe.value
    .filter(w => w.disziplinNew === disciplineCode)
    .map(w => w.klasseNew)
  if (!classes.length) return ''
  const user = session.value?.user
  if (user?.birthYear && user?.gender) {
    const year = toDate(props.event.date)?.getFullYear() ?? new Date().getFullYear()
    const auto = getLadvAgeClass(user.birthYear, user.gender as 'm' | 'w', year)
    if (classes.includes(auto)) return auto
  }
  return classes[0] ?? ''
}

// ─── Neue Anmeldung ───────────────────────────────────────────────────────────

const submittingAs = ref<string | null>(null)
const newNotes = ref('')

const pendingDisciplines = ref<Array<{ discipline: string, ageClass: string }>>([])
const pendingCodes = computed(() => new Set(pendingDisciplines.value.map(d => d.discipline)))
const showDisciplineError = ref(false)

watch(pendingDisciplines, (val) => {
  if (val.length > 0) showDisciplineError.value = false
}, { deep: true })

const showAddNew = ref(false)
const addNewCode = ref('')
const addNewAgeClass = ref('')

const addNewDisciplineItems = computed(() => buildDisciplineItems(pendingCodes.value))
const addNewAgeClassItems = computed(() => buildAgeClassItems(addNewCode.value))

watch(addNewCode, (code) => {
  addNewAgeClass.value = code ? autoAgeClass(code) : ''
})

function confirmAddNew() {
  if (!addNewCode.value || !addNewAgeClass.value) return
  pendingDisciplines.value.push({ discipline: addNewCode.value, ageClass: addNewAgeClass.value })
  addNewCode.value = ''
  addNewAgeClass.value = ''
  showAddNew.value = false
}

function removePending(index: number) {
  pendingDisciplines.value.splice(index, 1)
}

async function register(initialStatus?: string) {
  if (props.event.type === 'ladv' && pendingDisciplines.value.length === 0) {
    showDisciplineError.value = true
    return
  }
  submittingAs.value = initialStatus ?? '_'
  try {
    await $fetch(`/api/events/${props.event.id}/registrations`, {
      method: 'POST',
      body: {
        notes: newNotes.value || undefined,
        disciplines: props.event.type === 'ladv' ? pendingDisciplines.value : undefined,
        status: initialStatus || undefined,
      },
    })
    toast.add({ title: 'Anmeldung erfolgreich', color: 'success' })
    newNotes.value = ''
    pendingDisciplines.value = []
    emit('refresh')
  }
  catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 403) {
      toast.add({ title: 'Kein LADV-Startpass', description: 'Wende dich an den Vorstand.', color: 'error' })
    }
    else if (status === 409) {
      toast.add({ title: 'Bereits angemeldet', color: 'warning' })
      emit('refresh')
    }
    else if (status === 422) {
      const msg = (err as { data?: { message?: string } }).data?.message
      toast.add({ title: msg ?? 'Anmeldung nicht möglich', color: 'error' })
    }
    else {
      toast.add({ title: 'Fehler bei der Anmeldung', color: 'error' })
    }
  }
  finally {
    submittingAs.value = null
  }
}

// ─── Eigene Anmeldung verwalten ───────────────────────────────────────────────

const changingStatusTo = ref<string | null>(null)

const allEventStatuses = computed(() => {
  const type = props.event.type
  if (type === 'ladv') return ['registered', 'canceled']
  if (type === 'competition') return ['registered', 'maybe', 'no']
  return ['yes', 'maybe', 'no']
})

const nextStatuses = computed(() => {
  if (!ownReg.value) return []
  const base = allEventStatuses.value.filter(s => s !== ownReg.value!.status)
  if (deadlineExpired.value && (props.event.type === 'ladv' || props.event.type === 'competition')) {
    return base.filter(s => s === 'canceled' || s === 'no')
  }
  return base
})

const actionLabels = computed(() => getRegistrationActionLabels(props.event.type))

async function changeStatus(status: string) {
  if (!ownReg.value) return
  changingStatusTo.value = status
  try {
    await $fetch(`/api/registrations/${ownReg.value.id}`, {
      method: 'PATCH',
      body: { status },
    })
    emit('refresh')
  }
  catch {
    toast.add({ title: 'Fehler beim Status-Update', color: 'error' })
  }
  finally {
    changingStatusTo.value = null
  }
}

// ─── LADV Disziplinen: bestehende Anmeldung ───────────────────────────────────

const localDisciplines = ref<{ discipline: string, ageClass: string }[]>([])

watch(ownReg, (reg) => {
  localDisciplines.value = reg ? [...reg.wishDisciplines] : []
}, { immediate: true })

const localDisciplineCodes = computed(() =>
  new Set<string>(localDisciplines.value.map(d => d.discipline)),
)

const hasChanges = computed(() => {
  if (!ownReg.value) return false
  const toKey = (arr: { discipline: string, ageClass: string }[]) =>
    [...arr].sort((a, b) => a.discipline.localeCompare(b.discipline)).map(d => `${d.discipline}:${d.ageClass}`).join('|')
  return toKey(localDisciplines.value) !== toKey(ownReg.value.wishDisciplines)
})

const showAddExisting = ref(false)
const addExistingCode = ref('')
const addExistingAgeClass = ref('')
const saveLoading = ref(false)

const addExistingDisciplineItems = computed(() => buildDisciplineItems(localDisciplineCodes.value))
const addExistingAgeClassItems = computed(() => buildAgeClassItems(addExistingCode.value))

watch(addExistingCode, (code) => {
  addExistingAgeClass.value = code ? autoAgeClass(code) : ''
})

function addExistingDiscipline() {
  if (!addExistingCode.value || !addExistingAgeClass.value) return
  localDisciplines.value.push({ discipline: addExistingCode.value, ageClass: addExistingAgeClass.value })
  addExistingCode.value = ''
  addExistingAgeClass.value = ''
  showAddExisting.value = false
}

function removeLocalDiscipline(disciplineCode: string) {
  localDisciplines.value = localDisciplines.value.filter(d => d.discipline !== disciplineCode)
}

function cancelDisciplineChanges() {
  localDisciplines.value = ownReg.value ? [...ownReg.value.wishDisciplines] : []
  showAddExisting.value = false
  addExistingCode.value = ''
  addExistingAgeClass.value = ''
}

async function saveWishDisciplines() {
  if (!ownReg.value) return
  saveLoading.value = true
  try {
    await $fetch(`/api/registrations/${ownReg.value.id}/wish-disciplines`, {
      method: 'PUT',
      body: { disciplines: localDisciplines.value },
    })
    toast.add({ title: 'Disziplinen gespeichert', color: 'success' })
    emit('refresh')
  }
  catch (err: unknown) {
    const status = (err as { status?: number }).status
    if (status === 422 || status === 400) {
      toast.add({ title: 'Mindestens eine Disziplin muss verbleiben', color: 'error' })
    }
    else {
      toast.add({ title: 'Fehler beim Speichern', color: 'error' })
    }
  }
  finally {
    saveLoading.value = false
  }
}

// ─── Notiz bearbeiten ─────────────────────────────────────────────────────────

const editingNotes = ref(false)
const editedNotes = ref('')
const notesLoading = ref(false)

function startEditNotes() {
  editedNotes.value = ownReg.value?.notes ?? ''
  editingNotes.value = true
}

async function saveNotes() {
  if (!ownReg.value) return
  notesLoading.value = true
  try {
    await $fetch(`/api/registrations/${ownReg.value.id}`, {
      method: 'PATCH',
      body: { notes: editedNotes.value || null },
    })
    editingNotes.value = false
    emit('refresh')
  }
  catch {
    toast.add({ title: 'Fehler beim Speichern', color: 'error' })
  }
  finally {
    notesLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="font-display font-semibold text-highlighted">
      Deine Anmeldung
    </h2>

    <!-- Event abgesagt -->
    <UAlert
      v-if="event.cancelledAt"
      icon="i-ph-x-circle"
      color="neutral"
      variant="subtle"
      title="Anmeldung nicht möglich"
      description="Dieses Event wurde abgesagt."
    />

    <!-- Eigene Anmeldung vorhanden -->
    <div
      v-else-if="ownReg"
      class="space-y-5"
    >
      <!-- Status + Aktions-Buttons -->
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <!-- Status-Chip -->
          <span :class="['inline-flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-[--ui-radius]', statusChipClass]">
            <span
              class="relative flex size-2 shrink-0"
              aria-hidden="true"
            >
              <span
                v-if="ownReg.status === 'registered' || ownReg.status === 'yes'"
                class="absolute inline-flex size-full rounded-full opacity-50 animate-ping bg-current"
              />
              <span class="relative inline-flex size-2 rounded-full bg-current" />
            </span>
            <span class="text-[11px] font-bold uppercase tracking-[0.1em]">
              {{ REGISTRATION_STATUS_LABELS[ownReg.status] }}
            </span>
          </span>

          <!-- Aktions-Buttons -->
          <div
            v-if="nextStatuses.length > 0"
            class="flex flex-wrap gap-2 justify-end"
          >
            <UButton
              v-for="s in nextStatuses"
              :key="s"
              :color="REGISTRATION_STATUS_BUTTON_COLORS[s]"
              variant="outline"
              size="sm"
              :loading="changingStatusTo === s"
              :disabled="changingStatusTo !== null && changingStatusTo !== s"
              @click="changeStatus(s)"
            >
              {{ actionLabels[s] }}
            </UButton>
          </div>
        </div>

        <p
          v-if="deadlineExpired && (event.type === 'ladv' || event.type === 'competition')"
          class="text-xs text-muted"
        >
          Meldefrist abgelaufen — nur Abmelden möglich.
        </p>
        <p
          v-else-if="event.type === 'ladv' && ownReg.status !== 'canceled'"
          class="text-xs text-muted"
        >
          Die Meldung bei LADV erfolgt durch die Coaches.
        </p>
        <p
          v-else-if="event.type === 'competition'"
          class="text-xs text-muted"
        >
          Du meldest dich eigenständig beim Veranstalter an — hier trackst du nur deine Teilnahme.
        </p>
      </div>

      <!-- LADV-Disziplinen -->
      <div
        v-if="event.type === 'ladv' && ownReg.status !== 'canceled'"
        class="space-y-3"
      >
        <p class="text-xs font-medium text-muted uppercase tracking-widest">
          Disziplinen
        </p>

        <div class="space-y-2">
          <div
            v-for="disc in localDisciplines"
            :key="disc.discipline"
            class="flex items-center gap-3 rounded-[--ui-radius] bg-default border border-default px-3 py-2.5"
          >
            <div class="flex-1 min-w-0 space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium text-highlighted">
                  {{ ladvDisciplineLabel(disc.discipline) }}
                </span>
                <LadvBadge
                  :age-class="disc.ageClass"
                  variant="subtle"
                />
                <UBadge
                  v-if="ownReg.ladvDisciplines?.some(d => d.discipline === disc.discipline)"
                  color="success"
                  variant="subtle"
                  size="sm"
                  icon="i-ph-check-circle"
                >
                  Bei LADV angemeldet
                </UBadge>
              </div>
            </div>

            <UButton
              v-if="!deadlineExpired"
              icon="i-ph-x"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="removeLocalDiscipline(disc.discipline)"
            />
          </div>
        </div>

        <!-- Disziplin hinzufügen (nur vor Fristablauf) -->
        <div v-if="!deadlineExpired">
          <div
            v-if="showAddExisting"
            class="rounded-[--ui-radius] border border-default p-3 space-y-3"
          >
            <USelect
              v-model="addExistingCode"
              :items="addExistingDisciplineItems"
              placeholder="Disziplin wählen…"
              size="sm"
              class="w-full sm:min-w-52"
            />
            <USelect
              v-if="addExistingCode"
              v-model="addExistingAgeClass"
              :items="addExistingAgeClassItems"
              placeholder="Altersklasse wählen…"
              size="sm"
              class="w-full sm:min-w-52"
            />
            <div class="flex gap-2">
              <UButton
                label="Hinzufügen"
                size="sm"
                variant="outline"
                :disabled="!addExistingCode || !addExistingAgeClass"
                @click="addExistingDiscipline"
              />
              <UButton
                label="Abbrechen"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="showAddExisting = false; addExistingCode = ''; addExistingAgeClass = ''"
              />
            </div>
          </div>

          <UButton
            v-else-if="addExistingDisciplineItems.length > 0"
            label="Disziplin hinzufügen"
            icon="i-ph-plus"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="showAddExisting = true"
          />
        </div>

        <!-- Speichern / Abbrechen -->
        <template v-if="hasChanges">
          <p
            v-if="localDisciplines.length === 0"
            class="text-xs text-error"
          >
            Mindestens eine Disziplin erforderlich.
          </p>
          <p
            v-else
            class="text-xs text-muted"
          >
            Coaches werden informiert, falls du bereits bei LADV gemeldet wurdest.
          </p>
          <div class="flex gap-2">
            <UButton
              label="Speichern"
              size="sm"
              color="primary"
              variant="outline"
              :loading="saveLoading"
              :disabled="localDisciplines.length === 0"
              @click="saveWishDisciplines"
            />
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="ghost"
              size="sm"
              :disabled="saveLoading"
              @click="cancelDisciplineChanges"
            />
          </div>
        </template>
      </div>

      <!-- Notiz -->
      <div class="space-y-2">
        <p class="text-xs font-medium text-muted uppercase tracking-widest">
          Öffentliche Notiz
        </p>

        <div
          v-if="editingNotes"
          class="space-y-2"
        >
          <UTextarea
            v-model="editedNotes"
            placeholder="Für alle Mitglieder sichtbar…"
            class="w-full"
            :rows="1"
            autoresize
          />
          <div class="flex gap-2">
            <UButton
              label="Speichern"
              color="neutral"
              variant="outline"
              size="sm"
              :loading="notesLoading"
              @click="saveNotes"
            />
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="editingNotes = false"
            />
          </div>
        </div>

        <div
          v-else
          class="flex items-start gap-2"
        >
          <p
            class="text-sm flex-1"
            :class="ownReg.notes ? 'text-default italic' : 'text-muted'"
          >
            {{ ownReg.notes ?? 'Keine Notiz' }}
          </p>
          <UButton
            icon="i-ph-pencil-simple"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="startEditNotes"
          />
        </div>
      </div>
    </div>

    <!-- Kein LADV-Startpass -->
    <UAlert
      v-else-if="event.type === 'ladv' && !hasLadvStartpass"
      icon="i-ph-warning-circle"
      color="error"
      variant="subtle"
      title="Kein gültiger LADV-Startpass"
      description="Du hast keinen gültigen LADV-Startpass. Wende dich an den Vorstand."
    />

    <!-- Meldefrist abgelaufen -->
    <UAlert
      v-else-if="deadlineLocked"
      icon="i-ph-clock"
      color="neutral"
      variant="subtle"
      title="Meldefrist abgelaufen"
      description="Eine Anmeldung ist nicht mehr möglich."
    />

    <!-- Anmeldeformular -->
    <div
      v-else
      class="space-y-5"
    >
      <!-- LADV: Disziplin-Auswahl -->
      <div
        v-if="event.type === 'ladv'"
        class="space-y-3"
      >
        <p class="text-xs font-medium text-muted uppercase tracking-widest">
          Disziplinen <span class="normal-case text-error">*</span>
        </p>

        <div
          v-if="pendingDisciplines.length > 0"
          class="space-y-2"
        >
          <div
            v-for="(d, i) in pendingDisciplines"
            :key="i"
            class="flex items-center gap-3 rounded-[--ui-radius] bg-default border border-default px-3 py-2.5"
          >
            <div class="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-highlighted">{{ ladvDisciplineLabel(d.discipline) }}</span>
              <LadvBadge
                :age-class="d.ageClass"
                variant="subtle"
              />
            </div>
            <UButton
              icon="i-ph-x"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Disziplin entfernen"
              @click="removePending(i)"
            />
          </div>
        </div>

        <div
          v-if="showAddNew"
          class="rounded-[--ui-radius] border border-default p-3 space-y-3"
        >
          <USelect
            v-model="addNewCode"
            :items="addNewDisciplineItems"
            placeholder="Disziplin wählen…"
            size="sm"
            class="w-full sm:min-w-52"
          />
          <USelect
            v-if="addNewCode"
            v-model="addNewAgeClass"
            :items="addNewAgeClassItems"
            placeholder="Altersklasse wählen…"
            size="sm"
            class="w-full sm:min-w-52"
          />
          <div class="flex gap-2">
            <UButton
              label="Hinzufügen"
              size="sm"
              variant="outline"
              :disabled="!addNewCode || !addNewAgeClass"
              @click="confirmAddNew"
            />
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="showAddNew = false; addNewCode = ''; addNewAgeClass = ''"
            />
          </div>
        </div>

        <UButton
          v-else-if="addNewDisciplineItems.length > 0"
          label="Disziplin hinzufügen"
          icon="i-ph-plus"
          color="neutral"
          variant="outline"
          size="sm"
          @click="showAddNew = true"
        />

        <p
          v-if="pendingDisciplines.length === 0"
          class="text-xs"
          :class="showDisciplineError ? 'text-error font-medium' : 'text-muted'"
        >
          Mindestens eine Disziplin erforderlich.
        </p>
      </div>

      <!-- Notiz -->
      <div class="space-y-2">
        <p class="text-xs font-medium text-muted uppercase tracking-widest">
          Öffentliche Notiz <span class="normal-case font-normal text-muted">(optional)</span>
        </p>
        <UTextarea
          v-model="newNotes"
          placeholder="Für alle Mitglieder sichtbar…"
          class="w-full"
          :rows="1"
          autoresize
        />
      </div>

      <!-- Anmelden-Aktionen -->
      <div class="space-y-2">
        <div class="flex flex-wrap gap-2">
          <!-- LADV: nur Anmelden -->
          <UButton
            v-if="event.type === 'ladv'"
            label="Anmelden"
            color="success"
            variant="outline"
            :loading="submittingAs === 'registered'"
            :disabled="submittingAs !== null && submittingAs !== 'registered'"
            @click="register('registered')"
          />

          <!-- Competition: Anmelden + Vielleicht + Nein -->
          <template v-else-if="event.type === 'competition'">
            <UButton
              label="Anmelden"
              color="success"
              variant="outline"
              :loading="submittingAs === 'registered'"
              :disabled="submittingAs !== null && submittingAs !== 'registered'"
              @click="register('registered')"
            />
            <UButton
              label="Vielleicht"
              color="warning"
              variant="outline"
              :loading="submittingAs === 'maybe'"
              :disabled="submittingAs !== null && submittingAs !== 'maybe'"
              @click="register('maybe')"
            />
            <UButton
              label="Nein"
              color="error"
              variant="outline"
              :loading="submittingAs === 'no'"
              :disabled="submittingAs !== null && submittingAs !== 'no'"
              @click="register('no')"
            />
          </template>

          <!-- Training / Social: Ja + Vielleicht + Nein -->
          <template v-else>
            <UButton
              label="Ja"
              color="success"
              variant="outline"
              :loading="submittingAs === 'yes'"
              :disabled="submittingAs !== null && submittingAs !== 'yes'"
              @click="register('yes')"
            />
            <UButton
              label="Vielleicht"
              color="warning"
              variant="outline"
              :loading="submittingAs === 'maybe'"
              :disabled="submittingAs !== null && submittingAs !== 'maybe'"
              @click="register('maybe')"
            />
            <UButton
              label="Nein"
              color="error"
              variant="outline"
              :loading="submittingAs === 'no'"
              :disabled="submittingAs !== null && submittingAs !== 'no'"
              @click="register('no')"
            />
          </template>
        </div>
        <p
          v-if="event.type === 'ladv'"
          class="text-xs text-muted"
        >
          Die Meldung bei LADV erfolgt durch die Coaches.
        </p>
        <p
          v-else-if="event.type === 'competition'"
          class="text-xs text-muted"
        >
          Du meldest dich eigenständig beim Veranstalter an — hier trackst du nur deine Teilnahme.
        </p>
      </div>
    </div>
  </div>
</template>
