<script setup>
defineProps({
    color: {
        type: String,
        default: 'primary',
    },
    variant: {
        type: String,
        default: 'filled',
        validator: (value) => ['filled', 'text'].includes(value),
    },
})
</script>

<template>
    <button
        :class="[
            variant === 'filled'
                ? `bg-${color} cursor-pointer rounded-lg px-4 py-2 text-black hover:bg-${color} transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50`
                : `text-${color} cursor-pointer transition-colors duration-300 hover:underline`,
        ]"
    >
        <slot />
    </button>
</template>
