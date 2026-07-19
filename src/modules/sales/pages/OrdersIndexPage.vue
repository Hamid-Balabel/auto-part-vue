<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudShowButton from '@/components/ui/CrudShowButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useCrudList } from '@/composables/useCrudList'
import { usePermissions } from '@/composables/usePermissions'
import { listOrders } from '../api'
import type { Order } from '../types'
import SalesStatusBadge from '../components/SalesStatusBadge.vue'

const { t, locale } = useI18n()
const { can } = usePermissions()
const list = useCrudList<Order>({ list: listOrders, defaultSortColumn: 'id', defaultSortDirection: 'desc' })

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

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
}

onMounted(list.load)
</script>

<template>
  <PageHeader :title="t('sales.ordersTitle')" :description="t('sales.ordersDescription')">
    <template #actions><BaseButton v-if="can('create-order')" :to="{ name: 'orders.quick-sale' }">{{ t('sales.quickSaleTitle') }}</BaseButton></template>
  </PageHeader>
  <CrudToolbar :loading="list.loading.value" :search-disabled="true" :search-placeholder="t('sales.filtersUnavailable')" @refresh="list.load" />

  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value" :sort-column="list.sortColumn.value" :sort-direction="list.sortDirection.value" @sort="list.sortBy">
    <template #cell-customer="{ row }"><div><p class="font-semibold">{{ row.customer?.name ?? '—' }}</p><p class="text-xs text-text-muted">{{ row.customer?.phone ?? row.customer?.email ?? '' }}</p></div></template>
    <template #cell-created_at="{ value }">{{ formatDate(value as string) }}</template>
    <template #cell-total="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template>
    <template #cell-payment_method="{ value }">{{ t(`sales.paymentMethods.${value}`, String(value)) }}</template>
    <template #cell-payment_status="{ value }"><SalesStatusBadge :value="String(value)" /></template>
    <template #cell-status="{ value }"><SalesStatusBadge :value="String(value)" /></template>
    <template #cell-actions="{ row }">
      <div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton @click="$router.push({ name: 'orders.show', params: { id: row.id } })" />
      </div>
    </template>
  </DataTable>
  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />

</template>
