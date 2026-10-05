<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/http'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudShowButton from '@/components/ui/CrudShowButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useCrudList } from '@/composables/useCrudList'
import { listParties } from '@/modules/inventory/api'
import type { Party } from '@/modules/inventory/types'
import { useToastStore } from '@/stores/toast'
import { listPurchases } from '../api'
import type { Purchase } from '../types'

const { t, locale } = useI18n()
const toast = useToastStore()
const suppliers = ref<Party[]>([])
const suppliersLoading = ref(false)
const filters = reactive({ party_id: null as number | null, payment_status: '', created_from: '', created_to: '' })
const appliedFilters = reactive({ ...filters })
const list = useCrudList<Purchase>({ list: (query) => listPurchases({ ...query, ...(appliedFilters.party_id ? { party_id: appliedFilters.party_id } : {}), ...(appliedFilters.payment_status ? { payment_status: appliedFilters.payment_status } : {}), ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}), ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}) }) })
const columns = computed<DataTableColumn<Purchase>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'supplier', label: t('parties.supplier') },
  { key: 'total', label: t('sales.total'), sortable: true },
  { key: 'paid_amount', label: t('sales.paidAmount'), sortable: true },
  { key: 'remaining_amount', label: t('sales.remainingAmount'), sortable: true },
  { key: 'payment_status', label: t('sales.paymentStatus'), sortable: true },
  { key: 'created_at', label: t('table.createdAt'), sortable: true },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const supplierOptions = computed(() => suppliers.value.map((party) => ({ value: party.id, label: party.name, description: party.phone ?? party.email ?? undefined, searchText: [party.name, party.phone, party.email].filter(Boolean).join(' ') })))
const paymentStatusOptions = computed(() => ['', 'pending', 'partial', 'paid'].map((value) => ({ value, label: value ? t(`sales.paymentStatuses.${value}`) : t('crud.all') })))
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter(Boolean).length)
function displaySupplier(purchase: Purchase) { return purchase.supplier_party?.name ?? purchase.party?.name ?? '—' }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—' }
function applyFilters() { Object.assign(appliedFilters, filters); list.page.value = 1; void list.load() }
function resetFilters() { Object.assign(filters, { party_id: null, payment_status: '', created_from: '', created_to: '' }); Object.assign(appliedFilters, filters); list.page.value = 1; void list.load() }
async function loadSuppliers() { suppliersLoading.value = true; try { const response = await listParties({ per_page: -1, classification: 'supplier', is_active: true }); suppliers.value = Array.isArray(response) ? response : response.data } catch (e) { if (e instanceof ApiError) toast.error(e.message) } finally { suppliersLoading.value = false } }
onMounted(() => { void list.load(); void loadSuppliers() })
</script>

<template>
  <PageHeader :title="t('purchases.title')" :description="t('purchases.description')" />
  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('purchases.search')" @search="list.applySearch" @refresh="list.load" />
  <CrudFilterPanel :active-count="activeFiltersCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters">
    <BaseSelect id="purchase-supplier-filter" v-model="filters.party_id" :label="t('parties.supplier')" :options="supplierOptions" :loading="suppliersLoading" :placeholder="t('crud.all')" searchable clearable />
    <BaseSelect id="purchase-payment-status" v-model="filters.payment_status" :label="t('sales.paymentStatus')" :options="paymentStatusOptions" />
    <DateInput id="purchase-created-from" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="purchase-created-to" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>
  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value" :sort-column="list.sortColumn.value" :sort-direction="list.sortDirection.value" @sort="list.sortBy">
    <template #cell-supplier="{ row }">{{ displaySupplier(row) }}</template>
    <template #cell-total="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template>
    <template #cell-paid_amount="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template>
    <template #cell-remaining_amount="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template>
    <template #cell-payment_status="{ value }">{{ value ? t(`sales.paymentStatuses.${value}`) : '—' }}</template>
    <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
    <template #cell-actions="{ row }"><CrudShowButton :to="{ name: 'purchases.show', params: { id: row.id } }" /></template>
  </DataTable>
  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />
</template>
