<script setup lang="ts">
import { useLocalizedName } from "@/composables/useLocalizedName";
import { computed, onMounted, reactive, ref, watch } from 'vue'
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
import DetailsSection from '@/components/ui/DetailsSection.vue'
import DetailsTable, { type DetailsTableColumn } from '@/components/ui/DetailsTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RelationshipCard from '@/components/ui/RelationshipCard.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { ApiError } from '@/api/http'
import { useCrudList } from '@/composables/useCrudList'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { listCategoryTree, listResource } from '@/modules/data-entry/api'
import { categoryPathFromMap, categoryTreeRowsToOptions, categoryTreeRowsToPathMap, flattenCategoryTree } from '@/modules/data-entry/utils/categoryTree'
import type { Brand, CategoryTreeNode } from '@/modules/data-entry/types'
import { deleteProduct, getProduct, listProducts, toggleProduct } from '../api'
import type { Product, ProductItem } from '../types'

const { t, locale } = useI18n()
const displayName = useLocalizedName();
const toast = useToastStore()
const permissions = useResourcePermissions('product')
const canCreate = permissions.canCreate
const canView = permissions.canView
const canUpdate = permissions.canUpdate
const canDelete = permissions.canDelete
const canToggle = permissions.canToggle
const selectedId = ref<number | null>(null)
const detailsOpen = ref(false)
const detailsLoading = ref(false)
const detailsLoadingId = ref<number | null>(null)
const detailsError = ref('')
const selectedProduct = ref<Product | null>(null)
const categories = ref<CategoryTreeNode[]>([])
const brands = ref<Brand[]>([])
const lookupsLoading = ref(false)
const emptyFilters = () => ({
  category_id: null as number | null,
  brand_id: null as number | null,
  has_items: '',
  sku: '',
  barcode: '',
  is_active: '',
  trashed: '',
  created_from: '',
  created_to: '',
})
const filters = reactive(emptyFilters())
const appliedFilters = reactive(emptyFilters())
let detailsRequestId = 0
const list = useCrudList<Product>({
  list: (query) => listProducts({
    ...query,
    ...(appliedFilters.category_id ? { category_id: appliedFilters.category_id } : {}),
    ...(appliedFilters.brand_id ? { brand_id: appliedFilters.brand_id } : {}),
    ...(appliedFilters.has_items ? { has_items: appliedFilters.has_items } : {}),
    ...(appliedFilters.sku ? { sku: appliedFilters.sku } : {}),
    ...(appliedFilters.barcode ? { barcode: appliedFilters.barcode } : {}),
    ...(appliedFilters.is_active ? { is_active: appliedFilters.is_active } : {}),
    ...(appliedFilters.trashed ? { trashed: appliedFilters.trashed as 'with' | 'only' } : {}),
    ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}),
    ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}),
  }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const columns = computed<DataTableColumn<Product>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'name', label: t('table.name') },
  { key: 'category', label: t('table.category') },
  { key: 'brand', label: t('table.brand') },
  { key: 'is_active', label: t('table.status') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const itemColumns = computed<DetailsTableColumn<ProductItem>[]>(() => [
  { key: 'sku', label: t('table.sku') },
  { key: 'current_price', label: t('table.price') },
  { key: 'total_stock', label: t('table.stock') },
  { key: 'option_values', label: t('details.attributes') },
  { key: 'images', label: t('inventory.images') },
  { key: 'stocks', label: t('inventory.warehouseQuantities') },
  { key: 'is_active', label: t('table.status') },
  { key: 'created_at', label: t('table.createdAt') },
])
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter((value) => value !== '' && value !== null).length)
const categoryRows = computed(() => flattenCategoryTree(categories.value, locale.value, t('dataEntry.rootCategory')))
const categoryPathMap = computed(() => categoryTreeRowsToPathMap(categoryRows.value))
const categoryOptions = computed(() => categoryTreeRowsToOptions(categoryRows.value, locale.value))
const brandOptions = computed(() => brands.value.map((brand) => ({ value: brand.id, label: displayName(brand) })))
const booleanOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'true', label: t('crud.yes') },
  { value: 'false', label: t('crud.no') },
])
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


