<script setup lang="ts">
import {
  ArrowRightLeft,
  BadgeDollarSign,
  Boxes,
  CalendarRange,
  CircleGauge,
  CircleDollarSign,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  UserRoundPlus,
  UsersRound,
  UserCheck,
  Warehouse,
} from '@lucide/vue'
import { computed, markRaw, onMounted, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/http'
import DateInput from '@/components/forms/DateInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ReportRankingCard from '../components/ReportRankingCard.vue'
import { getReport } from '../api'
import type { ReportPage, ReportPayload } from '../types'

withDefaults(defineProps<{
  embedded?: boolean
}>(), {
  embedded: false,
})

interface SectionPresentation {
  icon: Component
  descriptionKey: string
  primaryKey: string
  metricKey: string
  secondaryKeys?: string[]
  money?: boolean
  inverse?: boolean
  chartType: 'bar' | 'line' | 'donut'
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const activeTab = ref<ReportPage>(route.query.tab === 'user' ? 'user' : 'product')
const start = ref(typeof route.query.start === 'string' ? route.query.start : '')
const end = ref(typeof route.query.end === 'string' ? route.query.end : '')
const loading = ref(false)
const error = ref('')
const reports = ref<Partial<Record<ReportPage, ReportPayload>>>({})
let requestNumber = 0

const tabs: Array<{ key: ReportPage; labelKey: string; icon: Component }> = [
  { key: 'product', labelKey: 'reports.productTab', icon: markRaw(PackageSearch) },
  { key: 'user', labelKey: 'reports.userTab', icon: markRaw(UsersRound) },
]

const presentations: Record<ReportPage, SectionPresentation[]> = {
  product: [
    { icon: markRaw(TrendingUp), descriptionKey: 'reports.sections.topProducts', primaryKey: 'product_name', metricKey: 'sold_quantity', chartType: 'bar' },
    { icon: markRaw(PackageCheck), descriptionKey: 'reports.sections.topItems', primaryKey: 'sku', metricKey: 'sold_quantity', secondaryKeys: ['product_name'], chartType: 'donut' },
    { icon: markRaw(Boxes), descriptionKey: 'reports.sections.lowStock', primaryKey: 'sku', metricKey: 'available_stock', secondaryKeys: ['product_name'], inverse: true, chartType: 'line' },
    { icon: markRaw(BadgeDollarSign), descriptionKey: 'reports.sections.revenue', primaryKey: 'product_name', metricKey: 'revenue', money: true, chartType: 'bar' },
    { icon: markRaw(CircleGauge), descriptionKey: 'reports.sections.slowMoving', primaryKey: 'sku', metricKey: 'sold_quantity', secondaryKeys: ['product_name', 'available_stock'], inverse: true, chartType: 'donut' },
  ],
  user: [
    { icon: markRaw(ShoppingBag), descriptionKey: 'reports.sections.userSales', primaryKey: 'user_name', metricKey: 'sales_count', chartType: 'bar' },
    { icon: markRaw(BadgeDollarSign), descriptionKey: 'reports.sections.userValue', primaryKey: 'user_name', metricKey: 'sales_value', money: true, chartType: 'donut' },
    { icon: markRaw(TrendingUp), descriptionKey: 'reports.sections.userUnits', primaryKey: 'user_name', metricKey: 'units_sold', chartType: 'line' },
    { icon: markRaw(UserRoundPlus), descriptionKey: 'reports.sections.userItems', primaryKey: 'user_name', metricKey: 'product_items_count', chartType: 'bar' },
    { icon: markRaw(ArrowRightLeft), descriptionKey: 'reports.sections.userTransfers', primaryKey: 'user_name', metricKey: 'transferred_quantity', secondaryKeys: ['transfers_count'], chartType: 'donut' },
  ],
}

const currentReport = computed(() => reports.value[activeTab.value])
const currentSections = computed(() => presentations[activeTab.value])
const hasDateFilter = computed(() => Boolean(start.value || end.value))
const cardIcons: Record<string, Component> = {
  active_products: markRaw(PackageSearch),
  active_product_items: markRaw(PackageCheck),
  available_stock_total: markRaw(Warehouse),
  sales_revenue: markRaw(CircleDollarSign),
  active_users: markRaw(UserCheck),
  completed_sales: markRaw(ShoppingBag),
  sales_value: markRaw(CircleDollarSign),
  sold_units: markRaw(Boxes),
}

function isMoneyCard(key: string): boolean {
  return key === 'sales_revenue' || key === 'sales_value'
}

function formatCardValue(value: string | number, key: string): string {
  const number = Number(value ?? 0)
  return new Intl.NumberFormat(undefined, isMoneyCard(key)
    ? { style: 'currency', currency: 'EGP', maximumFractionDigits: 1 }
    : { maximumFractionDigits: 1 },
  ).format(Number.isFinite(number) ? number : 0)
}

async function loadReport(force = false): Promise<void> {
  if (reports.value[activeTab.value] && !force) return

  const currentRequest = ++requestNumber
  loading.value = true
  error.value = ''

  try {
    const payload = await getReport({
      page: activeTab.value,
      start: start.value || undefined,
      end: end.value || undefined,
    })
    if (currentRequest === requestNumber) {
      reports.value = { ...reports.value, [activeTab.value]: payload }
    }
  } catch (requestError) {
    if (currentRequest === requestNumber) {
      error.value = requestError instanceof ApiError ? requestError.message : t('reports.loadError')
    }
  } finally {
    if (currentRequest === requestNumber) loading.value = false
  }
}

async function selectTab(tab: ReportPage): Promise<void> {
  activeTab.value = tab
  await syncQuery()
  await loadReport()
}

async function applyFilters(): Promise<void> {
  if (start.value && end.value && end.value < start.value) {
    error.value = t('reports.invalidPeriod')
    return
  }

  reports.value = {}
  await syncQuery()
  await loadReport(true)
}

async function clearFilters(): Promise<void> {
  start.value = ''
  end.value = ''
  await applyFilters()
}

async function syncQuery(): Promise<void> {
  await router.replace({
    query: {
      tab: activeTab.value === 'user' ? 'user' : undefined,
      start: start.value || undefined,
      end: end.value || undefined,
    },
  })
}

onMounted(() => loadReport())
</script>

<template>
  <PageHeader v-if="!embedded" :title="t('reports.title')" :description="t('reports.description')">
    <template #actions>
      <BaseButton variant="outline" :loading="loading" @click="loadReport(true)">
        <RefreshCw class="size-4" />
        {{ t('actions.refresh') }}
      </BaseButton>
    </template>
  </PageHeader>

  <section class="mb-6 overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_18px_55px_rgba(15,23,42,.09)]">
    <div class="flex overflow-x-auto border-b border-border bg-background/50 p-2" role="tablist" :aria-label="t('reports.tabsLabel')">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="relative flex min-w-40 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-3 text-sm font-semibold transition"
        :class="activeTab === tab.key ? 'bg-surface text-primary shadow-sm ring-1 ring-border' : 'text-text-muted hover:bg-surface/60 hover:text-text'"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.key"
        @click="selectTab(tab.key)"
      >
        <component :is="tab.icon" class="size-4" />
        {{ t(tab.labelKey) }}
      </button>
    </div>

    <form class="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end" @submit.prevent="applyFilters">
      <DateInput id="report-start" v-model="start" :label="t('reports.startDate')" />
      <DateInput id="report-end" v-model="end" :label="t('reports.endDate')" />
      <div class="flex flex-wrap gap-2">
        <BaseButton type="submit" :loading="loading">
          <CalendarRange class="size-4" />
          {{ t('reports.applyPeriod') }}
        </BaseButton>
        <BaseButton v-if="hasDateFilter" variant="ghost" @click="clearFilters">
          {{ t('actions.clear') }}
        </BaseButton>
      </div>
    </form>
  </section>

  <div v-if="error" class="mb-6 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-danger/25 bg-danger/5 p-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
    <span>{{ error }}</span>
    <BaseButton size="sm" variant="outline" @click="loadReport(true)">{{ t('actions.refresh') }}</BaseButton>
  </div>

  <LoadingState v-if="loading && !currentReport" />

  <template v-else-if="currentReport">
    <div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-text">{{ currentReport.report.title }}</h2>
        <p class="mt-1 text-sm text-text-muted">{{ hasDateFilter ? t('reports.filteredNote') : t('reports.allTimeNote') }}</p>
      </div>
      <p class="text-xs text-text-muted">{{ t('reports.lastUpdatedNow') }}</p>
    </div>

    <section class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in currentReport.report.cards.data" :key="card.key" class="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <component :is="cardIcons[card.key] ?? CircleGauge" class="size-5" />
          </div>
        </div>
        <p class="mt-4 text-sm text-text-muted">{{ card.label }}</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-text">{{ formatCardValue(card.value, card.key) }}</p>
      </article>
    </section>

    <div class="mb-5 flex items-start gap-3 rounded-[var(--radius-lg)] border border-secondary/25 bg-secondary-soft/50 p-4 text-sm leading-6 text-text-muted">
      <CircleGauge class="mt-0.5 size-5 shrink-0 text-secondary-hover" />
      <p>{{ activeTab === 'product' ? t('reports.productCalculationNote') : t('reports.userCalculationNote') }}</p>
    </div>

    <section class="grid gap-5 xl:grid-cols-2">
      <ReportRankingCard
        v-for="(table, index) in currentReport.report.tables"
        :key="`${activeTab}-${table.title}`"
        :table="table"
        :icon="currentSections[index]?.icon ?? PackageSearch"
        :description="t(currentSections[index]?.descriptionKey ?? 'reports.sectionDescription')"
        :primary-key="currentSections[index]?.primaryKey ?? table.columns[0]?.key ?? ''"
        :metric-key="currentSections[index]?.metricKey ?? table.columns[table.columns.length - 1]?.key ?? ''"
        :secondary-keys="currentSections[index]?.secondaryKeys"
        :money="currentSections[index]?.money"
        :chart-type="currentSections[index]?.chartType ?? 'bar'"
        :accent="index"
        :class="index === currentReport.report.tables.length - 1 && index % 2 === 0 ? 'xl:col-span-2' : ''"
      />
    </section>
  </template>
</template>
