<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseCheckbox from '@/components/forms/BaseCheckbox.vue'
import PermissionItem from './PermissionItem.vue'
import type { Permission } from '@/modules/admin/types'

const props = defineProps<{
  title: string
  items: Permission[]
  selectedNames: string[]
  disabled?: boolean
  selectLabel: string
  clearLabel: string
}>()

const emit = defineEmits<{
  togglePermission: [name: string]
  setGroup: [items: Permission[], checked: boolean]
}>()

const expanded = ref(true)
const selectedCount = computed(() => props.items.filter((item) => props.selectedNames.includes(item.name)).length)
const state = computed<'empty' | 'partial' | 'checked'>(() => {
  if (selectedCount.value === 0) return 'empty'
  if (selectedCount.value === props.items.length) return 'checked'
  return 'partial'
})
const groupId = computed(() => String(props.title).replace(/\s+/g, '-').toLowerCase())
</script>

<template>
  <section class="rounded-[var(--radius-xl)] border bg-surface shadow-sm transition" :class="state === 'empty' ? 'border-border' : state === 'partial' ? 'border-secondary/40 ring-1 ring-secondary/10' : 'border-primary/40 ring-1 ring-primary/10'">
    <header class="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <button class="flex min-w-0 flex-1 items-center gap-3 text-start focus-visible:outline-none" type="button" :aria-expanded="expanded" @click="expanded = !expanded">
        <span class="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition" :class="[state === 'empty' ? 'bg-neutral-soft text-neutral' : state === 'partial' ? 'bg-secondary-soft text-secondary-hover' : 'bg-primary-soft text-primary', expanded ? 'rotate-0' : '-rotate-90']">⌄</span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-bold text-text">{{ title }}</span>
          <span class="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <BaseBadge :variant="state === 'empty' ? 'neutral' : state === 'partial' ? 'secondary' : 'primary'">{{ selectedCount }} / {{ items.length }}</BaseBadge>
          </span>
        </span>
      </button>
      <div class="flex items-center gap-3">
        <BaseCheckbox
          :model-value="state === 'checked'"
          :indeterminate="state === 'partial'"
          :disabled="disabled"
          :data-testid="`permission-group-toggle-${groupId}`"
          @update:model-value="emit('setGroup', items, state !== 'checked')"
        >
          {{ state === 'checked' ? clearLabel : selectLabel }}
        </BaseCheckbox>
      </div>
    </header>
    <div v-show="expanded" class="grid gap-2 p-4 md:grid-cols-2 xl:grid-cols-3">
      <PermissionItem
        v-for="permission in items"
        :key="permission.name"
        :permission="permission"
        :selected="selectedNames.includes(permission.name)"
        :disabled="disabled"
        @toggle="emit('togglePermission', $event)"
      />
    </div>
  </section>
</template>
