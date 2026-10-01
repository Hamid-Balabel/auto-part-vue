<script setup lang="ts">
import { useLocalizedName } from "@/composables/useLocalizedName";
import { History } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudDetailsModal from '@/components/ui/CrudDetailsModal.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudShowButton from '@/components/ui/CrudShowButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
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
import { usePermissions } from '@/composables/usePermissions'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import {
  deleteWarehouse,
  getWarehouse,
  listBranches,
  listProductItems,
  listWarehouses,
  toggleWarehouse,
} from '../api'
import type { Branch, ProductItem, Warehouse } from '../types'

const { t, locale } = useI18n()
const displayName = useLocalizedName();
const toast = useToastStore()
const auth = useAuthStore()
const permissions = useResourcePermissions('warehouse')
const { can } = usePermissions()
const canCreate = computed(
  () => permissions.canCreate.value && auth.canReadBranches,
)
const canView = permissions.canView
const canUpdate = computed(
  () => permissions.canUpdate.value && auth.canReadBranches,
)
const canDelete = permissions.canDelete
const canToggle = permissions.canToggle
const canReadTransferLogs = computed(() => can('read-stock-transfer'))
const selectedId = ref<number | null>(null)
const branches = ref<Branch[]>([])
const productItems = ref<ProductItem[]>([])
const lookupsLoading = ref(false)
const emptyFilters = () => ({
  address: '',
  branch_id: null as number | null,
  has_stock: '',
  item_id: null as number | null,
  is_active: '',
  trashed: '',
  created_from: '',
  created_to: '',
})
const filters = reactive(emptyFilters())
const appliedFilters = reactive(emptyFilters())
const detailsOpen = ref(false)
const detailsLoading = ref(false)
const detailsLoadingId = ref<number | null>(null)
const detailsError = ref('')
const selectedWarehouse = ref<Warehouse | null>(null)
let detailsRequestId = 0
const list = useCrudList<Warehouse>({
  list: (query) =>
    listWarehouses({
      ...query,
      ...(appliedFilters.address ? { address: appliedFilters.address } : {}),
      ...(appliedFilters.branch_id ? { branch_id: appliedFilters.branch_id } : {}),
      ...(appliedFilters.has_stock ? { has_stock: appliedFilters.has_stock } : {}),
      ...(appliedFilters.item_id ? { item_id: appliedFilters.item_id } : {}),
      ...(appliedFilters.is_active ? { is_active: appliedFilters.is_active } : {}),
      ...(appliedFilters.trashed ? { trashed: appliedFilters.trashed as 'with' | 'only' } : {}),
      ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}),
      ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}),
    }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const columns = computed<DataTableColumn<Warehouse>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'name', label: t('table.name'), sortable: true },
  { key: 'branch', label: t('inventory.branch') },
  { key: 'address', label: t('table.address'), sortable: true },
  { key: 'is_current', label: t('inventory.currentBranchWarehouse') },
  { key: 'is_active', label: t('table.status'), sortable: true },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const branchOptions = computed(() =>
  branches.value.map((branch) => ({
    value: branch.id,
    label: displayName(branch),
    description: branch.address || undefined,
  })),
)
const productItemOptions = computed(() => productItems.value.map((item) => ({
  value: item.id,
  label: `${displayName(item.product)} - ${item.sku}`,
  searchText: [item.sku, item.product?.name, item.product?.translation_name?.ar, item.product?.translation_name?.en].filter(Boolean).join(' '),
})))
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter((value) => value !== '' && value !== null).length)
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


function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—'
}

async function openDetails(id: number) {
  if (detailsLoading.value) return
  detailsOpen.value = true
  detailsLoading.value = true
  detailsLoadingId.value = id
  detailsError.value = ''
  selectedWarehouse.value = null
  const requestId = ++detailsRequestId
  try {
    const warehouse = await getWarehouse(id)
    if (requestId === detailsRequestId && detailsOpen.value)
      selectedWarehouse.value = warehouse
  } catch (error) {
    if (requestId === detailsRequestId)
      detailsError.value =
        error instanceof ApiError ? error.message : t('details.failedToLoad')
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
  detailsError.value = ''
  selectedWarehouse.value = null
}

async function confirmDelete() {
  if (!selectedId.value) return
  try {
    await list.mutate(async () => {
      await deleteWarehouse(selectedId.value as number)
      toast.success(t('crud.deleted'))
    })
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : t('inventory.warehouseDeleteFailed'))
  } finally {
    selectedId.value = null
  }
}

function normalizeList<T>(response: T[] | { data: T[] }) {
  return Array.isArray(response) ? response : response.data
}

async function loadLookups() {
  lookupsLoading.value = true
  try {
    const [branchResponse, itemResponse] = await Promise.all([
      auth.canReadBranches ? listBranches({ per_page: -1 }) : Promise.resolve([]),
      listProductItems({ per_page: -1 }),
    ])
    branches.value = normalizeList(branchResponse)
    productItems.value = normalizeList(itemResponse)
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
  if (detailsOpen.value && selectedWarehouse.value) void openDetails(selectedWarehouse.value.id)
})
</script>

