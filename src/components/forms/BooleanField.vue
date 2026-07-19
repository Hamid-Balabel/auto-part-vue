<script setup lang="ts">
import SwitchInput from './SwitchInput.vue'

defineProps<{
  id: string
  label: string
  modelValue: boolean
  onLabel: string
  offLabel: string
  error?: string
  help?: string
  required?: boolean
  disabled?: boolean
  loading?: boolean
  dataTestid?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <div>
    <span :id="`${id}-label`" class="form-label">
      {{ label }} <span v-if="required" class="text-danger">*</span>
    </span>
    <div
      class="mt-1.5 flex min-h-11 items-center rounded-[var(--radius-lg)] border bg-background/60 px-3 py-2 transition"
      :class="error ? 'border-danger' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15'"
    >
      <SwitchInput
        :model-value="modelValue"
        :on-label="onLabel"
        :off-label="offLabel"
        :aria-label="label"
        :disabled="disabled"
        :loading="loading"
        :data-testid="dataTestid"
        :aria-labelledby="`${id}-label`"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
    <span v-if="help && !error" :id="`${id}-help`" class="mt-1.5 block text-xs text-text-muted">{{ help }}</span>
    <span v-if="error" :id="`${id}-error`" class="form-error">{{ error }}</span>
  </div>
</template>
