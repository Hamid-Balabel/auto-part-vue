<script setup lang="ts">
import BaseSelect, { type BaseSelectOption, type SelectValue } from './BaseSelect.vue'

defineProps<{
  id: string
  label: string
  modelValue: SelectValue | null | undefined
  options: BaseSelectOption[]
  error?: string
  required?: boolean
  disabled?: boolean
  help?: string
  placeholder?: string
  clearable?: boolean
  loading?: boolean
  dataTestid?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SelectValue | null]
}>()
</script>

<template>
  <BaseSelect
    :id="id"
    :label="label"
    :model-value="modelValue"
    :options="options"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :error="error"
    :required="required"
    :help="help"
    :data-testid="dataTestid"
    @update:model-value="emit('update:modelValue', $event as SelectValue | null)"
  />
</template>
