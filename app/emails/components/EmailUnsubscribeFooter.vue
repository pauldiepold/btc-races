<script setup lang="ts">
interface Props {
  baseUrl?: string
}

const { baseUrl = 'https://events.berlin-track-club.de' } = defineProps<Props>()

const preferencesUrl = `${baseUrl}/profil/benachrichtigungen`

const styles = {
  container: {
    textAlign: 'center' as const,
    padding: '16px 28px',
    backgroundColor: '#fafafa',
    borderTop: '1px solid #e4e4e7',
  },
  text: {
    margin: '0',
    fontSize: '12px',
    color: '#71717a',
    lineHeight: '1.5',
  },
  link: {
    color: '#18181b',
    textDecoration: 'underline',
    fontWeight: '600' as const,
  },
}
</script>

<template>
  <ESection :style="styles.container">
    <EText :style="styles.text">
      Deine Benachrichtigungen kannst du in deinen
      <ELink
        :href="preferencesUrl"
        :style="styles.link"
      >
        Einstellungen</
      ELink> abbestellen.
      </elink>
    </EText>
  </ESection>
</template>
