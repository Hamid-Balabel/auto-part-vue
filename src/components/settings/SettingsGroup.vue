<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SettingGroup as SettingGroupType, SettingValue } from '@/modules/admin/types'
import SettingsField from './SettingsField.vue'
import { humanizeSettingKey } from './settingUtils'

const props = defineProps<{
  group: SettingGroupType
  depth?: number
  values: Record<number, SettingValue>
  errors: Record<number, string>
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:value': [id: number, value: SettingValue]
  reset: [id: number]
}>()

const { locale } = useI18n()
const depthValue = computed(() => props.depth ?? 0)
const title = computed(() => locale.value === 'ar' ? props.group.display_label ?? humanizeSettingKey(props.group.label) : humanizeSettingKey(props.group.label))
const itemCount = computed(() => countItems(props.group))
const icon = computed(() => groupIcon(props.group.label))

function forwardUpdate(id: number, value: SettingValue) {
  emit('update:value', id, value)
}

function countItems(group: SettingGroupType): number {
  return (group.items?.length ?? 0) + (group.nested ?? []).reduce((total, nested) => total + countItems(nested), 0)
}

function groupIcon(label: string): string {
  const normalized = label.toLowerCase()
  if (normalized.includes('general')) return 'G'
  if (normalized.includes('properties')) return 'P'
  if (normalized.includes('notification')) return 'N'
  if (normalized.includes('theme')) return 'T'
  if (normalized.includes('mail')) return 'M'
  if (normalized.includes('config')) return 'C'
  return label.slice(0, 1).toUpperCase()
}
</script>

<template>
  <section
    class="settings-group rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft"
    :class="depthValue > 0 ? 'shadow-none' : ''"
    :data-testid="`settings-group-${group.label}`"
  >
    <header class="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary-soft text-sm font-black text-primary">
          {{ icon }}
        </div>
        <div>
          <h2 class="text-lg font-bold text-text">{{ title }}</h2>
          <p class="mt-1 text-xs text-text-muted">{{ itemCount }} {{ $t('settings.settingsCount') }}</p>
        </div>
      </div>
      <span class="rounded-full bg-secondary-soft px-3 py-1 text-xs font-bold text-secondary">{{ group.label }}</span>
    </header>

    <div class="space-y-5 p-5">
      <div v-if="group.items?.length" class="grid gap-5 md:grid-cols-2">
        <SettingsField
          v-for="item in group.items"
          :key="item.id"
          :setting="item"
          :model-value="values[item.id]"
          :error="errors[item.id]"
          :disabled="disabled"
          @update:model-value="emit('update:value', item.id, $event)"
          @reset="emit('reset', item.id)"
        />
      </div>

      <SettingsGroup
        v-for="nested in group.nested ?? []"
        :key="nested.label"
        :group="nested"
        :depth="depthValue + 1"
        :values="values"
        :errors="errors"
        :disabled="disabled"
        @update:value="forwardUpdate"
        @reset="emit('reset', $event)"
      />
    </div>
  </section>
</template>
