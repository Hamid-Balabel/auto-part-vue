<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SettingItem, SettingValue, TranslationMap } from '@/modules/admin/types'
import { isMultiLang, settingLabel, settingPlaceholder } from './settingUtils'

const props = defineProps<{
  setting: SettingItem
  modelValue: SettingValue
  inputType?: string
  textarea?: boolean
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SettingValue]
}>()

const { locale } = useI18n()
const label = computed(() => settingLabel(props.setting, locale.value))
const placeholder = computed(() => settingPlaceholder(props.setting, locale.value))
const multiLang = computed(() => isMultiLang(props.setting))
const translations = computed<TranslationMap>(() => {
  return props.modelValue && typeof props.modelValue === 'object' && !(props.modelValue instanceof File) && !Array.isArray(props.modelValue)
    ? props.modelValue as TranslationMap
    : { ar: '', en: '' }
})
const languages = ['ar', 'en'] as const

function updateValue(value: string) {
  emit('update:modelValue', value)
}

function updateTranslation(lang: 'ar' | 'en', value: string) {
  emit('update:modelValue', { ...translations.value, [lang]: value })
}
</script>

<template>
  <div>
    <p class="form-label">{{ label }}</p>
    <div v-if="multiLang" class="mt-1.5 grid gap-3 sm:grid-cols-2">
      <label v-for="lang in languages" :key="lang" class="block" :for="`setting_${setting.id}_${lang}`">
        <span class="text-xs font-semibold text-text-muted">{{ lang.toUpperCase() }}</span>
        <textarea
          v-if="textarea"
          :id="`setting_${setting.id}_${lang}`"
          class="form-control mt-1.5 min-h-28 py-3"
          :class="error ? 'border-danger focus:border-danger focus:ring-danger' : ''"
          :value="translations[lang] ?? ''"
          :placeholder="placeholder"
          :disabled="disabled"
          @input="updateTranslation(lang, ($event.target as HTMLTextAreaElement).value)"
        />
        <input
          v-else
          :id="`setting_${setting.id}_${lang}`"
          class="form-control mt-1.5"
          :class="error ? 'border-danger focus:border-danger focus:ring-danger' : ''"
          :type="inputType ?? 'text'"
          :value="translations[lang] ?? ''"
          :placeholder="placeholder"
          :disabled="disabled"
          @input="updateTranslation(lang, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
    <textarea
      v-else-if="textarea"
      :id="`setting_${setting.id}`"
      class="form-control mt-1.5 min-h-32 py-3"
      :class="error ? 'border-danger focus:border-danger focus:ring-danger' : ''"
      :value="String(modelValue ?? '')"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="updateValue(($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else
      :id="`setting_${setting.id}`"
      class="form-control mt-1.5"
      :class="error ? 'border-danger focus:border-danger focus:ring-danger' : ''"
      :type="inputType ?? 'text'"
      :value="String(modelValue ?? '')"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="inputType === 'password' ? 'new-password' : undefined"
      @input="updateValue(($event.target as HTMLInputElement).value)"
    />
    <span v-if="placeholder && !error" class="mt-1.5 block text-xs text-text-muted">{{ placeholder }}</span>
    <span v-if="error" class="form-error">{{ error }}</span>
  </div>
</template>
