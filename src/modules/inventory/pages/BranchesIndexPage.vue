<script setup lang="ts">
import { useLocalizedName } from "@/composables/useLocalizedName";
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import SwitchInput from '@/components/forms/SwitchInput.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
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
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import {
  deleteBranch,
  getBranch,
  listBranches,
  setCurrentBranch,
  updateBranchStatus,
} from '../api'
import type { Branch } from '../types'

const { t, locale } = useI18n()
const displayName = useLocalizedName();
const { can } = usePermissions()
const toast = useToastStore()
const auth = useAuthStore()
const selectedId = ref<number | null>(null)
const emptyFilters = () => ({
  address: '',
  is_current: '',
  is_active: '',
  trashed: '',
  created_from: '',
  created_to: '',
})
const filters = reactive(emptyFilters())
const appliedFilters = reactive(emptyFilters())
const statusLoadingId = ref<number | null>(null)
const currentLoadingId = ref<number | null>(null)
const detailsOpen = ref(false)
const detailsLoading = ref(false)
const detailsLoadingId = ref<number | null>(null)
const detailsError = ref('')
const selectedBranch = ref<Branch | null>(null)
let detailsRequestId = 0

const canCreate = computed(() => can('create-branch'))
const canUpdate = computed(() => can('update-branch'))
const canDelete = computed(() => can('delete-branch'))
const canToggle = computed(() => can('toggle-active-branch'))
const canSetCurrent = computed(() => can('set-current-branch'))
const list = useCrudList<Branch>({
  list: (query) =>
    listBranches({
      ...query,
      ...(appliedFilters.address ? { address: appliedFilters.address } : {}),
      ...(appliedFilters.is_active ? { is_active: appliedFilters.is_active } : {}),
      ...(appliedFilters.is_current ? { is_current: appliedFilters.is_current } : {}),
      ...(appliedFilters.trashed ? { trashed: appliedFilters.trashed as 'with' | 'only' } : {}),
      ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}),
      ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}),
    }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const columns = computed<DataTableColumn<Branch>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'name', label: t('table.name'), sortable: true },
  { key: 'address', label: t('table.address'), sortable: true },
  { key: 'is_active', label: t('table.status'), sortable: true },
  { key: 'is_current', label: t('inventory.currentBranch'), sortable: true },
  { key: 'created_at', label: t('table.createdAt'), sortable: true },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter(Boolean).length)
const booleanFilterOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'true', label: t('crud.active') },
  { value: 'false', label: t('crud.inactive') },
])
const currentFilterOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'true', label: t('crud.yes') },
  { value: 'false', label: t('crud.no') },
])
const trashedFilterOptions = computed(() => [
  { value: '', label: t('crud.active') },
  { value: 'with', label: t('crud.withDeleted') },
  { value: 'only', label: t('crud.onlyDeleted') },
])

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


function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—'
}

async function changeStatus(row: Branch, isActive: boolean) {
  if (!canToggle.value || statusLoadingId.value !== null) return
  const previous = { is_active: row.is_active, is_current: row.is_current }
  statusLoadingId.value = row.id
  row.is_active = isActive
  try {
    const updated = await updateBranchStatus(row.id, isActive)
    Object.assign(row, updated)
    auth.applyBranch(updated)
    toast.success(t('crud.toggled'))
  } catch (error) {
    Object.assign(row, previous)
    toast.error(error instanceof ApiError ? error.message : t('admin.failedToUpdateStatus'))
  } finally {
    statusLoadingId.value = null
  }
}

async function changeCurrent(row: Branch) {
  if (
    row.is_current ||
    !row.is_active ||
    !canSetCurrent.value ||
    currentLoadingId.value !== null
  )
    return
  currentLoadingId.value = row.id
  try {
    const updated = await setCurrentBranch(row.id)
    list.rows.value.forEach((branch) => {
      branch.is_current = branch.id === updated.id
    })
    Object.assign(row, updated)
    auth.applyBranch(updated)
    toast.success(t('inventory.branchSelected'))
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : t('inventory.branchSelectionFailed'))
  } finally {
    currentLoadingId.value = null
  }
}

async function openDetails(id: number) {
  if (detailsLoading.value) return
  detailsOpen.value = true
  detailsLoading.value = true
  detailsLoadingId.value = id
  detailsError.value = ''
  selectedBranch.value = null
  const requestId = ++detailsRequestId
  try {
    const branch = await getBranch(id)
    if (requestId === detailsRequestId && detailsOpen.value)
      selectedBranch.value = branch
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
  selectedBranch.value = null
}

async function confirmDelete() {
  if (!selectedId.value) return
  const id = selectedId.value
  try {
    await list.mutate(async () => {
      await deleteBranch(id)
      auth.removeBranch(id)
      toast.success(t('crud.deleted'))
    })
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : t('inventory.branchDeleteFailed'))
  } finally {
    selectedId.value = null
  }
}

onMounted(list.load)
watch(locale, () => {
  if (detailsOpen.value && selectedBranch.value) void openDetails(selectedBranch.value.id)
})
</script>

