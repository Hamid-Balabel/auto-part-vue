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
import { deleteResource, listResource, toggleResource } from '../api'
import type { Brand, Category } from '../types'

const props = defineProps<{
  resource: 'categories' | 'brands'
  title: string
}>()

type Row = Brand | Category

const selectedId = ref<number | null>(null)
const { t } = useI18n()
const toast = useToastStore()

const createRoute = computed(() => `${props.resource}.create`)
const editRoute = computed(() => `${props.resource}.edit`)
const displayTitle = computed(() => t(props.resource === 'categories' ? 'dataEntry.categoriesTitle' : 'dataEntry.brandsTitle'))
const permissionBase = props.resource === 'categories' ? 'category' : 'brand'
const permissions = useResourcePermissions(permissionBase)
const canCreate = permissions.canCreate
const canUpdate = permissions.canUpdate
const canDelete = permissions.canDelete
const canToggle = permissions.canToggle
const list = useCrudList<Row>({
  list: async (query) => await listResource(props.resource, query) as unknown as Row[],
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const columns = computed<DataTableColumn<Row>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'name', label: t('table.name') },
  { key: 'description', label: t('table.description') },
  { key: 'is_active', label: t('table.status') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])

async function confirmDelete() {
  if (!selectedId.value) return
  await list.mutate(async () => {
    await deleteResource(props.resource, selectedId.value as number)
    toast.success(t('crud.deleted'))
  })
  selectedId.value = null
}

async function toggleStatus(id: number) {
  await toggleResource(props.resource, id)
}

onMounted(list.load)
</script>

<template>
  <PageHeader :title="displayTitle" :description="t('dataEntry.taxonomyDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" variant="primary" :to="{ name: createRoute }">{{ t('actions.create') }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar
    :loading="list.loading.value"
    :search="list.search.value"
    :search-disabled="true"
    :search-placeholder="t('crud.searchUnavailable')"
    @refresh="list.load"
  />

  <DataTable
    :columns="columns"
    :rows="list.rows.value"
    :loading="list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    :empty-title="t('states.emptyTitle')"
    :empty-message="t('states.emptyMessage')"
    @sort="list.sortBy"
  >
    <template #cell-is_active="{ row }">
      <ActiveStatusSwitch :row="row" :can-toggle="canToggle" :toggle="toggleStatus" :data-testid="`${props.resource}-status-${row.id}`" />
    </template>
    <template #cell-actions="{ row }">
      <RowActions
        :can-edit="canUpdate"
        :can-delete="canDelete"
        :edit-to="{ name: editRoute, params: { id: row.id } }"
        :delete-disabled="list.mutating.value"
        @delete="selectedId = row.id"
      />
    </template>
  </DataTable>

  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />

  <ConfirmDialog
    :open="selectedId !== null"
    :title="t('dataEntry.deleteTaxonomy', { title: displayTitle })"
    :message="t('dataEntry.deleteMessage')"
    :confirm-label="t('actions.delete')"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />
</template>
