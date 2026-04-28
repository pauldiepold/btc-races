<script setup lang="ts">
import type { EventDetail } from '~~/shared/types/events'
import type { AdminMemberListItem } from '~~/server/api/admin/members.get'
import { isDeadlineExpired } from '~~/shared/utils/deadlines'
import { ladvDisciplineLabel, ladvAgeClassLabel } from '~~/shared/utils/ladv-labels'

const props = defineProps<{
  event: EventDetail
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'done': []
}>()

const toast = useToast()

// ─── Mitglieder-Liste (lazy, 1× pro Modal-Open) ───────────────────────────────

const members = ref<AdminMemberListItem[]>([])
const membersLoading = ref(false)
let membersLoadedOnce = false

async function loadMembers() {
  if (membersLoadedOnce) return
  membersLoading.value = true
  try {
    members.value = await $fetch<AdminMemberListItem[]>('/api/admin/members')
    membersLoadedOnce = true
  }
  catch {
    toast.add({ title: 'Mitgliederliste konnte nicht geladen werden', color: 'error' })
  }
  finally {
    membersLoading.value = false
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

const searchQuery = ref('')
const selectedMember = ref<AdminMemberListItem | null>(null)
const submitting = ref(false)

const status = ref<string>('')
const notes = ref('')
const pendingDisciplines = ref<{ discipline: string, ageClass: string }[]>([])
const setLadvStandImmediately = ref(false)

const showAddNew = ref(false)
const addNewCode = ref('')
const addNewAgeClass = ref('')

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
    selectedMember.value = null
    status.value = ''
    notes.value = ''
    pendingDisciplines.value = []
    setLadvStandImmediately.value = false
    showAddNew.value = false
    addNewCode.value = ''
    addNewAgeClass.value = ''
    loadMembers()
  }
})

// ─── Anreicherung mit bestehender Anmeldung ───────────────────────────────────

type MemberWithRegistration = AdminMemberListItem & {
  registrationStatus: 'registered' | 'canceled' | 'maybe' | 'yes' | 'no' | null
}

const registrationsByUserId = computed(() => {
  const map = new Map<number, MemberWithRegistration['registrationStatus']>()
  for (const r of props.event.registrations) {
    map.set(r.userId, r.status)
  }
  return map
})

// ─── Client-Filter ────────────────────────────────────────────────────────────

const filteredMembers = computed<MemberWithRegistration[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = members.value.map(m => ({
    ...m,
    registrationStatus: registrationsByUserId.value.get(m.id) ?? null,
  }))
  const matched = q.length === 0
    ? list
    : list.filter((m) => {
        const hay = `${m.firstName ?? ''} ${m.lastName ?? ''} ${m.email}`.toLowerCase()
        return hay.includes(q)
      })
  // Sortierung: ohne Anmeldung zuerst, dann canceled, dann aktive
  return matched.sort((a, b) => {
    const rank = (s: MemberWithRegistration['registrationStatus']) =>
      s === null ? 0 : s === 'canceled' ? 1 : 2
    const diff = rank(a.registrationStatus) - rank(b.registrationStatus)
    if (diff !== 0) return diff
    return 0
  })
})

const visibleMembers = computed(() => filteredMembers.value.slice(0, 50))

function memberFullName(m: AdminMemberListItem) {
  return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email
}

function statusInfo(s: MemberWithRegistration['registrationStatus']) {
  if (s === null) return null
  if (s === 'canceled') {
    return { label: 'Storniert', hint: 'Wird reaktiviert', color: 'warning' as const, blocked: false }
  }
  return { label: 'Bereits angemeldet', hint: 'Anmeldung im Detail bearbeiten', color: 'neutral' as const, blocked: true }
}

function selectMember(m: MemberWithRegistration) {
  if (statusInfo(m.registrationStatus)?.blocked) return
  selectedMember.value = m
  if (props.event.type === 'ladv') status.value = 'registered'
  else if (props.event.type === 'competition') status.value = 'registered'
  else status.value = 'yes'
}