<template>
  <PageHeader
    :title="t('inventory.branchesTitle')"
    :description="t('inventory.branchesDescription')"
  >
    <template #actions>
      <BaseButton v-if="canCreate" :to="{ name: 'branches.create' }">{{
        t('actions.create')
      }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar
    :search="list.search.value"
    :loading="list.loading.value"
    :search-placeholder="t('inventory.searchBranches')"
    @search="list.applySearch"
    @refresh="list.load"
  />

  <CrudFilterPanel
    :active-count="activeFiltersCount"
    :loading="list.loading.value"
    @apply="applyFilters"
    @reset="resetFilters"
  >
    <FormInput id="branch-address-filter" v-model="filters.address" :label="t('crud.address')" />
    <BaseSelect
      id="branch-active-filter"
      v-model="filters.is_active"
      :label="t('crud.status')"
      :options="booleanFilterOptions"
    />
    <BaseSelect
      id="branch-current-filter"
      v-model="filters.is_current"
      :label="t('inventory.currentBranch')"
      :options="currentFilterOptions"
    />
    <BaseSelect id="branch-trashed-filter" v-model="filters.trashed" :label="t('crud.deletedRecords')" :options="trashedFilterOptions" />
    <DateInput id="branch-created-from-filter" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="branch-created-to-filter" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>

  <DataTable
    :columns="columns"
    :rows="list.rows.value"
    :loading="list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    :empty-title="t('inventory.noBranchesAvailable')"
    @sort="list.sortBy"
  >
    <template #cell-name="{ row }">{{ displayName(row) }}</template>
    <template #cell-is_active="{ row }">
      <SwitchInput
        :model-value="row.is_active"
        :disabled="!canToggle || statusLoadingId !== null"
        :loading="statusLoadingId === row.id"
        :on-label="t('dataEntry.active')"
        :off-label="t('dataEntry.inactive')"
        :data-testid="`branch-status-${row.id}`"
        @update:model-value="changeStatus(row, $event)"
      />
    </template>
    <template #cell-is_current="{ row }">
      <SwitchInput
        :model-value="row.is_current"
        :disabled="
          !canSetCurrent ||
          !row.is_active ||
          row.is_current ||
          currentLoadingId !== null
        "
        :loading="currentLoadingId === row.id"
        :on-label="t('inventory.currentBranch')"
        :off-label="t('inventory.setAsCurrentBranch')"
        :data-testid="`branch-current-${row.id}`"
        @update:model-value="changeCurrent(row)"
      />
    </template>
    <template #cell-created_at="{ row }">{{ formatDate(row.created_at) }}</template>
    <template #cell-actions="{ row }">
      <div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton
          :loading="detailsLoadingId === row.id"
          :disabled="detailsLoading"
          @click="openDetails(row.id)"
        />
        <RowActions
          :can-edit="canUpdate"
          :can-delete="canDelete"
          :edit-to="{ name: 'branches.edit', params: { id: row.id } }"
          :delete-disabled="list.mutating.value || row.is_current"
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
    :title="t('inventory.deleteBranch')"
    :message="t('inventory.deleteBranchMessage')"
    :confirm-label="t('actions.delete')"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />

  <CrudDetailsModal
    :open="detailsOpen"
    :title="selectedBranch ? displayName(selectedBranch) : t('details.branchDetails')"
    :subtitle="t('details.details')"
    :loading="detailsLoading"
    :error-message="detailsError"
    @close="closeDetails"
  >
    <div v-if="selectedBranch" class="grid gap-4">
      <DetailsSection :title="t('details.mainInformation')">
        <dl class="grid gap-3 md:grid-cols-3">
          <DetailsField :label="t('table.name')" :value="displayName(selectedBranch)" />
          <DetailsField :label="t('dataEntry.nameAr')" :value="selectedBranch.translation_name?.ar" />
          <DetailsField :label="t('dataEntry.nameEn')" :value="selectedBranch.translation_name?.en" />
          <DetailsField class="md:col-span-2" :label="t('table.address')" :value="selectedBranch.address" />
          <DetailsField :label="t('table.status')"><DetailsBadge :value="selectedBranch.is_active" /></DetailsField>
          <DetailsField :label="t('inventory.currentBranch')">
            <BaseBadge :variant="selectedBranch.is_current ? 'primary' : 'neutral'">{{
              t(selectedBranch.is_current ? 'inventory.currentBranch' : 'inventory.notCurrentBranch')
            }}</BaseBadge>
          </DetailsField>
          <DetailsField :label="t('table.createdAt')" :value="formatDate(selectedBranch.created_at)" />
        </dl>
      </DetailsSection>
      <DetailsSection :title="t('details.creator')">
        <RelationshipCard
          :title="selectedBranch.creator?.name ?? t('details.noRelatedData')"
          :subtitle="selectedBranch.creator?.email"
        >
          <template #badge><DetailsBadge :value="selectedBranch.creator?.is_active" /></template>
        </RelationshipCard>
      </DetailsSection>
    </div>
  </CrudDetailsModal>
</template>
