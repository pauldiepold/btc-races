<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailText from './components/EmailText.vue'
import EmailButton from './components/EmailButton.vue'

interface Props {
  firstName?: string
  actorName?: string
  threadTitle?: string
  roomLabel?: string
  commentBodyHtml?: string
  threadLink?: string
}

defineProps<Props>()

const styles = {
  metaBox: {
    backgroundColor: '#fafafa',
    borderLeft: '4px solid #ffb700',
    padding: '14px 16px',
    margin: '16px 0',
    borderRadius: '3px',
  },
  metaLabel: {
    margin: '0 0 4px 0',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#09090b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  metaText: {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#18181b',
  },
  commentBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e4e4e7',
    padding: '14px 16px',
    margin: '16px 0',
    borderRadius: '3px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#18181b',
  },
}
</script>

<template>
  <EmailLayout
    header-title="Neuer Kommentar"
    show-unsubscribe
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      <strong>{{ actorName }}</strong> hat einen neuen Kommentar in <strong>{{ threadTitle }}</strong> geschrieben.
    </EmailText>

    <ESection :style="styles.metaBox">
      <EText :style="styles.metaLabel">
        Raum
      </EText>
      <EText :style="styles.metaText">
        {{ roomLabel }}
      </EText>
    </ESection>

    <ESection :style="styles.commentBox">
      <!-- eslint-disable-next-line vue/no-v-html -- sanitisierter renderMarkdown-Output -->
      <div v-html="commentBodyHtml" />
    </ESection>

    <EmailButton
      v-if="threadLink"
      :href="threadLink"
      text="Im Thread öffnen"
    />
  </EmailLayout>
</template>
