<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
import CrudDetailsModal from '@/components/ui/CrudDetailsModal.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudShowButton from '@/components/ui/CrudShowButton.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import DetailsBadge from '@/components/ui/DetailsBadge.vue'
import DetailsField from '@/components/ui/DetailsField.vue'
import DetailsImage from '@/components/ui/DetailsImage.vue'
import DetailsSection from '@/components/ui/DetailsSection.vue'
import DetailsTable, { type DetailsTableColumn } from '@/components/ui/DetailsTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RelationshipCard from '@/components/ui/RelationshipCard.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { ApiError } from '@/api/http'
import { useCrudList } from '@/composables/useCrudList'
import { usePermissions } from '@/composables/usePermissions'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { listResource } from '@/modules/data-entry/api'
import type { Brand, Category } from '@/modules/data-entry/types'
import { deleteProductItem, getProductItem, listMerchants, listProductItems, listProducts, listWarehouses, toggleProductItem } from '../api'
import type { Merchant, Product, ProductItem, ProductOptionValue, Stock, Warehouse } from '../types'

const { t, locale } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('product-item')
const { can } = usePermissions()
const canCreate = permissions.canCreate
const canView = permissions.canView
const canUpdate = permissions.canUpdate
const canDelete = permissions.canDelete
const canToggle = permissions.canToggle
const canLoadMerchants = computed(() => can('read-merchant') && can(['view-all-merchant', 'view-own-merchant']))
const selectedId = ref<number | null>(null)
const detailsOpen = ref(false)
const detailsLoading = ref(false)
const detailsLoadingId = ref<number | null>(null)
const detailsError = ref('')
const selectedItem = ref<ProductItem | null>(null)
const products = ref<Product[]>([])
const merchants = ref<Merchant[]>([])
const categories = ref<Category[]>([])
const brands = ref<Brand[]>([])
const warehouses = ref<Warehouse[]>([])
const lookupsLoading = ref(false)
const emptyFilters = () => ({
  sku: '',
  barcode: '',
  product_id: null as number | null,
  merchant_id: null as number | null,
  category_id: null as number | null,
  brand_id: null as number | null,
  warehouse_id: null as number | null,
  is_active: '',
  trashed: '',
  created_from: '',
  created_to: '',
})
const filters = reactive(emptyFilters())
const appliedFilters = reactive(emptyFilters())
let detailsRequestId = 0
const list = useCrudList<ProductItem>({
  list: (query) => listProductItems({
    ...query,
    ...(appliedFilters.sku ? { sku: appliedFilters.sku } : {}),
    ...(appliedFilters.barcode ? { barcode: appliedFilters.barcode } : {}),
    ...(appliedFilters.product_id ? { product_id: appliedFilters.product_id } : {}),
    ...(appliedFilters.merchant_id ? { merchant_id: appliedFilters.merchant_id } : {}),
    ...(appliedFilters.category_id ? { category_id: appliedFilters.category_id } : {}),
    ...(appliedFilters.brand_id ? { brand_id: appliedFilters.brand_id } : {}),
    ...(appliedFilters.warehouse_id ? { warehouse_id: appliedFilters.warehouse_id } : {}),
    ...(appliedFilters.is_active ? { is_active: appliedFilters.is_active } : {}),
    ...(appliedFilters.trashed ? { trashed: appliedFilters.trashed as 'with' | 'only' } : {}),
    ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}),
    ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}),
  }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const columns = computed<DataTableColumn<ProductItem>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'sku', label: t('table.sku'), sortable: true },
  { key: 'product', label: t('table.product') },
  { key: 'merchant', label: t('inventory.merchant') },
  { key: 'option_values', label: t('inventory.optionValues') },
  { key: 'current_price', label: t('table.price') },
  { key: 'total_stock', label: t('table.stock') },
  { key: 'is_active', label: t('table.status') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const optionColumns = computed<DetailsTableColumn<ProductOptionValue>[]>(() => [
  { key: 'name', label: t('table.name') },
  { key: 'product_option', label: t('details.attribute') },
  { key: 'description', label: t('table.description') },
  { key: 'is_active', label: t('table.status') },
])
const priceColumns = computed<DetailsTableColumn<Record<string, unknown>>[]>(() => [
  { key: 'price', label: t('table.price') },
  { key: 'valid_from', label: t('details.validFrom') },
  { key: 'valid_to', label: t('details.validTo') },
  { key: 'is_active', label: t('table.status') },
])
const stockColumns = computed<DetailsTableColumn<Stock>[]>(() => [
  { key: 'warehouse', label: t('table.warehouse') },
  { key: 'quantity', label: t('table.quantity') },
  { key: 'created_at', label: t('table.createdAt') },
])
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter((value) => value !== '' && value !== null).length)
const productOptions = computed(() => products.value.map((product) => ({ value: product.id, label: displayName(product) })))
const merchantOptions = computed(() => merchants.value.map((merchant) => ({ value: merchant.id, label: merchant.name, description: merchant.email ?? merchant.phone ?? undefined })))
const categoryOptions = computed(() => categories.value.map((category) => ({ value: category.id, label: displayName(category) })))
const brandOptions = computed(() => brands.value.map((brand) => ({ value: brand.id, label: displayName(brand) })))
const warehouseOptions = computed(() => warehouses.value.map((warehouse) => ({ value: warehouse.id, label: displayName(warehouse), description: warehouse.address ?? undefined })))
const statusOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'true', label: t('crud.active') },
  { value: 'false', label: t('crud.inactive') },
])
const trashedOptions = computed(() => [
  { value: '', label: t('crud.active') },
  { value: 'with', label: t('crud.withDeleted') },
  { value: 'only', label: t('crud.onlyDeleted') },
])

