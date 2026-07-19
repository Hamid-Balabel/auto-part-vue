<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SwitchInput from '@/components/forms/SwitchInput.vue'
import type { SettingItem, SettingValue } from '@/modules/admin/types'
import { coerceBoolean, settingLabel, settingPlaceholder } from './settingUtils'

const props = defineProps<{
  setting: SettingItem
  modelValue: SettingValue
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { locale, t } = useI18n()
const label = computed(() => settingLabel(props.setting, locale.value))
const help = computed(() => settingPlaceholder(props.setting, locale.value))
const checked = computed(() => coerceBoolean(props.modelValue))
</script>

<template>
  <div class="rounded-[var(--radius-lg)] border border-border bg-background/60 p-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="form-label">{{ label }}</p>
        <p v-if="help" class="mt-1 text-xs text-text-muted">{{ help }}</p>
      </div>
      <SwitchInput
        :model-value="checked"
        :disabled="disabled"
        :on-label="t('settings.enabled')"
        :off-label="t('settings.disabled')"
        :aria-label="label"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
    <span v-if="error" class="form-error">{{ error }}</span>
  </div>
</template>
