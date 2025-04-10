<script setup lang="ts">
defineProps<{
  modelValue: string | number | null
  label: string
  type?: string
  required?: boolean
  placeholder?: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()
</script>

<template>
  <div>
    <label :for="label" class="block text-sm font-medium text-gray-700">{{ label }}</label>
    <input
      :id="label"
      :type="type || 'text'"
      :value="modelValue"
      :required="required"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>