function backToSearch() {
  selectedMember.value = null
}

const selectedReactivation = computed(() => {
  if (!selectedMember.value) return false
  return registrationsByUserId.value.get(selectedMember.value.id) === 'canceled'
})

// ─── LADV Disziplinen ─────────────────────────────────────────────────────────

const wettbewerbe = computed(() => props.event.ladvData?.wettbewerbe ?? [])

const uniqueDisciplines = computed(() => {
  const seen = new Set<string>()
  return wettbewerbe.value.filter((w) => {
    if (seen.has(w.disziplinNew)) return false
    seen.add(w.disziplinNew)
    return true
  })
})

const pendingCodes = computed(() => new Set(pendingDisciplines.value.map(d => d.discipline)))

const addNewDisciplineItems = computed(() =>
  uniqueDisciplines.value
    .filter(w => !pendingCodes.value.has(w.disziplinNew))
    .map(w => ({ label: ladvDisciplineLabel(w.disziplinNew), value: w.disziplinNew })),
)

const addNewAgeClassItems = computed(() =>
  wettbewerbe.value
    .filter(w => w.disziplinNew === addNewCode.value)
    .map(w => ({ label: ladvAgeClassLabel(w.klasseNew), value: w.klasseNew })),
)

watch(addNewCode, (code) => {
  if (!code) {
    addNewAgeClass.value = ''
    return
  }
  const items = addNewAgeClassItems.value
  addNewAgeClass.value = items[0]?.value ?? ''
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

// ─── Deadline-Warnung (competition) ───────────────────────────────────────────

const deadlineExpired = computed(() => isDeadlineExpired(toDate(props.event.registrationDeadline)))
const showDeadlineWarning = computed(() =>
  props.event.type === 'competition' && deadlineExpired.value,
)

// ─── Submit ───────────────────────────────────────────────────────────────────

const canSubmit = computed(() => {
  if (!selectedMember.value) return false
  if (props.event.type === 'ladv' && pendingDisciplines.value.length === 0) return false
  return true
})

async function submit() {
  if (!selectedMember.value) return
  if (props.event.type === 'ladv' && pendingDisciplines.value.length === 0) {
    toast.add({ title: 'Mindestens eine Disziplin erforderlich', color: 'error' })
    return
  }

  submitting.value = true
  const fullName = memberFullName(selectedMember.value)

  try {
    await $fetch(`/api/events/${props.event.id}/admin-register`, {
      method: 'POST',
      body: {
        userId: selectedMember.value.id,
        status: status.value || undefined,
        notes: notes.value || undefined,
        disciplines: props.event.type === 'ladv' ? pendingDisciplines.value : undefined,
        setLadvStandImmediately: props.event.type === 'ladv' ? setLadvStandImmediately.value : undefined,
      },
    })
    toast.add({
      title: selectedReactivation.value ? `${fullName} reaktiviert` : `${fullName} angemeldet`,
      color: 'success',
    })
    emit('done')
    emit('update:open', false)
  }
  catch (err: unknown) {
    const errStatus = (err as { status?: number }).status
    if (errStatus === 409) {
      toast.add({ title: `${fullName} ist bereits angemeldet`, color: 'warning' })
    }
    else if (errStatus === 422) {
      const msg = (err as { data?: { message?: string } }).data?.message
      toast.add({ title: msg ?? 'Anmeldung nicht möglich', color: 'error' })
    }
    else {
      toast.add({ title: 'Fehler bei der Anmeldung', color: 'error' })
    }
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    :ui="{ content: 'sm:max-w-lg' }"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="p-6 space-y-5">
        <!-- Header -->
        <div>
          <p class="text-base font-semibold text-highlighted">
            Person anmelden
          </p>
          <p class="text-sm text-muted mt-0.5">
            {{ event.name }}
          </p>
        </div>

        <!-- Step 1: Auswahl -->
        <template v-if="!selectedMember">
          <div class="space-y-3">
            <UInput
              v-model="searchQuery"
              icon="i-ph-magnifying-glass"
              placeholder="Mitglied suchen (Name oder E-Mail)…"
              size="md"
              :loading="membersLoading"
              autofocus
            />

            <div
              v-if="!membersLoading && members.length === 0"
              class="text-sm text-muted px-1 py-4 text-center"
            >
              Keine Mitglieder geladen.
            </div>

            <div
              v-else-if="filteredMembers.length === 0"
              class="text-sm text-muted px-1 py-4 text-center"
            >
              Keine Treffer.
            </div>

            <div
              v-else
              class="space-y-1 max-h-96 overflow-y-auto"
            >
              <button
                v-for="m in visibleMembers"
                :key="m.id"
                type="button"
                class="w-full flex items-center gap-3 rounded-[--ui-radius] px-3 py-2 text-left transition-colors"
                :class="statusInfo(m.registrationStatus)?.blocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-elevated'"
                :disabled="statusInfo(m.registrationStatus)?.blocked"
                @click="selectMember(m)"
              >
                <UAvatar
                  :src="m.hasAvatar ? useAvatarUrl(m.id) : undefined"
                  :alt="memberFullName(m)"
                  size="sm"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-highlighted truncate">
                    {{ memberFullName(m) }}
                  </p>
                  <p class="text-xs text-muted truncate">
                    {{ m.email }}
                  </p>
                </div>
                <div
                  v-if="statusInfo(m.registrationStatus)"
                  class="shrink-0 text-right"
                >
                  <UBadge
                    :label="statusInfo(m.registrationStatus)!.label"
                    :color="statusInfo(m.registrationStatus)!.color"
                    variant="subtle"
                    size="sm"
                  />
                  <p class="text-[10px] text-muted mt-0.5">
                    {{ statusInfo(m.registrationStatus)!.hint }}
                  </p>
                </div>
              </button>

              <p
                v-if="filteredMembers.length > visibleMembers.length"
                class="text-xs text-muted text-center pt-2"
              >
                {{ filteredMembers.length - visibleMembers.length }} weitere — bitte Suche verfeinern.
              </p>
            </div>
          </div>

          <div class="flex justify-end pt-1 border-t border-default">
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="ghost"
              @click="emit('update:open', false)"
            />
          </div>
        </template>

        <!-- Step 2: Form -->
        <template v-else>
          <!-- Selected Member -->
          <div class="flex items-center gap-3 p-3 rounded-[--ui-radius] bg-elevated">
            <UAvatar
              :src="selectedMember.hasAvatar ? useAvatarUrl(selectedMember.id) : undefined"
              :alt="memberFullName(selectedMember)"
              size="md"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-highlighted truncate">
                {{ memberFullName(selectedMember) }}
              </p>
              <p class="text-xs text-muted truncate">
                {{ selectedMember.email }}
              </p>
            </div>
            <UButton
              icon="i-ph-arrow-left"
              label="Andere"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="backToSearch"
            />
          </div>

          <UAlert
            v-if="selectedReactivation"
            icon="i-ph-arrow-clockwise"
            color="warning"
            variant="subtle"
            title="Stornierte Anmeldung"
            description="Die bestehende stornierte Anmeldung wird reaktiviert. Ein bereits gesetzter LADV-Stand bleibt erhalten — bei Bedarf nachträglich im Coach-Modal anpassen."
          />

          <!-- LADV: Disziplinen -->
          <div
            v-if="event.type === 'ladv'"
            class="space-y-2"
          >
            <p class="text-xs font-medium text-muted uppercase tracking-widest">
              Disziplinen
            </p>

            <div
              v-if="pendingDisciplines.length"
              class="space-y-1.5"
            >
              <div
                v-for="(d, i) in pendingDisciplines"
                :key="i"
                class="flex items-center gap-3 rounded-[--ui-radius] bg-default border border-default px-3 py-2"
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
              class="rounded-[--ui-radius] border border-default p-3 space-y-2"
            >
              <USelect
                v-model="addNewCode"
                :items="addNewDisciplineItems"
                placeholder="Disziplin wählen…"
                size="sm"
                class="w-full"
              />
              <USelect
                v-if="addNewCode"
                v-model="addNewAgeClass"
                :items="addNewAgeClassItems"
                placeholder="Altersklasse wählen…"
                size="sm"
                class="w-full"
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
              class="text-xs text-muted"
            >
              Mindestens eine Disziplin erforderlich.
            </p>
          </div>

          <!-- Competition: Status-Picker -->
          <div
            v-else-if="event.type === 'competition'"
            class="space-y-2"
          >
            <p class="text-xs font-medium text-muted uppercase tracking-widest">
              Status
            </p>
            <div class="flex gap-2">
              <UButton
                label="Anmelden"
                :color="status === 'registered' ? 'success' : 'neutral'"
                :variant="status === 'registered' ? 'solid' : 'outline'"
                size="sm"
                @click="status = 'registered'"
              />
              <UButton
                label="Vielleicht"
                :color="status === 'maybe' ? 'warning' : 'neutral'"
                :variant="status === 'maybe' ? 'solid' : 'outline'"
                size="sm"
                @click="status = 'maybe'"
              />
            </div>
            <UAlert
              v-if="showDeadlineWarning"
              icon="i-ph-warning"
              color="warning"
              variant="subtle"
              title="Meldefrist abgelaufen"
              description="Die offizielle Frist ist bereits vorbei. Trotzdem anmelden?"
            />
          </div>

          <!-- Training / Social: Status-Picker -->
          <div
            v-else
            class="space-y-2"
          >
            <p class="text-xs font-medium text-muted uppercase tracking-widest">
              Status
            </p>
            <div class="flex gap-2">
              <UButton
                label="Ja"
                :color="status === 'yes' ? 'success' : 'neutral'"
                :variant="status === 'yes' ? 'solid' : 'outline'"
                size="sm"
                @click="status = 'yes'"
              />
              <UButton
                label="Vielleicht"
                :color="status === 'maybe' ? 'warning' : 'neutral'"
                :variant="status === 'maybe' ? 'solid' : 'outline'"
                size="sm"
                @click="status = 'maybe'"
              />
              <UButton
                label="Nein"
                :color="status === 'no' ? 'error' : 'neutral'"
                :variant="status === 'no' ? 'solid' : 'outline'"
                size="sm"
                @click="status = 'no'"
              />
            </div>
          </div>

          <!-- Notiz -->
          <div class="space-y-2">
            <p class="text-xs font-medium text-muted uppercase tracking-widest">
              Notiz <span class="normal-case font-normal text-muted">(optional)</span>
            </p>
            <UTextarea
              v-model="notes"
              placeholder="Für alle Mitglieder sichtbar…"
              class="w-full"
              :rows="1"
              autoresize
            />
          </div>

          <!-- LADV: setLadvStandImmediately -->
          <div v-if="event.type === 'ladv'">
            <UCheckbox
              v-model="setLadvStandImmediately"
              label="Ich habe in LADV bereits gemeldet"
              description="Setzt den LADV-Stand direkt identisch zum Wunschstand."
            />
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-2 pt-1 border-t border-default">
            <UButton
              label="Abbrechen"
              color="neutral"
              variant="ghost"
              @click="emit('update:open', false)"
            />
            <UButton
              :label="selectedReactivation ? 'Reaktivieren' : 'Anmelden'"
              color="primary"
              :loading="submitting"
              :disabled="!canSubmit"
              @click="submit"
            />
          </div>
        </template>
      </div>
    </template>
  </UModal>
</template>
