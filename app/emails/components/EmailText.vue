<script setup lang="ts">
const styles = {
  text: {
    color: '#18181b',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 12px 0',
  },
}
</script>

<template>
  <EText :style="styles.text">
    <slot />
  </EText>
</template>
