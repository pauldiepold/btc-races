<script setup lang="ts">
interface Props {
  modelValue: string
  label: string
  type?: 'text' | 'email' | 'password' | 'date' | 'url'
  required?: boolean
  error?: string
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

    <input
      :value="modelValue"
      :type="type || 'text'"
      class="input input-bordered w-full"
      :class="{ 'input-error': error }"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    >

    <p v-if="error" class="mt-1.5 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
