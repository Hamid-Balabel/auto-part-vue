<script setup lang="ts">
import { ArrowRightLeft } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import CrudDetailsModal from '@/components/ui/CrudDetailsModal.vue'
import CrudShowButton from '@/components/ui/CrudShowButton.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import DetailsBadge from '@/components/ui/DetailsBadge.vue'
import DetailsField from '@/components/ui/DetailsField.vue'
import DetailsSection from '@/components/ui/DetailsSection.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RelationshipCard from '@/components/ui/RelationshipCard.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { ApiError } from '@/api/http'
import { useCrudList } from '@/composables/useCrudList'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { usePermissions } from '@/composables/usePermissions'
import { getStock, listStocks } from '../api'
import type { Stock } from '../types'

const { t, locale } = useI18n()
const permissions = useResourcePermissions('stock')
const { can } = usePermissions()
const canCreate = permissions.canCreate
const canUpdate = permissions.canUpdate
const canView = computed(() => true)
const detailsOpen = ref(false)
const detailsLoading = ref(false)
const detailsLoadingId = ref<number | null>(null)
const detailsError = ref('')
const selectedStock = ref<Stock | null>(null)
let detailsRequestId = 0
const list = useCrudList<Stock>({ list: listStocks, defaultSortColumn: 'id', defaultSortDirection: 'desc' })

const columns = computed<DataTableColumn<Stock>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'warehouse', label: t('table.warehouse') },
  { key: 'item', label: t('table.productSku') },
  { key: 'product_name', label: t('table.productName') },
  { key: 'quantity', label: t('table.quantity'), sortable: true },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])

function displayName(record?: { name?: string | null; translation_name?: { ar?: string | null; en?: string | null } } | null) {
  return record?.name ?? record?.translation_name?.ar ?? record?.translation_name?.en ?? '—'
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
}

function formatNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === '') return '—'
  return new Intl.NumberFormat(locale.value).format(Number(value))
}

async function openDetails(id: number) {
  if (detailsLoading.value) return
  detailsOpen.value = true
  detailsLoading.value = true
  detailsLoadingId.value = id
  detailsError.value = ''
  selectedStock.value = null
  const requestId = ++detailsRequestId
  try {
    const stock = await getStock(id)
    if (requestId === detailsRequestId && detailsOpen.value) selectedStock.value = stock
  } catch (error) {
    if (requestId === detailsRequestId && error instanceof ApiError) detailsError.value = error.message || t('details.failedToLoad')
  } finally {
    if (requestId === detailsRequestId) {
      detailsLoading.value = false
      detailsLoadingId.value = null
    }
  }
}

function closeDetails() {
  detailsRequestId += 1
  detailsOpen.value = false
  detailsLoading.value = false
  detailsLoadingId.value = null
  selectedStock.value = null
  detailsError.value = ''
}

onMounted(list.load)
</script>

<template>
  <PageHeader :title="t('inventory.stocksTitle')" :description="t('inventory.stocksDescription')">
    <template #actions>
      <BaseButton v-if="can('transfer-stock')" variant="secondary" :to="{ name: 'stocks.transfer' }"><ArrowRightLeft class="size-4" />{{ t('inventory.stockTransfer') }}</BaseButton>
      <BaseButton v-if="canCreate" :to="{ name: 'stocks.create' }">{{ t('actions.create') }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('inventory.searchStocks')" @search="list.applySearch" @refresh="list.load" />

  <DataTable
    :columns="columns"
    :rows="list.rows.value"
    :loading="list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    @sort="list.sortBy"
  >
    <template #cell-warehouse="{ row }">
      <span>{{ displayName(row.warehouse) }}</span>
    </template>
    <template #cell-item="{ row }">
      <span>{{ row.item?.sku ?? '—' }}</span>
    </template>
    <template #cell-product_name="{ row }">
      <span>{{ displayName(row.item?.product) }}</span>
    </template>
    <template #cell-quantity="{ value }">{{ formatNumber(value as string | number | null) }}</template>
    <template #cell-actions="{ row }">
      <div class="flex flex-wrap justify-end gap-2">
        <BaseButton v-if="can('transfer-stock')" variant="ghost" size="sm" :to="{ name: 'stocks.transfer', query: { from_warehouse_id: row.warehouse_id, product_item_id: row.item_id } }" :aria-label="t('inventory.stockTransfer')" :title="t('inventory.stockTransfer')"><ArrowRightLeft class="size-4" /></BaseButton>
        <CrudShowButton v-if="canView" :loading="detailsLoadingId === row.id" :disabled="detailsLoading" @click="openDetails(row.id)" />
        <RowActions
          :can-edit="canUpdate"
          :edit-to="{ name: 'stocks.edit', params: { id: row.id } }"
        />
      </div>
    </template>
  </DataTable>

  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />

  <CrudDetailsModal :open="detailsOpen" :title="selectedStock ? `${t('inventory.stocksTitle')} #${selectedStock.id}` : t('details.stockDetails')" :subtitle="t('details.details')" :loading="detailsLoading" :error-message="detailsError" @close="closeDetails">
    <div v-if="selectedStock" class="grid gap-4">
      <DetailsSection :title="t('details.mainInformation')">
        <dl class="grid gap-3 md:grid-cols-3">
          <DetailsField :label="t('table.quantity')" :value="formatNumber(selectedStock.quantity)" />
          <DetailsField :label="t('table.availableQuantity')" :value="formatNumber(selectedStock.quantity)" />
          <DetailsField :label="t('table.totalQuantity')" :value="formatNumber(selectedStock.quantity)" />
          <DetailsField :label="t('table.createdAt')" :value="formatDate(selectedStock.created_at)" />
        </dl>
      </DetailsSection>

      <DetailsSection :title="t('details.relatedInformation')">
        <div class="grid gap-3 lg:grid-cols-3">
          <RelationshipCard :title="displayName(selectedStock.warehouse)" :subtitle="selectedStock.warehouse?.address ?? selectedStock.warehouse?.description ?? t('details.noRelatedData')">
            <template #badge><DetailsBadge :value="selectedStock.warehouse?.is_active" /></template>
          </RelationshipCard>
          <RelationshipCard :title="selectedStock.item?.sku ?? '—'" :subtitle="selectedStock.item?.merchant?.name">
            <template #badge><DetailsBadge :value="selectedStock.item?.is_active" /></template>
            <DetailsField :label="t('table.price')" :value="formatNumber(selectedStock.item?.current_price)" />
          </RelationshipCard>
          <RelationshipCard :title="displayName(selectedStock.item?.product)" :subtitle="selectedStock.item?.product?.description ?? t('details.noRelatedData')">
            <template #badge><DetailsBadge :value="selectedStock.item?.product?.is_active" /></template>
          </RelationshipCard>
        </div>
      </DetailsSection>

      <DetailsSection :title="t('details.stockMovements')">
        <p class="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-sm text-text-muted">{{ t('details.noRelatedData') }}</p>
      </DetailsSection>
    </div>
  </CrudDetailsModal>
</template>
