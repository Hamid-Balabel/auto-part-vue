<script setup lang="ts">
import type { Permission } from '@/modules/admin/types'
import BaseCheckbox from '@/components/forms/BaseCheckbox.vue'

defineProps<{
  permission: Permission
  selected: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  toggle: [name: string]
}>()
</script>

<template>
  <div
    class="group flex w-full items-start gap-3 rounded-[var(--radius-lg)] border px-3 py-3 text-start text-sm transition focus-visible:outline-none"
    :class="[
      selected ? 'border-primary bg-primary-soft/80 text-text shadow-sm ring-1 ring-primary/20' : 'border-border bg-surface text-text hover:border-primary/50 hover:bg-primary-soft/40',
      disabled ? 'cursor-not-allowed opacity-[var(--disabled-opacity)]' : 'cursor-pointer',
    ]"
  >
    <BaseCheckbox
      class="mt-0.5 shrink-0"
      :model-value="selected"
      :disabled="disabled"
      :data-testid="`permission-checkbox-${permission.name}`"
      @update:model-value="emit('toggle', permission.name)"
    />
    <span class="leading-5">
      {{ permission.translation_display_name ?? permission.name }}
      <span class="mt-1 block text-xs font-normal text-text-muted">{{ permission.name }}</span>
    </span>
  </div>
</template>
