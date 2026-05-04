<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EmailButton from './components/EmailButton.vue'

type EventChangedField = 'date' | 'startTime' | 'location'

interface EventChange {
  field: EventChangedField
  before: string | null
  after: string | null
  label: string
}

interface Props {
  firstName?: string
  adminName?: string
  eventName?: string
  eventLink?: string
  changes?: EventChange[]
}

const { adminName, changes = [] } = defineProps<Props>()

const EMPTY_PLACEHOLDER = '—'

function formatStartTime(value: string): string {
  // Akzeptiert HH:MM oder HH:MM:SS und kürzt auf HH:MM.
  const match = value.match(/^(\d{2}:\d{2})/)
  return match ? match[1]! : value
}

function displayValue(field: EventChangedField, value: string | null): string {
  if (value === null || value === '') return EMPTY_PLACEHOLDER
  if (field === 'date') {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  if (field === 'startTime') return formatStartTime(value)
  return value
}

const styles = {
  changesBox: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '3px',
    padding: '16px',
    margin: '16px 0',
  },
  title: {
    margin: '0 0 12px 0',
    color: '#09090b',
    fontSize: '16px',
    fontWeight: '700' as const,
    letterSpacing: '-0.01em',
  },
  row: {
    margin: '6px 0',
    color: '#18181b',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  label: {
    color: '#09090b',
    fontWeight: '600' as const,
  },
  before: {
    color: '#71717a',
    textDecoration: 'line-through',
  },
  arrow: {
    color: '#71717a',
    margin: '0 6px',
  },
  after: {
    color: '#18181b',
    fontWeight: '600' as const,
  },
  buttonWrap: {
    margin: '20px 0 0 0',
  },
}
</script>

<template>
  <EmailLayout
    header-title="Wettkampf geändert"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      <template v-if="adminName">
        {{ adminName }} hat Details bei <strong>{{ eventName }}</strong> geändert. Bitte prüfe, ob du noch dabei sein kannst.
      </template>
      <template v-else>
        Bei <strong>{{ eventName }}</strong> haben sich Details geändert. Bitte prüfe, ob du noch dabei sein kannst.
      </template>
    </EmailText>

    <ESection :style="styles.changesBox">
      <EHeading :style="styles.title">
        Änderungen
      </EHeading>
      <EText
        v-for="change in changes"
        :key="change.field"
        :style="styles.row"
      >
        <span :style="styles.label">{{ change.label }}: </span>
        <span :style="styles.before">{{ displayValue(change.field, change.before) }}</span>
        <span :style="styles.arrow">→</span>
        <span :style="styles.after">{{ displayValue(change.field, change.after) }}</span>
      </EText>

      <ESection
        v-if="eventLink"
        :style="styles.buttonWrap"
      >
        <EmailButton
          :href="eventLink"
          text="Zum Event"
        />
      </ESection>
    </ESection>
  </EmailLayout>
</template>
