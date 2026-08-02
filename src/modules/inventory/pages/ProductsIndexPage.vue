<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
import CrudDetailsModal from '@/components/ui/CrudDetailsModal.vue'
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
import { deleteProduct, getProduct, listProducts, toggleProduct } from '../api'
import type { Product, ProductItem } from '../types'

const { t, locale } = useI18n()
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
let detailsRequestId = 0
const list = useCrudList<Product>({ list: listProducts, defaultSortColumn: 'id', defaultSortDirection: 'desc' })

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
  { key: 'merchant', label: t('inventory.merchant') },
  { key: 'current_price', label: t('table.price') },
  { key: 'total_stock', label: t('table.stock') },
  { key: 'option_values', label: t('details.attributes') },
  { key: 'images', label: t('inventory.images') },
  { key: 'stocks', label: t('inventory.warehouseQuantities') },
  { key: 'is_active', label: t('table.status') },
  { key: 'created_at', label: t('table.createdAt') },
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

onMounted(list.load)
</script>

<template>
  <PageHeader :title="t('inventory.productsTitle')" :description="t('inventory.productsDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" variant="secondary" :to="{ name: 'products.create-with-items' }">{{ t('inventory.createProductWithItems') }}</BaseButton>
      <BaseButton v-if="canCreate" :to="{ name: 'products.create' }">{{ t('actions.create') }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar :loading="list.loading.value" :search-disabled="true" :search-placeholder="t('crud.searchUnavailable')" @refresh="list.load" />

  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value" :sort-column="list.sortColumn.value" :sort-direction="list.sortDirection.value" @sort="list.sortBy">
    <template #cell-category="{ row }">{{ displayName(row.category) }}</template>
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
          <RelationshipCard :title="displayName(selectedProduct.category)" :subtitle="selectedProduct.category?.description ?? t('details.noRelatedData')">
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
          <template #cell-merchant="{ row }">{{ row.merchant?.name ?? '—' }}</template>
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
