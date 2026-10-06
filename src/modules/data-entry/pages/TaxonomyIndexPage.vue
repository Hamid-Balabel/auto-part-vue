<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalizedName } from '@/composables/useLocalizedName'
import { ChevronDown } from '@lucide/vue'
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
import { deleteResource, listCategoryTree, listResource, toggleResource } from '../api'
import type { Brand, Category, CategoryTreeNode } from '../types'
import { categoryDisplayName, filterCategoryTreeRowsByCollapsed, flattenCategoryTree } from '../utils/categoryTree'

const props = defineProps<{
  resource: 'categories' | 'brands'
  title: string
}>()

type Row = Brand | Category
type CategoryTreeTableRow = Category & { depth: number; path: string; parentName: string; ancestorIds: number[]; hasChildren: boolean }
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
const categoryTree = ref<CategoryTreeNode[]>([])
const categoryTreeLoading = ref(false)
const categoryTreeError = ref('')
const categoryView = ref<'tree' | 'list'>('tree')
const collapsedCategoryIds = ref<Set<number>>(new Set())
const { locale, t } = useI18n()
const localizedName = useLocalizedName()
const isRtl = computed(() => locale.value === 'ar')
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
const isCategory = computed(() => props.resource === 'categories')
const showTreeMode = computed(() => isCategory.value && categoryView.value === 'tree')
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
const flattenedTreeRows = computed(() => flattenCategoryTree(categoryTree.value, locale.value, t('dataEntry.rootCategory')))
const treeTableRows = computed<CategoryTreeTableRow[]>(() => filterCategoryTreeRowsByCollapsed(flattenedTreeRows.value, collapsedCategoryIds.value).map((row) => ({
  ...row.category,
  depth: row.depth,
  path: row.path,
  parentName: row.parentName,
  ancestorIds: row.ancestorIds,
  hasChildren: row.hasChildren,
})))

const columns = computed<DataTableColumn<Row>[]>(() => {
  const tableColumns: DataTableColumn<Row>[] = [
    { key: 'id', label: t('table.id'), sortable: !showTreeMode.value },
    { key: 'name', label: t('table.name') },
    { key: 'description', label: t('table.description') },
  ]

  if (isCategory.value) tableColumns.push({ key: 'parent', label: t('dataEntry.parentCategory') })
  tableColumns.push({ key: 'is_active', label: t('table.status') }, { key: 'actions', label: t('table.actions'), align: 'right' })

  return tableColumns
})

async function confirmDelete() {
  if (!selectedId.value) return
  await list.mutate(async () => {
    await deleteResource(props.resource, selectedId.value as number)
    toast.success(t('crud.deleted'))
  })
  await refreshCategoryData()
  selectedId.value = null
}

async function toggleStatus(id: number) {
  await toggleResource(props.resource, id)
  await refreshCategoryData()
}

async function refreshCategoryData() {
  if (!isCategory.value) return
  await Promise.all([list.load(), loadCategoryOptions(), loadCategoryTree()])
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
  if (!isCategory.value) return
  categoryOptionsLoading.value = true
  try {
    const response = await listResource('categories', { per_page: -1 })
    categories.value = Array.isArray(response) ? response : response.data
  } finally {
    categoryOptionsLoading.value = false
  }
}

async function loadCategoryTree() {
  if (!isCategory.value) return
  categoryTreeLoading.value = true
  categoryTreeError.value = ''
  try {
    categoryTree.value = await listCategoryTree()
  } catch (error) {
    categoryTreeError.value = error instanceof Error ? error.message : t('states.emptyMessage')
  } finally {
    categoryTreeLoading.value = false
  }
}

function refreshCurrentView() {
  if (showTreeMode.value) void loadCategoryTree()
  else void list.load()
}

function treeIndentStyle(row: Row) {
  return showTreeMode.value && 'depth' in row && typeof row.depth === 'number' && row.depth > 0
    ? { paddingInlineStart: `${row.depth * 1.25}rem` }
    : undefined
}

function isTreeParent(row: Row) {
  return showTreeMode.value && 'hasChildren' in row && row.hasChildren === true
}

function isTreeCollapsed(row: Row) {
  return collapsedCategoryIds.value.has(row.id as number)
}

function toggleTreeRow(row: Row) {
  const next = new Set(collapsedCategoryIds.value)
  const id = row.id as number
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsedCategoryIds.value = next
}

