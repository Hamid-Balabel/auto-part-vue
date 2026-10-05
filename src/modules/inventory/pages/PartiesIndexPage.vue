<script setup lang="ts">
import { RotateCcw, Trash2 } from '@lucide/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/http'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
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
import RowActions from '@/components/ui/RowActions.vue'
import { useCrudList } from '@/composables/useCrudList'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { deleteParty, forceDeleteParty, getParty, listParties, restoreParty, toggleParty } from '../api'
import type { Party, PartyClassification } from '../types'

const { t, locale } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('party')
const selectedId = ref<number | null>(null)
const destructiveAction = ref<'delete' | 'force' | null>(null)
const detailsOpen = ref(false)
const detailsLoading = ref(false)
const detailsError = ref('')
const selectedParty = ref<Party | null>(null)
const emptyFilters = () => ({ search: '', classification: '' as PartyClassification | '', is_active: '', trashed: '', created_from: '', created_to: '' })
const filters = reactive(emptyFilters())
const appliedFilters = reactive(emptyFilters())
const viewingTrashed = computed(() => appliedFilters.trashed === 'only')
const list = useCrudList<Party>({
  list: (query) => listParties({
    ...query,
    ...(appliedFilters.search ? { search: appliedFilters.search } : {}),
    ...(appliedFilters.classification ? { classification: appliedFilters.classification } : {}),
    ...(appliedFilters.is_active ? { is_active: appliedFilters.is_active } : {}),
    ...(appliedFilters.trashed ? { trashed: appliedFilters.trashed as 'with' | 'only' } : {}),
    ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}),
    ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}),
  }),
})
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter(Boolean).length)
const columns = computed<DataTableColumn<Party>[]>(() => [
  { key: 'id', label: t('table.id'), sortable: true },
  { key: 'name', label: t('table.name'), sortable: true },
  { key: 'phone', label: t('admin.phone'), sortable: true },
  { key: 'email', label: t('admin.email'), sortable: true },
  { key: 'classifications', label: t('parties.classifications') },
  { key: 'is_active', label: t('table.status'), sortable: true },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])
const classificationOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'customer', label: t('parties.customer') },
  { value: 'supplier', label: t('parties.supplier') },
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
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—' }
function classificationLabel(value: PartyClassification) { return t(`parties.${value}`) }
function applyFilters() { Object.assign(appliedFilters, filters); list.page.value = 1; void list.load() }
function resetFilters() { Object.assign(filters, emptyFilters()); Object.assign(appliedFilters, emptyFilters()); list.page.value = 1; void list.load() }
async function openDetails(id: number) { detailsOpen.value = true; detailsLoading.value = true; detailsError.value = ''; selectedParty.value = null; try { selectedParty.value = await getParty(id) } catch (e) { detailsError.value = e instanceof ApiError ? e.message : t('details.failedToLoad') } finally { detailsLoading.value = false } }
function closeDetails() { detailsOpen.value = false; selectedParty.value = null; detailsError.value = '' }
async function confirmDelete() { if (!selectedId.value) return; try { await list.mutate(async () => { if (destructiveAction.value === 'force') await forceDeleteParty(selectedId.value!); else await deleteParty(selectedId.value!); toast.success(t('crud.deleted')) }); selectedId.value = null; destructiveAction.value = null } catch (e) { if (e instanceof ApiError) toast.error(e.message) } }
async function restore(id: number) { try { await list.mutate(async () => { await restoreParty(id); toast.success(t('parties.restored')) }) } catch (e) { if (e instanceof ApiError) toast.error(e.message) } }
onMounted(list.load)
</script>

