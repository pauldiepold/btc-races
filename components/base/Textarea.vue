<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  required?: boolean
  rows?: number
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div>
    <label :for="label" class="block text-sm font-medium text-gray-700">{{ label }}</label>
    <textarea
      :id="label"
      :value="modelValue"
      :required="required"
      :rows="rows || 4"
      class=""
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>