function displayRowName(row: Row) {
  return categoryDisplayName(row as Category, locale.value)
}

function displayParentName(row: Row) {
  if (showTreeMode.value && 'parentName' in row && typeof row.parentName === 'string') return row.parentName
  return (row as Category).parent ? localizedName((row as Category).parent) : t('dataEntry.rootCategory')
}

onMounted(() => {
  if (showTreeMode.value) void loadCategoryTree()
  else void list.load()
  void loadCategoryOptions()
})

watch(() => props.resource, () => {
  Object.assign(filters, emptyFilters())
  Object.assign(appliedFilters, emptyFilters())
  list.page.value = 1
  list.search.value = ''
  categories.value = []
  categoryTree.value = []
  collapsedCategoryIds.value = new Set()
  categoryView.value = props.resource === 'categories' ? 'tree' : 'list'
  if (showTreeMode.value) void loadCategoryTree()
  else void list.load()
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
    v-if="!showTreeMode"
    :loading="list.loading.value"
    :search="list.search.value"
    :search-placeholder="t(props.resource === 'categories' ? 'dataEntry.searchCategories' : 'dataEntry.searchBrands')"
    @search="list.applySearch"
    @refresh="list.load"
  />

  <div v-if="isCategory" class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-border bg-surface p-3 shadow-sm">
    <div>
      <p class="text-sm font-semibold text-text">{{ t('dataEntry.categoryHierarchy') }}</p>
      <p class="text-xs text-text-muted">{{ showTreeMode ? t('dataEntry.treeViewHint') : t('dataEntry.listViewHint') }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <BaseButton :variant="categoryView === 'tree' ? 'primary' : 'outline'" size="sm" type="button" @click="categoryView = 'tree'; loadCategoryTree()">{{ t('dataEntry.treeView') }}</BaseButton>
      <BaseButton :variant="categoryView === 'list' ? 'primary' : 'outline'" size="sm" type="button" @click="categoryView = 'list'; list.load()">{{ t('dataEntry.listView') }}</BaseButton>
      <BaseButton variant="ghost" size="sm" type="button" :loading="showTreeMode ? categoryTreeLoading : list.loading.value" @click="refreshCurrentView">{{ t('actions.refresh') }}</BaseButton>
    </div>
  </div>

  <CrudFilterPanel
    v-if="!showTreeMode"
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
    :rows="showTreeMode ? treeTableRows : list.rows.value"
    :loading="showTreeMode ? categoryTreeLoading : list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    :empty-title="t('states.emptyTitle')"
    :empty-message="t('states.emptyMessage')"
    @sort="list.sortBy"
  >
    <template #cell-name="{ row }">
      <div class="min-w-48" :style="treeIndentStyle(row)">
        <span class="inline-flex min-w-0 items-center gap-2 align-middle">
          <button
            v-if="isTreeParent(row)"
            class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            type="button"
            :aria-expanded="!isTreeCollapsed(row)"
            :aria-label="isTreeCollapsed(row) ? t('dataEntry.expandCategory') : t('dataEntry.collapseCategory')"
            @click.stop="toggleTreeRow(row)"
          >
            <ChevronDown class="size-4 transition-transform duration-200" :class="isTreeCollapsed(row) ? (isRtl ? '-rotate-90' : 'rotate-90') : ''" aria-hidden="true" />
          </button>
          <span v-else-if="showTreeMode" class="inline-block size-7 shrink-0" aria-hidden="true"></span>
          <span class="truncate font-semibold">{{ displayRowName(row) }}</span>
        </span>
        <span v-if="showTreeMode && 'path' in row" class="mt-0.5 block text-xs text-text-muted">{{ row.path }}</span>
      </div>
    </template>
    <template #cell-parent="{ row }">
      {{ displayParentName(row) }}
    </template>
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

  <div v-if="showTreeMode && categoryTreeError" class="mt-3 rounded-[var(--radius-lg)] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
    {{ categoryTreeError }}
  </div>

  <Pagination v-if="!showTreeMode && list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />

  <ConfirmDialog
    :open="selectedId !== null"
    :title="t('dataEntry.deleteTaxonomy', { title: displayTitle })"
    :message="t('dataEntry.deleteMessage')"
    :confirm-label="t('actions.delete')"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />
</template>
