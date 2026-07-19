<script setup lang="ts">
defineProps<{
  modelValue: boolean
  disabled?: boolean
  loading?: boolean
  onLabel: string
  offLabel: string
  ariaLabel?: string
  ariaLabelledby?: string
  dataTestid?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <button
    class="inline-flex items-center gap-2 rounded-full border p-1 text-xs font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-[var(--disabled-opacity)]"
    :class="modelValue ? 'border-primary/30 bg-primary-soft text-primary' : 'border-border bg-neutral-soft text-text-muted'"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel ?? (modelValue ? onLabel : offLabel)"
    :aria-labelledby="ariaLabelledby"
    :disabled="disabled || loading"
    :data-testid="dataTestid"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="flex size-6 items-center justify-center rounded-full bg-surface shadow-sm transition"
    >
      <span v-if="loading" class="size-3 animate-spin rounded-full border-2 border-border border-t-primary"></span>
    </span>
    <span class="px-2">{{ modelValue ? onLabel : offLabel }}</span>
  </button>
</template>
