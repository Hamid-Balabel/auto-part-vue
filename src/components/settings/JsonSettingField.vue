<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SettingItem, SettingValue } from '@/modules/admin/types'
import { settingLabel, settingPlaceholder } from './settingUtils'

const props = defineProps<{
  setting: SettingItem
  modelValue: SettingValue
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SettingValue]
}>()

const { locale, t } = useI18n()
const localValue = ref('')
const localError = ref('')
const label = computed(() => settingLabel(props.setting, locale.value))
const help = computed(() => settingPlaceholder(props.setting, locale.value))

watch(() => props.modelValue, (value) => {
  localValue.value = typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)
}, { immediate: true })

function update(value: string) {
  localValue.value = value
  try {
    localError.value = ''
    emit('update:modelValue', value.trim() ? JSON.parse(value) : null)
  } catch {
    localError.value = t('settings.invalidJson')
  }
}
</script>

<template>
  <div>
    <label class="block" :for="`setting_${setting.id}`">
      <span class="form-label">{{ label }}</span>
      <textarea
        :id="`setting_${setting.id}`"
        class="form-control mt-1.5 min-h-40 font-mono text-xs leading-5"
        :class="error || localError ? 'border-danger focus:border-danger focus:ring-danger' : ''"
        :value="localValue"
        :placeholder="help"
        :disabled="disabled"
        spellcheck="false"
        @input="update(($event.target as HTMLTextAreaElement).value)"
      />
    </label>
    <p v-if="help && !error && !localError" class="mt-1.5 text-xs text-text-muted">{{ help }}</p>
    <span v-if="localError || error" class="form-error">{{ localError || error }}</span>
  </div>
</template>
