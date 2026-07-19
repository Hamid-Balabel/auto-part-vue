<script setup lang="ts">
import { computed } from 'vue'
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
  'update:modelValue': [value: string]
}>()

const { locale } = useI18n()
const label = computed(() => settingLabel(props.setting, locale.value))
const help = computed(() => settingPlaceholder(props.setting, locale.value))
const value = computed(() => /^#[0-9a-f]{6}$/i.test(String(props.modelValue ?? '')) ? String(props.modelValue) : '#000000')
</script>

<template>
  <div>
    <label class="block" :for="`setting_${setting.id}`">
      <span class="form-label">{{ label }}</span>
      <div class="mt-1.5 flex items-center gap-3">
        <input
          :id="`setting_${setting.id}`"
          class="h-11 w-16 rounded-[var(--radius-md)] border border-border bg-surface p-1"
          type="color"
          :value="value"
          :disabled="disabled"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <input
          class="form-control"
          :class="error ? 'border-danger focus:border-danger focus:ring-danger' : ''"
          :value="String(modelValue ?? '')"
          :placeholder="help"
          :disabled="disabled"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </label>
    <p v-if="help && !error" class="mt-1.5 text-xs text-text-muted">{{ help }}</p>
    <span v-if="error" class="form-error">{{ error }}</span>
  </div>
</template>
