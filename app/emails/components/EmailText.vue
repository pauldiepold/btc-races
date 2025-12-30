<script setup lang="ts">
const styles = {
  text: {
    color: '#333',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 15px 0',
  },
}
</script>

<template>
  <EText :style="styles.text">
    <slot />
  </EText>
</template>
