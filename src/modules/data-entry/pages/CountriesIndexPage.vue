<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { useCrudList } from '@/composables/useCrudList'
import { usePermissions } from '@/composables/usePermissions'
import { deleteResource, listResource } from '../api'
import type { Country } from '../types'

const deleting = ref(false)
const selectedId = ref<number | null>(null)
const { t } = useI18n()
const { can } = usePermissions()

interface CountryFilters {
  code: string
  phone_code: string
  phone_length_min: string
  phone_length_max: string
  is_active: string
  trashed: string
  created_from: string
  created_to: string
}

const emptyFilters = (): CountryFilters => ({
  code: '',
  phone_code: '',
  phone_length_min: '',
  phone_length_max: '',
  is_active: '',
  trashed: '',
  created_from: '',
  created_to: '',
})
const filters = reactive<CountryFilters>(emptyFilters())
const appliedFilters = reactive<CountryFilters>(emptyFilters())
const list = useCrudList<Country>({
  list: (query) => listResource('countries', {
    ...query,
    ...Object.fromEntries(Object.entries(appliedFilters).filter(([, value]) => value !== '')),
  }),
  defaultSortColumn: 'id',
  defaultSortDirection: 'desc',
})

const canCreate = computed(() => can('create-country'))
const canUpdate = computed(() => can('update-country'))
const canDelete = computed(() => can('delete-country'))
const activeFiltersCount = computed(() => Object.values(appliedFilters).filter((value) => value !== '').length)

const columns = computed<DataTableColumn<Country>[]>(() => [
  { key: 'translation_name', label: t('table.name') },
  { key: 'code', label: t('table.code') },
  { key: 'phone_code', label: t('table.phoneCode') },
  { key: 'phone_length', label: t('table.phoneLength') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])

async function confirmDelete() {
  if (!selectedId.value) return
  deleting.value = true
  try {
    await deleteResource('countries', selectedId.value)
    selectedId.value = null
    await list.load()
  } finally {
    deleting.value = false
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

onMounted(list.load)
</script>

<template>
  <PageHeader :title="t('dataEntry.countriesTitle')" :description="t('dataEntry.countriesDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" variant="primary" :to="{ name: 'countries.create' }">{{ t('dataEntry.createCountry') }}</BaseButton>
    </template>
  </PageHeader>

  <CrudToolbar
    :search="list.search.value"
    :loading="list.loading.value"
    @search="list.applySearch"
    @refresh="list.load"
  />

  <CrudFilterPanel
    :active-count="activeFiltersCount"
    :loading="list.loading.value"
    @apply="applyFilters"
    @reset="resetFilters"
  >
    <FormInput id="country-code-filter" v-model="filters.code" :label="t('table.code')" />
    <FormInput id="country-phone-code-filter" v-model="filters.phone_code" :label="t('table.phoneCode')" />
    <FormInput id="country-phone-length-min-filter" v-model="filters.phone_length_min" type="number" :label="`${t('table.phoneLength')} (${t('crud.min')})`" />
    <FormInput id="country-phone-length-max-filter" v-model="filters.phone_length_max" type="number" :label="`${t('table.phoneLength')} (${t('crud.max')})`" />
    <BaseSelect
      id="country-status-filter"
      v-model="filters.is_active"
      :label="t('crud.status')"
      :options="[
        { value: '', label: t('crud.all') },
        { value: 'true', label: t('crud.active') },
        { value: 'false', label: t('crud.inactive') },
      ]"
    />
    <BaseSelect
      id="country-trashed-filter"
      v-model="filters.trashed"
      :label="t('crud.deletedRecords')"
      :options="[
        { value: '', label: t('crud.all') },
        { value: 'with', label: t('crud.withDeleted') },
        { value: 'only', label: t('crud.onlyDeleted') },
      ]"
    />
    <DateInput id="country-created-from-filter" v-model="filters.created_from" :label="t('crud.fromDate')" />
    <DateInput id="country-created-to-filter" v-model="filters.created_to" :label="t('crud.toDate')" />
  </CrudFilterPanel>

  <DataTable :columns="columns" :rows="list.rows.value" :loading="list.loading.value">
    <template #cell-actions="{ row }">
      <RowActions :can-edit="canUpdate" :can-delete="canDelete" :edit-to="{ name: 'countries.edit', params: { id: row.id } }" :delete-disabled="deleting" @delete="selectedId = row.id" />
    </template>
  </DataTable>

  <Pagination v-if="list.pageData.value" :meta="list.pageData.value" @change="list.changePage" />

  <ConfirmDialog
    :open="selectedId !== null"
    :title="t('dataEntry.deleteCountry')"
    :message="t('dataEntry.deleteCountryMessage')"
    :confirm-label="t('actions.delete')"
    :loading="deleting"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />
</template>
