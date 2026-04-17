<script setup lang="ts">
interface Props {
  href: string
  text: string
}

defineProps<Props>()

const styles = {
  button: {
    display: 'inline-block',
    backgroundColor: '#09090b',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px 24px',
    borderRadius: '3px',
    margin: '8px 0 16px 0',
    fontSize: '14px',
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: '0.01em',
  },
}
</script>

<template>
  <EButton
    :style="styles.button"
    :href="href"
  >
    {{ text }}
  </EButton>
</template>
