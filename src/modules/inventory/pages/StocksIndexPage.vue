<script setup lang="ts">
import { useLocalizedName } from "@/composables/useLocalizedName";
import { ArrowRightLeft } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import CrudDetailsModal from '@/components/ui/CrudDetailsModal.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
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
import { listResource } from '@/modules/data-entry/api'
import type { Brand, Category } from '@/modules/data-entry/types'
import { getStock, listProductItems, listProducts, listStocks, listWarehouses } from '../api'
import type { Product, ProductItem, Stock, Warehouse } from '../types'

const { t, locale } = useI18n()
const displayName = useLocalizedName();
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
const warehouses = ref<Warehouse[]>([])
const productItems = ref<ProductItem[]>([])
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const brands = ref<Brand[]>([])
const lookupsLoading = ref(false)
const emptyFilters = () => ({
  warehouse_id: null as number | null,
  item_id: null as number | null,
  quantity_min: '',
  quantity_max: '',
  in_stock: '',
  product_id: null as number | null,
  category_id: null as number | null,
  brand_id: null as number | null,
  created_from: '',
  created_to: '',
})
const filters = reactive(emptyFilters())
const appliedFilters = reactive(emptyFilters())
let detailsRequestId = 0
const list = useCrudList<Stock>({
  list: (query) => listStocks({
    ...query,
    ...(appliedFilters.warehouse_id ? { warehouse_id: appliedFilters.warehouse_id } : {}),
    ...(appliedFilters.item_id ? { item_id: appliedFilters.item_id } : {}),
    ...(appliedFilters.quantity_min !== '' ? { quantity_min: Number(appliedFilters.quantity_min) } : {}),
    ...(appliedFilters.quantity_max !== '' ? { quantity_max: Number(appliedFilters.quantity_max) } : {}),
    ...(appliedFilters.in_stock ? { in_stock: appliedFilters.in_stock } : {}),
    ...(appliedFilters.product_id ? { product_id: appliedFilters.product_id } : {}),
    ...(appliedFilters.category_id ? { category_id: appliedFilters.category_id } : {}),
    ...(appliedFilters.brand_id ? { brand_id: appliedFilters.brand_id } : {}),
    ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}),
    ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}),
  }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const columns = computed<DataTableColumn<Stock>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'warehouse', label: t('table.warehouse') },
  { key: 'item', label: t('table.productSku') },
  { key: 'product_name', label: t('table.productName') },
  { key: 'quantity', label: t('table.quantity'), sortable: true },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter((value) => value !== '' && value !== null).length)
const warehouseOptions = computed(() => warehouses.value.map((warehouse) => ({ value: warehouse.id, label: displayName(warehouse), description: warehouse.address ?? undefined })))
const productItemOptions = computed(() => productItems.value.map((item) => ({ value: item.id, label: `${displayName(item.product)} - ${item.sku}` })))
const productOptions = computed(() => products.value.map((product) => ({ value: product.id, label: displayName(product) })))
const categoryOptions = computed(() => categories.value.map((category) => ({ value: category.id, label: displayName(category) })))
const brandOptions = computed(() => brands.value.map((brand) => ({ value: brand.id, label: displayName(brand) })))
const booleanOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'true', label: t('crud.yes') },
  { value: 'false', label: t('crud.no') },
])


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

function normalizeList<T>(response: T[] | { data: T[] }) {
  return Array.isArray(response) ? response : response.data
}

async function loadLookups() {
  lookupsLoading.value = true
  try {
    const [warehouseResponse, itemResponse, productResponse, categoryResponse, brandResponse] = await Promise.all([
      listWarehouses({ per_page: -1 }),
      listProductItems({ per_page: -1 }),
      listProducts({ per_page: -1 }),
      listResource('categories', { per_page: -1 }),
      listResource('brands', { per_page: -1 }),
    ])
    warehouses.value = normalizeList(warehouseResponse)
    productItems.value = normalizeList(itemResponse)
    products.value = normalizeList(productResponse)
    categories.value = normalizeList(categoryResponse)
    brands.value = normalizeList(brandResponse)
  } finally {
    lookupsLoading.value = false
  }
}

function applyFilters() {
  Object.assign(appliedFilters, filters)
  list.page.value = 1
  void list.load()
}

function resetFilters() {
  Object.assign(filters, emptyFilters())
  Object.assign(appliedFilters, emptyFilters())
  list.page.value = 1
  void list.load()
}

onMounted(() => Promise.all([list.load(), loadLookups()]))
watch(locale, () => {
  if (detailsOpen.value && selectedStock.value) void openDetails(selectedStock.value.id)
})
</script>

<template>
  <PageHeader :title="t('inventory.stocksTitle')" :description="t('inventory.stocksDescription')">
    <template #actions>
      <BaseButton v-if="can('transfer-stock')" variant="secondary" :to="{ name: 'stocks.transfer' }"><ArrowRightLeft class="size-4" />{{ t('inventory.stockTransfer') }}</BaseButton>
      <BaseButton v-if="canCreate" :to="{ name: 'stocks.create' }">{{ t('actions.create') }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('inventory.searchStocks')" @search="list.applySearch" @refresh="list.load" />

  <CrudFilterPanel :active-count="activeFiltersCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters">
    <BaseSelect id="stock-warehouse-filter" v-model="filters.warehouse_id" :label="t('crud.warehouse')" :options="warehouseOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="stock-item-filter" v-model="filters.item_id" :label="t('crud.productItem')" :options="productItemOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <FormInput id="stock-quantity-min-filter" v-model="filters.quantity_min" type="number" :label="t('crud.quantityMin')" />
    <FormInput id="stock-quantity-max-filter" v-model="filters.quantity_max" type="number" :label="t('crud.quantityMax')" />
    <BaseSelect id="stock-in-stock-filter" v-model="filters.in_stock" :label="t('crud.inStock')" :options="booleanOptions" />
    <BaseSelect id="stock-product-filter" v-model="filters.product_id" :label="t('crud.product')" :options="productOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="stock-category-filter" v-model="filters.category_id" :label="t('crud.category')" :options="categoryOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="stock-brand-filter" v-model="filters.brand_id" :label="t('crud.brand')" :options="brandOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <DateInput id="stock-created-from-filter" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="stock-created-to-filter" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>

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
