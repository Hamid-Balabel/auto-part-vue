<script setup lang="ts" generic="T extends string | number">
import BaseSelect, { type BaseSelectOption } from './BaseSelect.vue'

export type SearchableSelectOption<T extends string | number = string | number> = BaseSelectOption<T>

defineProps<{
  id: string
  label: string
  modelValue: T | null | undefined
  options: SearchableSelectOption<T>[]
  placeholder?: string
  searchPlaceholder?: string
  error?: string
  help?: string
  required?: boolean
  disabled?: boolean
  loading?: boolean
  emptyText?: string
  dataTestid?: string
  clearable?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T | null]
}>()

</script>

<template>
  <BaseSelect
    :id="id"
    :label="label"
    :model-value="modelValue"
    :options="options"
    :placeholder="placeholder"
    :search-placeholder="searchPlaceholder"
    :empty-text="emptyText"
    :error="error"
    :help="help"
    :required="required"
    :disabled="disabled"
    :loading="loading"
    :clearable="clearable"
    :data-testid="dataTestid"
    searchable
    @update:model-value="emit('update:modelValue', $event as T | null)"
  />
</template>
