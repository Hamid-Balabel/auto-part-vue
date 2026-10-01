<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalizedName } from '@/composables/useLocalizedName'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useCrudList } from '@/composables/useCrudList'
import { usePermissions } from '@/composables/usePermissions'
import { useToastStore } from '@/stores/toast'
import { deleteResource, listResource, toggleResource } from '../api'
import type { Brand, Category } from '../types'

const props = defineProps<{
  resource: 'categories' | 'brands'
  title: string
}>()

type Row = Brand | Category
interface TaxonomyFilters {
  has_products: string
  is_active: string
  trashed: string
  created_from: string
  created_to: string
  parent_id: string | number
  is_root: string
}

const selectedId = ref<number | null>(null)
const categoryOptionsLoading = ref(false)
const categories = ref<Category[]>([])
const { t } = useI18n()
const localizedName = useLocalizedName()
const toast = useToastStore()
const emptyFilters = (): TaxonomyFilters => ({
  has_products: '',
  is_active: '',
  trashed: '',
  created_from: '',
  created_to: '',
  parent_id: '',
  is_root: '',
})
const filters = reactive<TaxonomyFilters>(emptyFilters())
const appliedFilters = reactive<TaxonomyFilters>(emptyFilters())

const createRoute = computed(() => `${props.resource}.create`)
const editRoute = computed(() => `${props.resource}.edit`)
const displayTitle = computed(() => t(props.resource === 'categories' ? 'dataEntry.categoriesTitle' : 'dataEntry.brandsTitle'))
const { can } = usePermissions()
const permissionBase = computed(() => props.resource === 'categories' ? 'category' : 'brand')
const canCreate = computed(() => can(`create-${permissionBase.value}`))
const canUpdate = computed(() => can(`update-${permissionBase.value}`))
const canDelete = computed(() => can(`delete-${permissionBase.value}`))
const canToggle = computed(() => can(`toggle-active-${permissionBase.value}`))
const list = useCrudList<Row>({
  list: (query) => listResource(props.resource, {
    ...query,
    ...Object.fromEntries(Object.entries(appliedFilters).filter(([, value]) => value !== '')),
  }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})
const activeFiltersCount = computed(() => Object.entries(appliedFilters)
  .filter(([key, value]) => value !== '' && (props.resource === 'categories' || !['parent_id', 'is_root'].includes(key)))
  .length)
const parentOptions = computed(() => [
  { value: '', label: t('crud.all') },
  ...categories.value.map((category) => ({ value: category.id, label: localizedName(category, `#${category.id}`) })),
])

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

async function loadCategoryOptions() {
  if (props.resource !== 'categories') return
  categoryOptionsLoading.value = true
  try {
    const response = await listResource('categories', { per_page: -1 })
    categories.value = Array.isArray(response) ? response : response.data
  } finally {
    categoryOptionsLoading.value = false
  }
}

onMounted(() => {
  void list.load()
  void loadCategoryOptions()
})

watch(() => props.resource, () => {
  Object.assign(filters, emptyFilters())
  Object.assign(appliedFilters, emptyFilters())
  list.page.value = 1
  list.search.value = ''
  categories.value = []
  void list.load()
  void loadCategoryOptions()
})
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
    @search="list.applySearch"
    @refresh="list.load"
  />

  <CrudFilterPanel
    :active-count="activeFiltersCount"
    :loading="list.loading.value"
    @apply="applyFilters"
    @reset="resetFilters"
  >
    <BaseSelect
      id="taxonomy-products-filter"
      v-model="filters.has_products"
      :label="t('crud.hasProducts')"
      :options="[
        { value: '', label: t('crud.all') },
        { value: 'true', label: t('crud.yes') },
      ]"
    />
    <BaseSelect
      id="taxonomy-status-filter"
      v-model="filters.is_active"
      :label="t('crud.status')"
      :options="[
        { value: '', label: t('crud.all') },
        { value: 'true', label: t('crud.active') },
        { value: 'false', label: t('crud.inactive') },
      ]"
    />
    <BaseSelect
      id="taxonomy-trashed-filter"
      v-model="filters.trashed"
      :label="t('crud.deletedRecords')"
      :options="[
        { value: '', label: t('crud.all') },
        { value: 'with', label: t('crud.withDeleted') },
        { value: 'only', label: t('crud.onlyDeleted') },
      ]"
    />
    <DateInput id="taxonomy-created-from-filter" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="taxonomy-created-to-filter" v-model="filters.created_to" :label="t('crud.toDate')" />
    <BaseSelect
      v-if="props.resource === 'categories'"
      id="category-parent-filter"
      v-model="filters.parent_id"
      :label="t('crud.parentCategory')"
      :options="parentOptions"
      :loading="categoryOptionsLoading"
      searchable
    />
    <BaseSelect
      v-if="props.resource === 'categories'"
      id="category-root-filter"
      v-model="filters.is_root"
      :label="t('crud.rootOnly')"
      :options="[
        { value: '', label: t('crud.all') },
        { value: 'true', label: t('crud.yes') },
        { value: 'false', label: t('crud.no') },
      ]"
    />
  </CrudFilterPanel>

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
    <template #cell-name="{ row }">{{ localizedName(row) }}</template>
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