function categoryPath(category?: Product['category'] | null) {
  return categoryPathFromMap(category, categoryPathMap.value, locale.value)
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
  selectedProduct.value = null
  const requestId = ++detailsRequestId
  try {
    const product = await getProduct(id)
    if (requestId === detailsRequestId && detailsOpen.value) selectedProduct.value = product
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
  selectedProduct.value = null
  detailsError.value = ''
}

async function confirmDelete() {
  if (!selectedId.value) return
  await list.mutate(async () => {
    await deleteProduct(selectedId.value as number)
    toast.success(t('crud.deleted'))
  })
  selectedId.value = null
}

async function loadLookups() {
  lookupsLoading.value = true
  try {
    const [categoryResponse, brandResponse] = await Promise.all([
      listCategoryTree(),
      listResource('brands', { per_page: -1 }),
    ])
    categories.value = categoryResponse
    brands.value = Array.isArray(brandResponse) ? brandResponse : brandResponse.data
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
  if (detailsOpen.value && selectedProduct.value) void openDetails(selectedProduct.value.id)
})
</script>

<template>
  <PageHeader :title="t('inventory.productsTitle')" :description="t('inventory.productsDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" variant="secondary" :to="{ name: 'products.create-with-items' }">{{ t('inventory.createProductWithItems') }}</BaseButton>
      <BaseButton v-if="canCreate" :to="{ name: 'products.create' }">{{ t('actions.create') }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('inventory.searchProducts')" @search="list.applySearch" @refresh="list.load" />

  <CrudFilterPanel :active-count="activeFiltersCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters">
    <BaseSelect id="product-category-filter" v-model="filters.category_id" :label="t('crud.category')" :options="categoryOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="product-brand-filter" v-model="filters.brand_id" :label="t('crud.brand')" :options="brandOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="product-items-filter" v-model="filters.has_items" :label="t('crud.hasItems')" :options="booleanOptions" />
    <FormInput id="product-sku-filter" v-model="filters.sku" :label="t('crud.sku')" />
    <FormInput id="product-barcode-filter" v-model="filters.barcode" :label="t('crud.barcode')" />
    <BaseSelect id="product-active-filter" v-model="filters.is_active" :label="t('crud.status')" :options="statusOptions" />
    <BaseSelect id="product-trashed-filter" v-model="filters.trashed" :label="t('crud.deletedRecords')" :options="trashedOptions" />
    <DateInput id="product-created-from-filter" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="product-created-to-filter" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>

  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value" :sort-column="list.sortColumn.value" :sort-direction="list.sortDirection.value" @sort="list.sortBy">
    <template #cell-name="{ row }">{{ displayName(row) }}</template>
    <template #cell-category="{ row }">
      <span class="block max-w-72 truncate text-sm font-medium text-text" :title="categoryPath(row.category)">{{ categoryPath(row.category) }}</span>
    </template>
    <template #cell-brand="{ row }">{{ displayName(row.brand) }}</template>
    <template #cell-is_active="{ row }"><ActiveStatusSwitch :row="row" :can-toggle="canToggle" :toggle="toggleProduct" :data-testid="`product-status-${row.id}`" /></template>
    <template #cell-actions="{ row }">
      <div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton v-if="canView" :loading="detailsLoadingId === row.id" :disabled="detailsLoading" @click="openDetails(row.id)" />
        <RowActions :can-edit="canUpdate" :can-delete="canDelete" :edit-to="{ name: 'products.edit', params: { id: row.id } }" :delete-disabled="list.mutating.value" @delete="selectedId = row.id" />
      </div>
    </template>
  </DataTable>
  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />
  <ConfirmDialog :open="selectedId !== null" :title="t('inventory.deleteProduct')" :message="t('inventory.deleteProductMessage')" :confirm-label="t('actions.delete')" @close="selectedId = null" @confirm="confirmDelete" />

  <CrudDetailsModal :open="detailsOpen" :title="selectedProduct ? displayName(selectedProduct) : t('details.productDetails')" :subtitle="t('details.details')" :loading="detailsLoading" :error-message="detailsError" @close="closeDetails">
    <div v-if="selectedProduct" class="grid gap-4">
      <DetailsSection :title="t('details.mainInformation')">
        <dl class="grid gap-3 md:grid-cols-3">
          <DetailsField :label="t('table.name')" :value="displayName(selectedProduct)" />
          <DetailsField :label="t('dataEntry.nameAr')" :value="selectedProduct.translation_name?.ar" />
          <DetailsField :label="t('dataEntry.nameEn')" :value="selectedProduct.translation_name?.en" />
          <DetailsField class="md:col-span-3" :label="t('table.description')" :value="selectedProduct.description" />
          <DetailsField :label="t('table.status')"><DetailsBadge :value="selectedProduct.is_active" /></DetailsField>
          <DetailsField :label="t('table.createdAt')" :value="formatDate(selectedProduct.created_at)" />
        </dl>
      </DetailsSection>

      <DetailsSection :title="t('details.relatedInformation')">
        <div class="grid gap-3 md:grid-cols-2">
          <RelationshipCard :title="categoryPath(selectedProduct.category)" :subtitle="selectedProduct.category?.description ?? t('details.noRelatedData')">
            <template #badge><DetailsBadge :value="selectedProduct.category?.is_active" /></template>
          </RelationshipCard>
          <RelationshipCard :title="displayName(selectedProduct.brand)" :subtitle="selectedProduct.brand?.description ?? t('details.noRelatedData')">
            <template #badge><DetailsBadge :value="selectedProduct.brand?.is_active" /></template>
          </RelationshipCard>
        </div>
      </DetailsSection>

      <DetailsSection :title="t('inventory.productItemsTitle')">
        <DetailsTable :columns="itemColumns" :rows="selectedProduct.product_items ?? []" :empty-text="t('details.noRelatedData')">
          <template #cell-current_price="{ value }">{{ formatNumber(value as string | number | null) }}</template>
          <template #cell-total_stock="{ value }">{{ formatNumber(value as string | number | null) }}</template>
          <template #cell-option_values="{ value }">{{ Array.isArray(value) && value.length ? ((value as ProductItem['option_values']) ?? []).map((item) => displayName(item)).join(', ') : t('details.noRelatedData') }}</template>
          <template #cell-images="{ value }">{{ Array.isArray(value) ? formatNumber(value.length) : '—' }}</template>
          <template #cell-stocks="{ value }">{{ Array.isArray(value) && value.length ? ((value as ProductItem['stocks']) ?? []).map((stock) => `${displayName(stock.warehouse)}: ${formatNumber(stock.quantity)}`).join(', ') : t('details.noRelatedData') }}</template>
          <template #cell-is_active="{ value }"><DetailsBadge :value="value as boolean" /></template>
          <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
        </DetailsTable>
      </DetailsSection>

      <DetailsSection :title="t('details.creator')">
        <RelationshipCard :title="selectedProduct.creator?.name ?? t('details.noRelatedData')" :subtitle="selectedProduct.creator?.email">
          <template #badge><DetailsBadge :value="selectedProduct.creator?.is_active" /></template>
          <DetailsField :label="t('table.createdAt')" :value="formatDate(selectedProduct.creator?.created_at)" />
        </RelationshipCard>
      </DetailsSection>
    </div>
  </CrudDetailsModal>
</template>
