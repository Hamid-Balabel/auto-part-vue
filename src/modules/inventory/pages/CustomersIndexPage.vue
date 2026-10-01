<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalizedName } from '@/composables/useLocalizedName'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useCrudList } from '@/composables/useCrudList'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { listCountries } from '@/modules/data-entry/api'
import type { Country } from '@/modules/data-entry/types'
import { deleteCustomer, listCustomers, toggleCustomer } from '../api'
import type { Customer } from '../types'

const { t } = useI18n()
const localizedName = useLocalizedName()
const toast = useToastStore()
const permissions = useResourcePermissions('customer')
const canCreate = permissions.canCreate
const canUpdate = permissions.canUpdate
const canDelete = permissions.canDelete
const canToggle = permissions.canToggle
const selectedId = ref<number | null>(null)
const countries = ref<Country[]>([])
const lookupsLoading = ref(false)
const emptyFilters = () => ({
  name: '',
  email: '',
  phone: '',
  phone_code_id: null as number | null,
  has_orders: '',
  is_active: '',
  trashed: '',
  created_from: '',
  created_to: '',
})
const filters = reactive(emptyFilters())
const appliedFilters = reactive(emptyFilters())
const list = useCrudList<Customer>({
  list: (query) => listCustomers({
    ...query,
    ...(appliedFilters.name ? { name: appliedFilters.name } : {}),
    ...(appliedFilters.email ? { email: appliedFilters.email } : {}),
    ...(appliedFilters.phone ? { phone: appliedFilters.phone } : {}),
    ...(appliedFilters.phone_code_id ? { phone_code_id: appliedFilters.phone_code_id } : {}),
    ...(appliedFilters.has_orders ? { has_orders: appliedFilters.has_orders } : {}),
    ...(appliedFilters.is_active ? { is_active: appliedFilters.is_active } : {}),
    ...(appliedFilters.trashed ? { trashed: appliedFilters.trashed as 'with' | 'only' } : {}),
    ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}),
    ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}),
  }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const columns = computed<DataTableColumn<Customer>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'name', label: t('table.name'), sortable: true },
  { key: 'email', label: t('admin.email') },
  { key: 'phone', label: t('admin.phone') },
  { key: 'is_active', label: t('table.status') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter((value) => value !== '' && value !== null).length)
const countryOptions = computed(() => countries.value.map((country) => ({
  value: country.id,
  label: `${country.phone_code} - ${localizedName(country, country.code)}`,
  searchText: [country.phone_code, country.translation_name, country.name.ar, country.name.en, country.code].filter(Boolean).join(' '),
})))
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

async function confirmDelete() {
  if (!selectedId.value) return
  await list.mutate(async () => {
    await deleteCustomer(selectedId.value as number)
    toast.success(t('crud.deleted'))
  })
  selectedId.value = null
}

async function loadLookups() {
  lookupsLoading.value = true
  try {
    const response = await listCountries({ per_page: -1 })
    countries.value = Array.isArray(response) ? response : response.data
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
  <PageHeader :title="t('inventory.customersTitle')" :description="t('inventory.customersDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" :to="{ name: 'customers.create' }">{{ t('actions.create') }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('crud.searchPlaceholder')" @search="list.applySearch" @refresh="list.load" />

  <CrudFilterPanel :active-count="activeFiltersCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters">
    <FormInput id="customer-name-filter" v-model="filters.name" :label="t('table.name')" />
    <FormInput id="customer-email-filter" v-model="filters.email" :label="t('crud.email')" />
    <FormInput id="customer-phone-filter" v-model="filters.phone" :label="t('crud.phone')" />
    <BaseSelect id="customer-country-code-filter" v-model="filters.phone_code_id" :label="t('crud.countryCode')" :options="countryOptions" :placeholder="t('crud.all')" :loading="lookupsLoading" searchable clearable />
    <BaseSelect id="customer-orders-filter" v-model="filters.has_orders" :label="t('crud.hasOrders')" :options="booleanOptions" />
    <BaseSelect id="customer-active-filter" v-model="filters.is_active" :label="t('crud.status')" :options="statusOptions" />
    <BaseSelect id="customer-trashed-filter" v-model="filters.trashed" :label="t('crud.deletedRecords')" :options="trashedOptions" />
    <DateInput id="customer-created-from-filter" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="customer-created-to-filter" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>

  <DataTable
    :columns="columns"
    :rows="list.rows.value"
    :loading="list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    @sort="list.sortBy"
  >
    <template #cell-phone="{ row }">
      <span>{{ [row.phone_code, row.phone].filter(Boolean).join(' ') || '-' }}</span>
    </template>
    <template #cell-is_active="{ row }">
      <ActiveStatusSwitch :row="row" :can-toggle="canToggle" :toggle="toggleCustomer" :data-testid="`customer-status-${row.id}`" />
    </template>
    <template #cell-actions="{ row }">
      <RowActions
        :can-edit="canUpdate"
        :can-delete="canDelete"
        :edit-to="{ name: 'customers.edit', params: { id: row.id } }"
        :delete-disabled="list.mutating.value"
        @delete="selectedId = row.id"
      />
    </template>
  </DataTable>

  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />

  <ConfirmDialog
    :open="selectedId !== null"
    :title="t('inventory.deleteCustomer')"
    :message="t('inventory.deleteCustomerMessage')"
    :confirm-label="t('actions.delete')"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />
</template>
