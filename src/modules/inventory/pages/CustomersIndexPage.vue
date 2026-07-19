<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useCrudList } from '@/composables/useCrudList'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { deleteCustomer, listCustomers, toggleCustomer } from '../api'
import type { Customer } from '../types'

const { t } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('customer')
const canCreate = permissions.canCreate
const canUpdate = permissions.canUpdate
const canDelete = permissions.canDelete
const canToggle = permissions.canToggle
const selectedId = ref<number | null>(null)
const list = useCrudList<Customer>({ list: listCustomers, defaultSortColumn: 'id', defaultSortDirection: 'desc' })

const columns = computed<DataTableColumn<Customer>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'name', label: t('table.name'), sortable: true },
  { key: 'email', label: t('admin.email') },
  { key: 'phone', label: t('admin.phone') },
  { key: 'is_active', label: t('table.status') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])

async function confirmDelete() {
  if (!selectedId.value) return
  await list.mutate(async () => {
    await deleteCustomer(selectedId.value as number)
    toast.success(t('crud.deleted'))
  })
  selectedId.value = null
}

onMounted(list.load)
</script>

<template>
  <PageHeader :title="t('inventory.customersTitle')" :description="t('inventory.customersDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" :to="{ name: 'customers.create' }">{{ t('actions.create') }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar :loading="list.loading.value" :search-disabled="true" :search-placeholder="t('crud.searchUnavailable')" @refresh="list.load" />

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