function displayName(record?: { name?: string | null; translation_name?: { ar?: string | null; en?: string | null } } | null) {
  return record?.name ?? record?.translation_name?.ar ?? record?.translation_name?.en ?? '—'
}

function groupedOptionValues(item: ProductItem) {
  const groups = new Map<string, { key: string; label: string; values: string[] }>()

  for (const optionValue of item.option_values ?? item.optionValues ?? []) {
    const productOption = optionValue.product_option ?? optionValue.productOption
    const label = displayName(productOption)
    const key = productOption?.id ? String(productOption.id) : label
    const group = groups.get(key) ?? { key, label, values: [] }
    const value = displayName(optionValue)

    if (!group.values.includes(value)) group.values.push(value)
    groups.set(key, group)
  }

  return [...groups.values()]
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
  selectedItem.value = null
  const requestId = ++detailsRequestId
  try {
    const item = await getProductItem(id)
    if (requestId === detailsRequestId && detailsOpen.value) selectedItem.value = item
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
  selectedItem.value = null
  detailsError.value = ''
}

async function confirmDelete() {
  if (!selectedId.value) return
  await list.mutate(async () => {
    await deleteProductItem(selectedId.value as number)
    toast.success(t('crud.deleted'))
  })
  selectedId.value = null
}

function normalizeList<T>(response: T[] | { data: T[] }) {
  return Array.isArray(response) ? response : response.data
}

async function loadLookups() {
  lookupsLoading.value = true
  try {
    const [productResponse, merchantResponse, categoryResponse, brandResponse, warehouseResponse] = await Promise.all([
      listProducts({ per_page: -1 }),
      canLoadMerchants.value ? listMerchants({ per_page: -1 }) : Promise.resolve([]),
      listResource('categories', { per_page: -1 }),
      listResource('brands', { per_page: -1 }),
      listWarehouses({ per_page: -1 }),
    ])
    products.value = normalizeList(productResponse)
    merchants.value = normalizeList(merchantResponse)
    categories.value = normalizeList(categoryResponse)
    brands.value = normalizeList(brandResponse)
    warehouses.value = normalizeList(warehouseResponse)
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
</script>

<template>
  <PageHeader :title="t('inventory.productItemsTitle')" :description="t('inventory.productItemsDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" :to="{ name: 'product-items.create' }">{{ t('actions.create') }}</BaseButton>
    </template>
  </PageHeader>
  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('sales.searchProductsPlaceholder')" @search="list.applySearch" @refresh="list.load" />
  <CrudFilterPanel :active-count="activeFiltersCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters">
    <FormInput id="item-sku-filter" v-model="filters.sku" :label="t('crud.sku')" />
    <FormInput id="item-barcode-filter" v-model="filters.barcode" :label="t('crud.barcode')" />
    <BaseSelect id="item-product-filter" v-model="filters.product_id" :label="t('crud.product')" :options="productOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect v-if="canLoadMerchants" id="item-merchant-filter" v-model="filters.merchant_id" :label="t('crud.merchant')" :options="merchantOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="item-category-filter" v-model="filters.category_id" :label="t('crud.category')" :options="categoryOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="item-brand-filter" v-model="filters.brand_id" :label="t('crud.brand')" :options="brandOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="item-warehouse-filter" v-model="filters.warehouse_id" :label="t('crud.warehouse')" :options="warehouseOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="item-active-filter" v-model="filters.is_active" :label="t('crud.status')" :options="statusOptions" />
    <BaseSelect id="item-trashed-filter" v-model="filters.trashed" :label="t('crud.deletedRecords')" :options="trashedOptions" />
    <DateInput id="item-created-from-filter" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="item-created-to-filter" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>
  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value" :sort-column="list.sortColumn.value" :sort-direction="list.sortDirection.value" @sort="list.sortBy">
    <template #cell-product="{ row }">{{ displayName(row.product) }}</template>
    <template #cell-merchant="{ row }">{{ row.merchant?.name ?? '—' }}</template>
    <template #cell-option_values="{ row }">
      <div v-if="groupedOptionValues(row).length" class="flex min-w-48 max-w-80 flex-wrap gap-1.5">
        <div
          v-for="group in groupedOptionValues(row)"
          :key="group.key"
          class="inline-flex max-w-full items-center overflow-hidden rounded-full border border-primary/15 bg-background shadow-sm"
        >
          <span class="shrink-0 bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
            {{ group.label }}
          </span>
          <span class="truncate border-s border-primary/10 px-2.5 py-1 text-xs font-medium text-text">
            {{ group.values.join(' - ') }}
          </span>
        </div>
      </div>
      <span v-else>—</span>
    </template>
    <template #cell-current_price="{ value }">{{ formatNumber(value as string | number | null) }}</template>
    <template #cell-is_active="{ row }"><ActiveStatusSwitch :row="row" :can-toggle="canToggle" :toggle="toggleProductItem" :data-testid="`product-item-status-${row.id}`" /></template>
    <template #cell-actions="{ row }">
      <div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton v-if="canView" :loading="detailsLoadingId === row.id" :disabled="detailsLoading" @click="openDetails(row.id)" />
        <RowActions :can-edit="canUpdate" :can-delete="canDelete" :edit-to="{ name: 'product-items.edit', params: { id: row.id } }" :delete-disabled="list.mutating.value" @delete="selectedId = row.id" />
      </div>
    </template>
  </DataTable>
  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />
  <ConfirmDialog :open="selectedId !== null" :title="t('inventory.deleteProductItem')" :message="t('inventory.deleteProductItemMessage')" :confirm-label="t('actions.delete')" @close="selectedId = null" @confirm="confirmDelete" />

  <CrudDetailsModal :open="detailsOpen" :title="selectedItem?.sku ?? t('details.productItemDetails')" :subtitle="t('details.details')" :loading="detailsLoading" :error-message="detailsError" @close="closeDetails">
    <div v-if="selectedItem" class="grid gap-4">
      <DetailsSection :title="t('details.mainInformation')">
        <dl class="grid gap-3 md:grid-cols-3">
          <DetailsField :label="t('table.sku')" :value="selectedItem.sku" />
          <DetailsField :label="t('table.price')" :value="formatNumber(selectedItem.current_price)" />
          <DetailsField :label="t('table.stock')" :value="formatNumber(selectedItem.total_stock)" />
          <DetailsField :label="t('table.status')"><DetailsBadge :value="selectedItem.is_active" /></DetailsField>
          <DetailsField :label="t('table.createdAt')" :value="formatDate(selectedItem.created_at)" />
        </dl>
      </DetailsSection>

      <DetailsSection :title="t('table.barcode')">
        <div class="max-w-md">
          <DetailsImage :src="selectedItem.barcode" :alt="selectedItem.sku" contain />
        </div>
      </DetailsSection>

      <DetailsSection :title="t('table.product')">
        <div class="grid gap-3 md:grid-cols-2">
          <RelationshipCard :title="displayName(selectedItem.product)" :subtitle="selectedItem.product?.description ?? t('details.noRelatedData')">
            <template #badge><DetailsBadge :value="selectedItem.product?.is_active" /></template>
            <DetailsField :label="t('table.category')" :value="displayName(selectedItem.product?.category)" />
            <DetailsField :label="t('table.brand')" :value="displayName(selectedItem.product?.brand)" />
          </RelationshipCard>
          <RelationshipCard :title="selectedItem.merchant?.name ?? t('details.noRelatedData')" :subtitle="selectedItem.merchant?.email ?? selectedItem.merchant?.phone">
            <template #badge><DetailsBadge :value="selectedItem.merchant?.is_active" /></template>
          </RelationshipCard>
        </div>
      </DetailsSection>

      <DetailsSection :title="t('details.attributes')">
        <DetailsTable :columns="optionColumns" :rows="selectedItem.option_values ?? []" :empty-text="t('details.noRelatedData')">
          <template #cell-product_option="{ value }">{{ displayName(value as never) }}</template>
          <template #cell-is_active="{ value }"><DetailsBadge :value="value as unknown as boolean" /></template>
        </DetailsTable>
      </DetailsSection>

      <DetailsSection :title="t('details.prices')">
        <DetailsTable :columns="priceColumns" :rows="(selectedItem.prices ?? []) as Record<string, unknown>[]" :empty-text="t('details.noRelatedData')">
          <template #cell-price="{ value }">{{ formatNumber(value as string) }}</template>
          <template #cell-valid_from="{ value }">{{ formatDate(value as string) }}</template>
          <template #cell-valid_to="{ value }">{{ formatDate(value as string) }}</template>
          <template #cell-is_active="{ value }"><DetailsBadge :value="value as boolean" /></template>
        </DetailsTable>
      </DetailsSection>

      <DetailsSection :title="t('inventory.images')">
        <div v-if="selectedItem.images?.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailsImage v-for="image in selectedItem.images" :key="image.id" :src="image.path" :alt="image.name" />
        </div>
        <p v-else class="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-sm text-text-muted">{{ t('details.noImage') }}</p>
      </DetailsSection>

      <DetailsSection :title="t('inventory.warehouseQuantities')">
        <DetailsTable :columns="stockColumns" :rows="selectedItem.stocks ?? []" :empty-text="t('details.noRelatedData')">
          <template #cell-warehouse="{ row }">{{ displayName(row.warehouse) }}</template>
          <template #cell-quantity="{ value }">{{ formatNumber(value as number) }}</template>
          <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
        </DetailsTable>
      </DetailsSection>
    </div>
  </CrudDetailsModal>
</template>