<template>
  <PageHeader
    :title="t('inventory.warehousesTitle')"
    :description="t('inventory.warehousesDescription')"
  >
    <template #actions>
      <BaseButton v-if="canCreate" :to="{ name: 'warehouses.create' }">{{
        t('actions.create')
      }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar
    :search="list.search.value"
    :loading="list.loading.value"
    :search-placeholder="t('inventory.searchWarehouses')"
    @search="list.applySearch"
    @refresh="list.load"
  />

  <CrudFilterPanel :active-count="activeFiltersCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters">
    <FormInput id="warehouse-address-filter" v-model="filters.address" :label="t('crud.address')" />
    <BaseSelect
      v-if="auth.canReadBranches"
      id="warehouse-branch-filter"
      v-model="filters.branch_id"
      :label="t('crud.branch')"
      :options="branchOptions"
      :placeholder="t('crud.all')"
      :loading="lookupsLoading"
      searchable
      clearable
    />
    <BaseSelect id="warehouse-stock-filter" v-model="filters.has_stock" :label="t('crud.hasStock')" :options="booleanOptions" />
    <BaseSelect id="warehouse-item-filter" v-model="filters.item_id" :label="t('crud.productItem')" :options="productItemOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="warehouse-active-filter" v-model="filters.is_active" :label="t('crud.status')" :options="statusOptions" />
    <BaseSelect id="warehouse-trashed-filter" v-model="filters.trashed" :label="t('crud.deletedRecords')" :options="trashedOptions" />
    <DateInput id="warehouse-created-from-filter" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="warehouse-created-to-filter" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>

  <DataTable
    :columns="columns"
    :rows="list.rows.value"
    :loading="list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    @sort="list.sortBy"
  >
    <template #cell-name="{ row }">{{ displayName(row) }}</template>
    <template #cell-branch="{ row }">{{ displayName(row.branch) }}</template>
    <template #cell-is_current="{ row }">
      <BaseBadge :variant="row.is_current ? 'primary' : 'neutral'">{{
        t(row.is_current ? 'inventory.currentBranchWarehouse' : 'inventory.otherBranchWarehouse')
      }}</BaseBadge>
    </template>
    <template #cell-is_active="{ row }">
      <ActiveStatusSwitch
        :row="row"
        :can-toggle="canToggle"
        :toggle="toggleWarehouse"
        :data-testid="`warehouse-status-${row.id}`"
      />
    </template>
    <template #cell-actions="{ row }">
      <div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton
          v-if="canView"
          :loading="detailsLoadingId === row.id"
          :disabled="detailsLoading"
          @click="openDetails(row.id)"
        />
        <BaseButton
          v-if="canReadTransferLogs"
          variant="ghost"
          size="sm"
          :to="{ name: 'stock-transfer-logs.index', query: { warehouse_id: row.id } }"
          :aria-label="t('stockTransferLogs.viewWarehouseMovements')"
          :title="t('stockTransferLogs.viewWarehouseMovements')"
        >
          <History class="size-4" aria-hidden="true" />
          <span class="sr-only">{{ t('stockTransferLogs.viewWarehouseMovements') }}</span>
        </BaseButton>
        <RowActions
          :can-edit="canUpdate"
          :can-delete="canDelete"
          :edit-to="{ name: 'warehouses.edit', params: { id: row.id } }"
          :delete-disabled="list.mutating.value"
          @delete="selectedId = row.id"
        />
      </div>
    </template>
  </DataTable>

  <Pagination
    v-if="list.pageData.value"
    :meta="list.pageData.value"
    @change="list.changePage"
  />

  <ConfirmDialog
    :open="selectedId !== null"
    :title="t('inventory.deleteWarehouse')"
    :message="t('inventory.deleteWarehouseMessage')"
    :confirm-label="t('actions.delete')"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />

  <CrudDetailsModal
    :open="detailsOpen"
    :title="selectedWarehouse ? displayName(selectedWarehouse) : t('details.warehouseDetails')"
    :subtitle="t('details.details')"
    :loading="detailsLoading"
    :error-message="detailsError"
    @close="closeDetails"
  >
    <div v-if="selectedWarehouse" class="grid gap-4">
      <DetailsSection :title="t('details.mainInformation')">
        <dl class="grid gap-3 md:grid-cols-3">
          <DetailsField :label="t('table.name')" :value="displayName(selectedWarehouse)" />
          <DetailsField :label="t('dataEntry.nameAr')" :value="selectedWarehouse.translation_name?.ar" />
          <DetailsField :label="t('dataEntry.nameEn')" :value="selectedWarehouse.translation_name?.en" />
          <DetailsField :label="t('table.address')" :value="selectedWarehouse.address" />
          <DetailsField :label="t('table.status')"><DetailsBadge :value="selectedWarehouse.is_active" /></DetailsField>
          <DetailsField :label="t('inventory.currentBranchWarehouse')">
            <BaseBadge :variant="selectedWarehouse.is_current ? 'primary' : 'neutral'">{{
              t(selectedWarehouse.is_current ? 'inventory.currentBranchWarehouse' : 'inventory.otherBranchWarehouse')
            }}</BaseBadge>
          </DetailsField>
          <DetailsField class="md:col-span-2" :label="t('table.description')" :value="selectedWarehouse.description" />
          <DetailsField :label="t('table.createdAt')" :value="formatDate(selectedWarehouse.created_at)" />
        </dl>
      </DetailsSection>
      <DetailsSection :title="t('details.relatedInformation')">
        <RelationshipCard
          :title="displayName(selectedWarehouse.branch)"
          :subtitle="selectedWarehouse.branch?.address"
        >
          <template #badge><DetailsBadge :value="selectedWarehouse.branch?.is_active" /></template>
          <DetailsField :label="t('inventory.currentBranch')">
            <BaseBadge :variant="selectedWarehouse.branch?.is_current ? 'primary' : 'neutral'">{{
              t(selectedWarehouse.branch?.is_current ? 'inventory.currentBranch' : 'inventory.notCurrentBranch')
            }}</BaseBadge>
          </DetailsField>
        </RelationshipCard>
      </DetailsSection>
    </div>
  </CrudDetailsModal>
</template>