<template>
  <PageHeader :title="t('parties.title')" :description="t('parties.description')">
    <template #actions><BaseButton v-if="permissions.canCreate.value" :to="{ name: 'parties.create' }">{{ t('parties.add') }}</BaseButton></template>
  </PageHeader>
  <CrudToolbar :search="list.search.value" :loading="list.loading.value" :search-placeholder="t('parties.search')" @search="list.applySearch" @refresh="list.load" />
  <CrudFilterPanel :active-count="activeFiltersCount" :loading="list.loading.value" @apply="applyFilters" @reset="resetFilters">
    <FormInput id="party-search-filter" v-model="filters.search" :label="t('crud.search')" />
    <BaseSelect id="party-classification-filter" v-model="filters.classification" :label="t('parties.classification')" :options="classificationOptions" />
    <BaseSelect id="party-active-filter" v-model="filters.is_active" :label="t('crud.status')" :options="statusOptions" />
    <BaseSelect id="party-trashed-filter" v-model="filters.trashed" :label="t('crud.deletedRecords')" :options="trashedOptions" />
    <DateInput id="party-created-from" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="party-created-to" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>
  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value" :sort-column="list.sortColumn.value" :sort-direction="list.sortDirection.value" @sort="list.sortBy">
    <template #cell-phone="{ value }">{{ value || '—' }}</template>
    <template #cell-email="{ value }">{{ value || '—' }}</template>
    <template #cell-classifications="{ row }"><span class="inline-flex flex-wrap gap-1"><span v-for="classification in row.classifications" :key="classification" class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{{ classificationLabel(classification) }}</span></span></template>
    <template #cell-is_active="{ row }"><ActiveStatusSwitch :row="row" :can-toggle="permissions.canToggle.value && !viewingTrashed" :toggle="toggleParty" :data-testid="`party-status-${row.id}`" /></template>
    <template #cell-actions="{ row }"><div class="inline-flex items-center justify-end gap-1.5"><CrudShowButton v-if="permissions.canView.value && !viewingTrashed" @click="openDetails(row.id)" /><RowActions v-if="!viewingTrashed" :can-edit="permissions.canUpdate.value" :can-delete="permissions.canDelete.value" :edit-to="{ name: 'parties.edit', params: { id: row.id } }" :delete-disabled="list.mutating.value" @delete="selectedId = row.id; destructiveAction = 'delete'" /><BaseButton v-if="viewingTrashed && permissions.canRestore.value" variant="ghost" size="sm" type="button" :aria-label="t('actions.restore')" :title="t('actions.restore')" @click="restore(row.id)"><RotateCcw class="size-4" /></BaseButton><BaseButton v-if="viewingTrashed && permissions.canForceDelete.value" variant="danger" size="sm" type="button" :aria-label="t('parties.forceDelete')" :title="t('parties.forceDelete')" @click="selectedId = row.id; destructiveAction = 'force'"><Trash2 class="size-4" /></BaseButton></div></template>
  </DataTable>
  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />
  <ConfirmDialog :open="selectedId !== null" :title="t(destructiveAction === 'force' ? 'parties.forceDelete' : 'parties.delete')" :message="t(destructiveAction === 'force' ? 'parties.forceDeleteMessage' : 'parties.deleteMessage')" :confirm-label="t('actions.delete')" @close="selectedId = null; destructiveAction = null" @confirm="confirmDelete" />
  <CrudDetailsModal :open="detailsOpen" :title="selectedParty?.name ?? t('parties.details')" :subtitle="t('details.details')" :loading="detailsLoading" :error-message="detailsError" @close="closeDetails">
    <DetailsSection v-if="selectedParty" :title="t('details.mainInformation')"><dl class="grid gap-3 md:grid-cols-2"><DetailsField :label="t('table.name')" :value="selectedParty.name" /><DetailsField :label="t('admin.phone')" :value="selectedParty.phone" /><DetailsField :label="t('admin.email')" :value="selectedParty.email" /><DetailsField :label="t('parties.classifications')" :value="selectedParty.classifications.map(classificationLabel).join(', ')" /><DetailsField :label="t('table.status')"><DetailsBadge :value="selectedParty.is_active" /></DetailsField><DetailsField :label="t('table.createdAt')" :value="formatDate(selectedParty.created_at)" /><DetailsField :label="t('table.updatedAt')" :value="formatDate(selectedParty.updated_at)" /></dl></DetailsSection>
  </CrudDetailsModal>
</template>
