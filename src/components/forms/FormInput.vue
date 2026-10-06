<script setup lang="ts">
defineProps<{
  id: string
  label: string
  modelValue: string | number | null | undefined
  type?: string
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  help?: string
  dataTestid?: string
  autocomplete?: string
  min?: string | number
  max?: string | number
  step?: string | number
  maxlength?: string | number
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  pattern?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="block" :for="id">
    <span class="form-label">{{ label }} <span v-if="required" class="text-danger">*</span></span>
    <input
      :id="id"
      class="form-control mt-1.5"
      :class="error ? 'border-danger focus:border-danger focus:ring-danger' : ''"
      :type="type ?? 'text'"
      :data-testid="dataTestid"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :min="min"
      :max="max"
      :step="step"
      :maxlength="maxlength"
      :inputmode="inputmode"
      :pattern="pattern"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? `${id}-error` : help ? `${id}-help` : undefined"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="help && !error" :id="`${id}-help`" class="mt-1.5 block text-xs text-text-muted">{{ help }}</span>
    <span v-if="error" :id="`${id}-error`" class="form-error">{{ error }}</span>
  </label>
</template>
