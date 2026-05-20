<script setup lang="ts">
interface DisciplineLine {
  label: string
  /** Nur relevant bei `showStatus`: LADV-Meldung noch ausstehend. */
  ladvPending?: boolean
}

interface Props {
  heading: string
  items?: DisciplineLine[]
  /** Pro Zeile den LADV-Meldestatus anzeigen. */
  showStatus?: boolean
}

const { items = [], showStatus = false } = defineProps<Props>()

const styles = {
  box: {
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '3px',
    padding: '12px 16px',
    margin: '8px 0 16px 0',
  },
  heading: {
    margin: '0 0 6px 0',
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#09090b',
  },
  list: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#3f3f46',
    lineHeight: '1.6',
  },
  item: {
    margin: '2px 0',
  },
  statusOk: {
    color: '#71717a',
  },
  statusPending: {
    color: '#a16207',
  },
}
</script>

<template>
  <ESection
    v-if="items.length > 0"
    :style="styles.box"
  >
    <EText :style="styles.heading">
      {{ heading }}
    </EText>
    <ul :style="styles.list">
      <li
        v-for="(item, idx) in items"
        :key="idx"
        :style="styles.item"
      >
        {{ item.label }}<template v-if="showStatus">
          — <span :style="item.ladvPending ? styles.statusPending : styles.statusOk">{{ item.ladvPending ? 'LADV-Meldung noch ausstehend' : 'bei LADV gemeldet' }}</span>
        </template>
      </li>
    </ul>
  </ESection>
</template>
