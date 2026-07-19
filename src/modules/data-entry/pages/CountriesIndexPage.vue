<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { usePermissions } from '@/composables/usePermissions'
import type { Paginated } from '@/types/api'
import { deleteResource, listResource } from '../api'
import type { Country } from '../types'

const loading = ref(false)
const deleting = ref(false)
const selectedId = ref<number | null>(null)
const pageData = ref<Paginated<Country> | null>(null)
const page = ref(1)
const { t } = useI18n()
const { can } = usePermissions()

const canCreate = computed(() => can('create-country'))
const canUpdate = computed(() => can('update-country'))
const canDelete = computed(() => can('delete-country'))

const columns = computed<DataTableColumn<Country>[]>(() => [
  { key: 'translation_name', label: t('table.name') },
  { key: 'code', label: t('table.code') },
  { key: 'phone_code', label: t('table.phoneCode') },
  { key: 'phone_length', label: t('table.phoneLength') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])

async function load() {
  loading.value = true
  try {
    pageData.value = await listResource('countries', { page: page.value, per_page: 15 })
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  if (!selectedId.value) return
  deleting.value = true
  try {
    await deleteResource('countries', selectedId.value)
    selectedId.value = null
    await load()
  } finally {
    deleting.value = false
  }
}

function changePage(nextPage: number) {
  page.value = nextPage
  void load()
}

onMounted(load)
</script>

<template>
  <PageHeader :title="t('dataEntry.countriesTitle')" :description="t('dataEntry.countriesDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" variant="primary" :to="{ name: 'countries.create' }">{{ t('dataEntry.createCountry') }}</BaseButton>
    </template>
  </PageHeader>

  <DataTable :columns="columns" :rows="pageData?.data ?? []" :loading="loading">
    <template #cell-actions="{ row }">
      <RowActions :can-edit="canUpdate" :can-delete="canDelete" :edit-to="{ name: 'countries.edit', params: { id: row.id } }" :delete-disabled="deleting" @delete="selectedId = row.id" />
    </template>
  </DataTable>

  <Pagination v-if="pageData" :meta="pageData" @change="changePage" />

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
