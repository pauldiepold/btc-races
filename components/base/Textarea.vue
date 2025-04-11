<script setup lang="ts">
interface Props {
  modelValue: string
  label: string
  required?: boolean
  error?: string
  rows?: number
}

defineProps<Props>()
defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="form-control w-full">
    <label class="label">
      <span class="label-text font-medium">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </span>
    </label>

    <textarea
      :value="modelValue"
      :rows="rows || 4"
      class="textarea textarea-bordered w-full"
      :class="{ 'textarea-error': error }"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <p v-if="error" class="text-red-600 mt-1.5 text-sm">
      {{ error }}
    </p>
  </div>
</template>
