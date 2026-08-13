<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ReportRow, ReportTable } from '../types'

type ChartType = 'bar' | 'line' | 'donut'

const props = defineProps<{
  table: ReportTable
  icon: Component
  description: string
  primaryKey: string
  metricKey: string
  secondaryKeys?: string[]
  money?: boolean
  chartType: ChartType
  accent: number
}>()

const { locale, t } = useI18n()
const colors = ['#2563eb', '#0f766e', '#d97706', '#7c3aed', '#dc2626']
const sliceColors = ['#2563eb', '#60a5fa', '#0f766e', '#5eead4', '#d97706', '#fbbf24', '#7c3aed']
const color = computed(() => colors[props.accent % colors.length]!)
const hoveredIndex = ref<number | null>(null)
const chartRows = computed(() => props.table.data.slice(0, 6))
const values = computed(() => chartRows.value.map((row) => numberValue(row)))
const maximum = computed(() => Math.max(...values.value, 0))
const total = computed(() => values.value.reduce((sum, value) => sum + value, 0))
const linePoints = computed(() => chartRows.value.map((row, index) => ({
  x: chartRows.value.length === 1 ? 50 : 8 + (index / (chartRows.value.length - 1)) * 84,
  y: 85 - (numberValue(row) / (maximum.value || 1)) * 65,
})))
const linePath = computed(() => linePoints.value.map((point) => `${point.x},${point.y}`).join(' '))
const areaPath = computed(() => linePoints.value.length
  ? `M ${linePoints.value[0]!.x} 88 L ${linePoints.value.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${linePoints.value[linePoints.value.length - 1]!.x} 88 Z`
  : '',
)
const donutSegments = computed(() => {
  let offset = 0
  return chartRows.value.map((row, index) => {
    const percentage = total.value ? (numberValue(row) / total.value) * 100 : 0
    const segment = { row, index, percentage, offset }
    offset += percentage
    return segment
  })
})

function numberValue(row: ReportRow): number {
  const value = Number(row[props.metricKey] ?? 0)
  return Number.isFinite(value) ? value : 0
}

function formatValue(value: ReportRow[string], money = false): string {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return String(value ?? '-')
  return new Intl.NumberFormat(locale.value, money
    ? { style: 'currency', currency: 'EGP', maximumFractionDigits: 1 }
    : { maximumFractionDigits: 1 },
  ).format(number)
}

function shortLabel(row: ReportRow): string {
  const value = String(row[props.primaryKey] ?? '-')
  return value.length > 10 ? `${value.slice(0, 9)}…` : value
}

function tooltipText(row: ReportRow): string {
  return `${row[props.primaryKey] ?? '-'}: ${formatValue(row[props.metricKey], props.money)}`
}
</script>

