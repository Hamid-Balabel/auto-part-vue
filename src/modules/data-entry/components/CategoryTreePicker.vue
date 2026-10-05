<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from '@lucide/vue'
import { categoryDisabledSet, categoryDisplayName, filterCategoryTreeRowsByCollapsed, flattenCategoryTree } from '../utils/categoryTree'
import type { CategoryTreeNode } from '../types'

const props = withDefaults(defineProps<{
  id: string
  label: string
  modelValue: number | null | undefined
  nodes: CategoryTreeNode[]
  currentId?: number | string | null
  loading?: boolean
  error?: string
  allowRoot?: boolean
  required?: boolean
}>(), {
  allowRoot: true,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { locale, t } = useI18n()
const isRtl = computed(() => locale.value === 'ar')
const rootLabel = computed(() => t('dataEntry.rootCategory'))
const collapsedIds = ref<Set<number>>(new Set())
const rows = computed(() => flattenCategoryTree(props.nodes, locale.value, rootLabel.value))
const visibleRows = computed(() => filterCategoryTreeRowsByCollapsed(rows.value, collapsedIds.value))
const disabledIds = computed(() => categoryDisabledSet(props.nodes, props.currentId))
const selectedPath = computed(() => rows.value.find((row) => row.category.id === props.modelValue)?.path ?? (props.allowRoot ? rootLabel.value : t('common.select')))

function isCollapsed(id: number) {
  return collapsedIds.value.has(id)
}

function toggleRow(id: number) {
  const next = new Set(collapsedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsedIds.value = next
}
</script>

<template>
  <div :id="id" class="grid gap-2">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <span :id="`${id}-label`" class="form-label">{{ label }} <span v-if="required" class="text-danger">*</span></span>
      <span :id="`${id}-help`" class="text-xs text-text-muted">{{ t('dataEntry.selectedPath', { path: selectedPath }) }}</span>
    </div>

    <div
      class="rounded-[var(--radius-xl)] border border-border bg-surface p-2 shadow-sm"
      :class="error ? 'border-danger' : ''"
      role="group"
      :aria-labelledby="`${id}-label`"
      :aria-describedby="error ? `${id}-help ${id}-error` : `${id}-help`"
      :aria-invalid="error ? 'true' : undefined"
    >
      <button
        v-if="allowRoot"
        :id="`${id}-root`"
        class="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-start text-sm transition hover:bg-primary-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        :class="modelValue === null || modelValue === undefined ? 'bg-primary-soft text-primary' : 'text-text'"
        type="button"
        :aria-pressed="modelValue === null || modelValue === undefined"
        @click="emit('update:modelValue', null)"
      >
        <span class="font-semibold">{{ rootLabel }}</span>
        <span class="text-xs text-text-muted">{{ t('dataEntry.noParent') }}</span>
      </button>

      <div
        v-if="loading"
        class="px-3 py-4 text-sm text-text-muted"
      >{{ t('states.loading') }}</div>
      <div
        v-else-if="!rows.length"
        class="px-3 py-4 text-sm text-text-muted"
      >{{ t('states.emptyTitle') }}</div>
      <div
        v-else
        class="mt-1 max-h-80 overflow-y-auto"
      >
        <div
          v-for="row in visibleRows"
          :key="row.category.id"
          class="flex w-full items-stretch rounded-[var(--radius-md)] text-sm transition"
          :class="[
            modelValue === row.category.id ? 'bg-primary-soft text-primary' : 'text-text hover:bg-primary-soft/60',
            disabledIds.has(row.category.id) ? 'cursor-not-allowed opacity-[var(--disabled-opacity)]' : '',
          ]"
          :style="row.depth ? { paddingInlineStart: `${row.depth * 1.25 + 0.75}rem` } : undefined"
        >
          <button
            v-if="row.hasChildren"
            class="my-1 ms-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            type="button"
            :aria-expanded="!isCollapsed(row.category.id)"
            :aria-label="isCollapsed(row.category.id) ? t('dataEntry.expandCategory') : t('dataEntry.collapseCategory')"
            @click.stop="toggleRow(row.category.id)"
          >
            <ChevronDown class="size-4 transition-transform duration-200" :class="isCollapsed(row.category.id) ? (isRtl ? '-rotate-90' : 'rotate-90') : ''" aria-hidden="true" />
          </button>
          <span v-else class="ms-1 inline-block size-8 shrink-0" aria-hidden="true"></span>
          <button
            class="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-[var(--radius-md)] px-2 py-2.5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            type="button"
            :disabled="disabledIds.has(row.category.id)"
            :aria-disabled="disabledIds.has(row.category.id)"
            :aria-pressed="modelValue === row.category.id"
            @click="emit('update:modelValue', row.category.id)"
          >
            <span class="min-w-0">
              <span class="block truncate font-semibold">{{ categoryDisplayName(row.category, locale) }}</span>
              <span class="block truncate text-xs text-text-muted">{{ row.path }}</span>
            </span>
            <span class="shrink-0 text-xs text-text-muted">{{ row.parentName }}</span>
          </button>
        </div>
      </div>
    </div>
    <span v-if="error" :id="`${id}-error`" class="form-error">{{ error }}</span>
  </div>
</template>
