<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SearchableSelectInput, { type SearchableSelectOption } from '@/components/forms/SearchableSelectInput.vue'
import type { Party } from '../types'

const props = defineProps<{
  id: string
  modelValue?: number | null
  parties: Party[]
  label?: string
  placeholder?: string
  loading?: boolean
  error?: string
  disabled?: boolean
  required?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()
const { t } = useI18n()
const options = computed<SearchableSelectOption<number>[]>(() => props.parties.map((party) => ({
  label: party.name,
  value: party.id,
  description: party.phone ?? party.email ?? undefined,
  searchText: [party.name, party.phone, party.email].filter(Boolean).join(' '),
})))
</script>

<template>
  <SearchableSelectInput
    :id="id"
    :model-value="modelValue"
    :label="label ?? t('parties.party')"
    :options="options"
    :placeholder="placeholder ?? t('parties.selectParty')"
    :search-placeholder="t('crud.searchPlaceholder')"
    :empty-text="t('states.emptyTitle')"
    :loading="loading"
    :disabled="disabled"
    :required="required"
    :error="error"
    clearable
    @update:model-value="emit('update:modelValue', $event as number | null)"
  />
</template>
