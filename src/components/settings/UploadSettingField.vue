<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SettingItem, SettingValue } from '@/modules/admin/types'
import { isFileValue, settingLabel, settingPlaceholder } from './settingUtils'

const props = defineProps<{
  setting: SettingItem
  modelValue: SettingValue
  image?: boolean
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: File | string | null]
}>()

const { locale, t } = useI18n()
const objectUrl = ref('')
const label = computed(() => settingLabel(props.setting, locale.value))
const help = computed(() => settingPlaceholder(props.setting, locale.value))
const accept = computed(() => props.image ? 'image/*' : undefined)
const fileName = computed(() => isFileValue(props.modelValue) ? props.modelValue.name : '')
const currentUrl = computed(() => typeof props.modelValue === 'string' ? props.modelValue : '')
const previewUrl = computed(() => objectUrl.value || currentUrl.value)

watch(() => props.modelValue, (value) => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  objectUrl.value = value instanceof File ? URL.createObjectURL(value) : ''
}, { immediate: true })

function updateFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('update:modelValue', file)
}
</script>

<template>
  <div>
    <label class="block" :for="`setting_${setting.id}`">
      <span class="form-label">{{ label }}</span>
      <div class="mt-1.5 rounded-[var(--radius-xl)] border border-dashed border-border bg-background/60 p-4 transition hover:border-primary/50">
        <div v-if="image && previewUrl" class="mb-4 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <img :src="previewUrl" :alt="label" class="h-40 w-full object-contain" />
        </div>
        <div v-else-if="previewUrl" class="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-3 text-sm text-primary">
          <a :href="previewUrl" target="_blank" rel="noreferrer">{{ t('settings.currentFile') }}</a>
        </div>
        <input
          :id="`setting_${setting.id}`"
          class="block w-full text-sm text-text-muted file:me-4 file:rounded-[var(--radius-sm)] file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-contrast disabled:opacity-[var(--disabled-opacity)]"
          type="file"
          :accept="accept"
          :disabled="disabled"
          @change="updateFile"
        />
        <p v-if="fileName" class="mt-2 text-xs font-semibold text-text">{{ t('settings.selectedFile') }}: {{ fileName }}</p>
        <p v-if="help" class="mt-2 text-xs text-text-muted">{{ help }}</p>
      </div>
    </label>
    <span v-if="error" class="form-error">{{ error }}</span>
  </div>
</template>
