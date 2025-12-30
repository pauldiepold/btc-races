<script setup lang="ts">
interface Props {
  href: string
  text: string
}

const { href, text } = defineProps<Props>()

const styles = {
  button: {
    display: 'inline-block',
    backgroundColor: '#ffb700',
    color: 'white',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    margin: '5px 0 20px 0',
    fontWeight: 'bold',
    textAlign: 'center' as const,
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
