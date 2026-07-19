<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect, { type BaseSelectOption } from '@/components/forms/BaseSelect.vue'
import type { SettingItem, SettingValue } from '@/modules/admin/types'
import { parseSettingOptions, settingLabel, settingPlaceholder } from './settingUtils'

const props = defineProps<{
  setting: SettingItem
  modelValue: SettingValue
  multiple?: boolean
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SettingValue]
}>()

const { locale, t } = useI18n()
const label = computed(() => settingLabel(props.setting, locale.value))
const help = computed(() => settingPlaceholder(props.setting, locale.value))
const options = computed<BaseSelectOption<string>[]>(() => parseSettingOptions(props.setting, locale.value).map((option) => ({
  label: option.label,
  value: option.value,
})))
const selectedValues = computed<string[]>(() => Array.isArray(props.modelValue) ? props.modelValue.map(String) : [])

</script>

<template>
  <div>
    <BaseSelect
      v-if="options.length"
      :id="`setting_${setting.id}`"
      :label="label"
      :model-value="multiple ? selectedValues : typeof modelValue === 'string' || typeof modelValue === 'number' ? String(modelValue) : null"
      :options="options"
      :placeholder="t('settings.selectValue')"
      :search-placeholder="t('settings.searchOptions')"
      :empty-text="t('settings.noOptions')"
      :help="help"
      :error="error"
      :disabled="disabled"
      :multiple="multiple"
      searchable
      clearable
      @update:model-value="emit('update:modelValue', $event as SettingValue)"
    />
    <div v-else>
      <label class="block" :for="`setting_${setting.id}`">
        <span class="form-label">{{ label }}</span>
        <input
          :id="`setting_${setting.id}`"
          class="form-control mt-1.5"
          :class="error ? 'border-danger focus:border-danger focus:ring-danger' : ''"
          :value="String(modelValue ?? '')"
          :placeholder="help"
          :disabled="disabled"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <p v-if="help && !error" class="mt-1.5 text-xs text-text-muted">{{ help }}</p>
      <span v-if="error" class="form-error">{{ error }}</span>
    </div>
  </div>
</template>
