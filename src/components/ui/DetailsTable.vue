<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface DetailsTableColumn<T> {
  key: keyof T | string
  label: string
}

defineProps<{
  columns: DetailsTableColumn<T>[]
  rows: T[]
  emptyText: string
}>()

const { locale } = useI18n()
const textDirection = computed(() => locale.value === 'ar' ? 'rtl' : 'ltr')
</script>

<template>
  <div class="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
    <div class="overflow-x-auto [contain:inline-size]" dir="ltr">
      <table class="min-w-full divide-y divide-border text-sm" dir="ltr">
        <thead class="bg-background/80 text-xs uppercase tracking-wide text-text-muted">
          <tr>
            <th v-for="column in columns" :key="String(column.key)" :dir="textDirection" class="whitespace-nowrap px-3 py-3 text-start font-bold">{{ column.label }}</th>
          </tr>
        </thead>
        <tbody v-if="rows.length" class="divide-y divide-border">
          <tr v-for="(row, rowIndex) in rows" :key="row.id ? String(row.id) : rowIndex">
            <td v-for="column in columns" :key="String(column.key)" :dir="textDirection" class="px-3 py-3 align-top text-text">
              <slot :name="`cell-${String(column.key)}`" :row="row" :value="row[column.key as keyof T]">
                {{ row[column.key as keyof T] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!rows.length" class="px-4 py-6 text-center text-sm text-text-muted">{{ emptyText }}</div>
  </div>
</template>