<template>
  <article class="flex min-h-[27rem] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-sm">
    <header class="flex items-start gap-3 border-b border-border/70 p-5">
      <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background" :style="{ color }">
        <component :is="icon" class="size-5" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-text">{{ table.title }}</h2>
        <p class="mt-1 text-sm leading-6 text-text-muted">{{ description }}</p>
      </div>
    </header>

    <template v-if="table.data.length">
      <div class="h-64 border-b border-border/60 bg-background/40 p-5">
        <div v-if="chartType === 'bar'" class="flex h-full items-end justify-around gap-3 border-b border-border px-2 pt-7">
          <div
            v-for="(row, index) in chartRows"
            :key="index"
            class="group/bar relative flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end gap-2"
            @mouseenter="hoveredIndex = index"
            @mouseleave="hoveredIndex = null"
          >
            <div v-if="hoveredIndex === index" class="pointer-events-none absolute left-1/2 top-0 z-10 w-max max-w-48 -translate-x-1/2 rounded-lg bg-text px-3 py-2 text-center text-xs font-semibold text-white shadow-lg">
              {{ tooltipText(row) }}
            </div>
            <span class="text-xs font-bold tabular-nums text-text-muted">{{ formatValue(row[metricKey], money) }}</span>
            <div class="w-full max-w-10 rounded-t-md opacity-85 transition duration-200 group-hover/bar:opacity-100 group-hover/bar:brightness-110" :style="{ height: `${Math.max((numberValue(row) / (maximum || 1)) * 72, 4)}%`, backgroundColor: color }"></div>
            <span class="w-full truncate text-center text-[11px] font-medium text-text-muted">{{ shortLabel(row) }}</span>
          </div>
        </div>

        <div v-else-if="chartType === 'line'" class="relative h-full border-b border-border">
          <svg class="h-[88%] w-full" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" :aria-label="table.title">
            <path :d="areaPath" :fill="color" opacity=".09" />
            <polyline :points="linePath" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
            <circle
              v-for="(point, index) in linePoints"
              :key="index"
              class="cursor-pointer transition-all"
              :cx="point.x"
              :cy="point.y"
              :r="hoveredIndex === index ? 3 : 2.1"
              :fill="color"
              stroke="white"
              stroke-width="1"
              @mouseenter="hoveredIndex = index"
              @mouseleave="hoveredIndex = null"
            />
          </svg>
          <div
            v-if="hoveredIndex !== null && linePoints[hoveredIndex] && chartRows[hoveredIndex]"
            class="pointer-events-none absolute z-10 w-max max-w-48 -translate-x-1/2 -translate-y-full rounded-lg bg-text px-3 py-2 text-xs font-semibold text-white shadow-lg"
            :style="{ left: `${linePoints[hoveredIndex]!.x}%`, top: `${linePoints[hoveredIndex]!.y * 0.88}%` }"
          >
            {{ tooltipText(chartRows[hoveredIndex]!) }}
          </div>
          <div class="absolute inset-x-0 bottom-1 flex justify-around gap-1">
            <span v-for="(row, index) in chartRows" :key="index" class="min-w-0 flex-1 truncate text-center text-[11px] font-medium text-text-muted">{{ shortLabel(row) }}</span>
          </div>
        </div>

        <div v-else class="relative flex h-full items-center justify-center gap-7">
          <div v-if="hoveredIndex !== null && chartRows[hoveredIndex]" class="pointer-events-none absolute start-1/2 top-0 z-10 w-max max-w-52 -translate-x-1/2 rounded-lg bg-text px-3 py-2 text-xs font-semibold text-white shadow-lg">
            {{ tooltipText(chartRows[hoveredIndex]!) }}
          </div>
          <div class="relative aspect-square h-[88%]">
            <svg class="size-full -rotate-90 overflow-visible" viewBox="0 0 100 100" role="img" :aria-label="table.title">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" stroke-width="20" />
              <circle
                v-for="segment in donutSegments"
                :key="segment.index"
                class="cursor-pointer transition-all duration-200"
                cx="50"
                cy="50"
                r="38"
                fill="none"
                :stroke="sliceColors[segment.index % sliceColors.length]"
                :stroke-width="hoveredIndex === segment.index ? 23 : 20"
                pathLength="100"
                :stroke-dasharray="`${segment.percentage} ${100 - segment.percentage}`"
                :stroke-dashoffset="-segment.offset"
                @mouseenter="hoveredIndex = segment.index"
                @mouseleave="hoveredIndex = null"
              />
            </svg>
            <div class="pointer-events-none absolute inset-[25%] flex flex-col items-center justify-center rounded-full bg-surface">
              <span class="text-xs text-text-muted">{{ t('reports.total') }}</span>
              <strong class="mt-1 text-base font-bold text-text">{{ formatValue(total, money) }}</strong>
            </div>
          </div>
          <div class="max-w-48 space-y-2">
            <div
              v-for="(row, index) in chartRows.slice(0, 5)"
              :key="index"
              class="flex cursor-default items-center gap-2 rounded-md px-1 py-0.5 text-xs transition hover:bg-surface"
              @mouseenter="hoveredIndex = index"
              @mouseleave="hoveredIndex = null"
            >
              <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: sliceColors[index % sliceColors.length] }"></span>
              <span class="min-w-0 flex-1 truncate text-text-muted">{{ row[primaryKey] }}</span>
              <strong class="tabular-nums text-text">{{ formatValue(row[metricKey], money) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 divide-y divide-border/60 px-5">
        <div v-for="(row, index) in table.data.slice(0, 5)" :key="`${row[primaryKey]}-${index}`" class="flex items-center gap-3 py-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-bold text-text-muted">{{ index + 1 }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold text-text">{{ row[primaryKey] ?? '-' }}</p>
            <p v-if="secondaryKeys?.length" class="truncate text-[10px] text-text-muted">{{ secondaryKeys.map((key) => row[key]).filter(Boolean).join(' · ') }}</p>
          </div>
          <strong class="shrink-0 text-xs font-bold tabular-nums" :style="{ color }">{{ formatValue(row[metricKey], money) }}</strong>
        </div>
      </div>
    </template>

    <div v-else class="flex flex-1 flex-col items-center justify-center p-10 text-center">
      <component :is="icon" class="mb-3 size-6 text-text-muted" />
      <p class="text-sm font-semibold text-text">{{ t('reports.noSectionData') }}</p>
      <p class="mt-1 text-xs text-text-muted">{{ t('reports.tryAnotherPeriod') }}</p>
    </div>
  </article>
</template>
