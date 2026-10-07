<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import EmptyState from './EmptyState.vue'
import LoadingState from './LoadingState.vue'

export interface DataTableColumn<T> {
  key: keyof T | string
  label: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
}

defineProps<{
  columns: DataTableColumn<T>[]
  rows: T[]
  loading?: boolean
  emptyTitle?: string
  emptyMessage?: string
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  compact?: boolean
}>()

const emit = defineEmits<{
  sort: [column: string]
}>()

const { locale } = useI18n()
const textDirection = computed(() => locale.value === 'ar' ? 'rtl' : 'ltr')

function alignmentClass(column: DataTableColumn<T>) {
  if (column.align === 'right') return 'text-end'
  if (column.align === 'center') return 'text-center'
  return 'text-start'
}
</script>

<template>
  <LoadingState v-if="loading" />
  <div v-else class="panel w-full max-w-full overflow-hidden">
    <div v-if="rows.length" class="overflow-x-auto [contain:inline-size]" :dir="textDirection">
      <table class="min-w-full divide-y divide-border text-sm" :dir="textDirection">
        <thead class="bg-background text-xs font-semibold uppercase tracking-wide text-text-muted">
          <tr>
            <th v-for="column in columns" :key="String(column.key)" class="whitespace-nowrap py-4" :class="compact ? 'px-2.5' : 'px-5'">
              <div :dir="textDirection" :class="alignmentClass(column)">
                <button
                  v-if="column.sortable"
                  class="inline-flex items-center gap-1 font-semibold hover:text-primary"
                  type="button"
                  @click="emit('sort', String(column.key))"
                >
                  <span>{{ column.label }}</span>
                  <span v-if="sortColumn === column.key" aria-hidden="true">{{ sortDirection === 'asc' ? 'ASC' : 'DESC' }}</span>
                </button>
                <span v-else>{{ column.label }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border bg-surface">
          <tr v-for="(row, index) in rows" :key="String(row.id ?? index)" class="transition hover:bg-primary-soft/35">
            <td v-for="column in columns" :key="String(column.key)" class="py-4 text-text" :class="compact ? 'px-2.5' : 'px-5'">
              <div :dir="textDirection" :class="alignmentClass(column)">
                <slot :name="`cell-${String(column.key)}`" :row="row" :value="row[column.key]">
                  {{ row[column.key] ?? '-' }}
                </slot>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState v-else :title="emptyTitle" :message="emptyMessage" />
  </div>
</template>
