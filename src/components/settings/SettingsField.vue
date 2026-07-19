<script setup lang="ts">
import { computed } from 'vue'
import type { SettingItem, SettingValue } from '@/modules/admin/types'
import ColorSettingField from './ColorSettingField.vue'
import JsonSettingField from './JsonSettingField.vue'
import SelectSettingField from './SelectSettingField.vue'
import SwitchSettingField from './SwitchSettingField.vue'
import TextSettingField from './TextSettingField.vue'
import UploadSettingField from './UploadSettingField.vue'
import { normalizeSettingType } from './settingUtils'

const props = defineProps<{
  setting: SettingItem
  modelValue: SettingValue
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SettingValue]
  reset: []
}>()

const type = computed(() => normalizeSettingType(props.setting.type))
const inputType = computed(() => {
  if (type.value === 'datetime') return 'datetime-local'
  if (type.value === 'phone') return 'tel'
  if (['number', 'email', 'password', 'url', 'date', 'time'].includes(type.value)) return type.value
  return 'text'
})
const isWide = computed(() => ['textarea', 'editor', 'json', 'image', 'file'].includes(type.value))
</script>

<template>
  <div class="settings-field" :class="isWide ? 'md:col-span-2' : ''" :data-setting-type="type" :data-setting-key="setting.key">
    <div class="mb-2 flex items-center justify-between gap-3">
      <span class="rounded-full bg-neutral-soft px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-text-muted">
        {{ setting.type ?? 'text' }}
      </span>
      <button
        class="text-xs font-semibold text-primary hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-[var(--disabled-opacity)]"
        type="button"
        :disabled="disabled"
        @click="emit('reset')"
      >
        {{ $t('settings.resetField') }}
      </button>
    </div>

    <SwitchSettingField
      v-if="type === 'boolean'"
      :setting="setting"
      :model-value="modelValue"
      :error="error"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <SelectSettingField
      v-else-if="type === 'select' || type === 'multiselect'"
      :setting="setting"
      :model-value="modelValue"
      :multiple="type === 'multiselect'"
      :error="error"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <UploadSettingField
      v-else-if="type === 'image' || type === 'file'"
      :setting="setting"
      :model-value="modelValue"
      :image="type === 'image'"
      :error="error"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <ColorSettingField
      v-else-if="type === 'color'"
      :setting="setting"
      :model-value="modelValue"
      :error="error"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <JsonSettingField
      v-else-if="type === 'json'"
      :setting="setting"
      :model-value="modelValue"
      :error="error"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <TextSettingField
      v-else
      :setting="setting"
      :model-value="modelValue"
      :input-type="inputType"
      :textarea="type === 'textarea' || type === 'editor'"
      :error="error"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
