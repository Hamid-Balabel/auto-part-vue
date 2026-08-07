<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudShowButton from '@/components/ui/CrudShowButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useCrudList } from '@/composables/useCrudList'
import { usePermissions } from '@/composables/usePermissions'
import { listCustomers } from '@/modules/inventory/api'
import type { Customer } from '@/modules/inventory/types'
import { listOrders } from '../api'
import type {
  Order,
  OrderListQuery,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types'
import SalesStatusBadge from '../components/SalesStatusBadge.vue'

const { t, locale } = useI18n()
const { can } = usePermissions()
const customers = ref<Customer[]>([])
const customersLoading = ref(false)

interface OrderFilters {
  invoice_no: string
  customer_id: number | null
  status: OrderStatus | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus | null
  total_min: string
  total_max: string
  paid_amount_min: string
  paid_amount_max: string
  remaining_amount_min: string
  remaining_amount_max: string
  created_from: string
  created_to: string
}

const emptyFilters = (): OrderFilters => ({
  invoice_no: '',
  customer_id: null,
  status: null,
  payment_method: null,
  payment_status: null,
  total_min: '',
  total_max: '',
  paid_amount_min: '',
  paid_amount_max: '',
  remaining_amount_min: '',
  remaining_amount_max: '',
  created_from: '',
  created_to: '',
})
const filters = reactive<OrderFilters>(emptyFilters())
const appliedFilters = ref<OrderFilters>(emptyFilters())
const list = useCrudList<Order>({
  list: (query) =>
    listOrders({ ...query, ...toFilterQuery(appliedFilters.value) }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const columns = computed<DataTableColumn<Order>[]>(() => [
  { key: 'invoice_no', label: t('sales.invoiceNo'), sortable: true },
  { key: 'customer', label: t('sales.customer') },
  { key: 'created_at', label: t('sales.orderDate'), sortable: true },
  { key: 'total', label: t('sales.total'), sortable: true },
  { key: 'payment_method', label: t('sales.paymentMethod') },
  { key: 'payment_status', label: t('sales.paymentStatus') },
  { key: 'status', label: t('sales.orderStatus') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const customerOptions = computed(() =>
  customers.value.map((customer) => ({
    value: customer.id,
    label: customer.name,
    description: customer.phone ?? customer.email ?? undefined,
    searchText: [customer.name, customer.phone, customer.email]
      .filter(Boolean)
      .join(' '),
  })),
)
const statusOptions = computed(() =>
  (
    ['pending', 'paid', 'cancelled', 'completed', 'refunded'] as OrderStatus[]
  ).map((value) => ({
    value,
    label: t(`sales.statuses.${value}`),
  })),
)
const paymentMethodOptions = computed(() =>
  (['cash', 'card', 'transfer'] as PaymentMethod[]).map((value) => ({
    value,
    label: t(`sales.paymentMethods.${value}`),
  })),
)
const paymentStatusOptions = computed(() =>
  (['pending', 'paid', 'partial'] as PaymentStatus[]).map((value) => ({
    value,
    label: t(`sales.statuses.${value}`),
  })),
)
const activeFilterCount = computed(
  () =>
    Object.values(appliedFilters.value).filter(
      (value) => value !== '' && value !== null,
    ).length,
)

function toFilterQuery(value: OrderFilters): OrderListQuery {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, filterValue]) => filterValue !== '' && filterValue !== null,
    ),
  ) as OrderListQuery
}

function applyFilters() {
  appliedFilters.value = { ...filters }
  list.page.value = 1
  void list.load()
}

function resetFilters() {
  Object.assign(filters, emptyFilters())
  appliedFilters.value = emptyFilters()
  list.page.value = 1
  void list.load()
}

async function loadCustomers() {
  customersLoading.value = true
  try {
    const response = await listCustomers({ per_page: -1 })
    customers.value = Array.isArray(response) ? response : response.data
  } finally {
    customersLoading.value = false
  }
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—'
}

onMounted(() => {
  void list.load()
  void loadCustomers()
})
</script>

<template>
  <PageHeader
    :title="t('sales.ordersTitle')"
    :description="t('sales.ordersDescription')"
  >
    <template #actions
      ><BaseButton
        v-if="can('create-order')"
        :to="{ name: 'orders.quick-sale' }"
        >{{ t('sales.quickSaleTitle') }}</BaseButton
      ></template
    >
  </PageHeader>
  <CrudToolbar
    :search="list.search.value"
    :loading="list.loading.value"
    :search-placeholder="t('crud.searchPlaceholder')"
    @search="list.applySearch"
    @refresh="list.load"
  />

  <CrudFilterPanel
    :active-count="activeFilterCount"
    :loading="list.loading.value"
    @apply="applyFilters"
    @reset="resetFilters"
  >
    <FormInput
      id="order-invoice-filter"
      v-model="filters.invoice_no"
      :label="t('sales.invoiceNo')"
    />
    <BaseSelect
      id="order-customer-filter"
      v-model="filters.customer_id"
      :label="t('sales.customer')"
      :options="customerOptions"
      :placeholder="t('crud.all')"
      :loading="customersLoading"
      searchable
      clearable
    />
    <BaseSelect
      id="order-status-filter"
      v-model="filters.status"
      :label="t('sales.orderStatus')"
      :options="statusOptions"
      :placeholder="t('crud.all')"
      clearable
    />
    <BaseSelect
      id="order-payment-method-filter"
      v-model="filters.payment_method"
      :label="t('sales.paymentMethod')"
      :options="paymentMethodOptions"
      :placeholder="t('crud.all')"
      clearable
    />
    <BaseSelect
      id="order-payment-status-filter"
      v-model="filters.payment_status"
      :label="t('sales.paymentStatus')"
      :options="paymentStatusOptions"
      :placeholder="t('crud.all')"
      clearable
    />
    <FormInput
      id="order-total-min-filter"
      v-model="filters.total_min"
      type="number"
      :label="t('crud.totalMin')"
    />
    <FormInput
      id="order-total-max-filter"
      v-model="filters.total_max"
      type="number"
      :label="t('crud.totalMax')"
    />
    <FormInput
      id="order-paid-min-filter"
      v-model="filters.paid_amount_min"
      type="number"
      :label="t('crud.paidMin')"
    />
    <FormInput
      id="order-paid-max-filter"
      v-model="filters.paid_amount_max"
      type="number"
      :label="t('crud.paidMax')"
    />
    <FormInput
      id="order-remaining-min-filter"
      v-model="filters.remaining_amount_min"
      type="number"
      :label="t('crud.remainingMin')"
    />
    <FormInput
      id="order-remaining-max-filter"
      v-model="filters.remaining_amount_max"
      type="number"
      :label="t('crud.remainingMax')"
    />
    <DateInput
      id="order-created-from-filter"
      v-model="filters.created_from"
      :label="t('crud.fromDate')"
    />
    <DateInput
      id="order-created-to-filter"
      v-model="filters.created_to"
      :label="t('crud.toDate')"
    />
  </CrudFilterPanel>

  <DataTable
    :columns="columns"
    :rows="list.rows.value"
    :loading="list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    @sort="list.sortBy"
  >
    <template #cell-customer="{ row }"
      ><div>
        <p class="font-semibold">{{ row.customer?.name ?? '—' }}</p>
        <p class="text-xs text-text-muted">
          {{ row.customer?.phone ?? row.customer?.email ?? '' }}
        </p>
      </div></template
    >
    <template #cell-created_at="{ value }">{{
      formatDate(value as string)
    }}</template>
    <template #cell-total="{ value }"
      ><MoneyDisplay :value="value as string" currency="EGP"
    /></template>
    <template #cell-payment_method="{ value }">{{
      t(`sales.paymentMethods.${value}`, String(value))
    }}</template>
    <template #cell-payment_status="{ value }"
      ><SalesStatusBadge :value="String(value)"
    /></template>
    <template #cell-status="{ value }"
      ><SalesStatusBadge :value="String(value)"
    /></template>
    <template #cell-actions="{ row }">
      <div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton
          @click="$router.push({ name: 'orders.show', params: { id: row.id } })"
        />
      </div>
    </template>
  </DataTable>
  <Pagination
    v-if="list.pageData.value"
    :meta="list.pageData.value"
    @change="list.changePage"
  />
</template>
