<script setup lang="ts">
import type { TranslationMap } from '@/modules/data-entry/types'
import FormInput from './FormInput.vue'

defineProps<{
  id: string
  modelValue: TranslationMap
  labelAr: string
  labelEn: string
  type?: string
  requiredAr?: boolean
  errorAr?: string
  errorEn?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TranslationMap]
}>()
</script>

<template>
  <FormInput
    :id="`${id}_ar`"
    :model-value="modelValue.ar ?? ''"
    :label="labelAr"
    :type="type"
    :required="requiredAr"
    :error="errorAr"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', { ...modelValue, ar: $event })"
  />
  <FormInput
    :id="`${id}_en`"
    :model-value="modelValue.en ?? ''"
    :label="labelEn"
    :type="type"
    :error="errorEn"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', { ...modelValue, en: $event })"
  />
</template>
