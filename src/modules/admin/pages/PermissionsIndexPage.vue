<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useLocalizedDisplayName } from '@/composables/useLocalizedName'
import type { Paginated } from '@/types/api'
import { listPermissions, listRoles } from '../api'
import type { Permission, Role } from '../types'

interface PermissionFilters {
  group: string
  guard_name: string
  role_id: number | null
  created_from: string
  created_to: string
}

const emptyFilters = (): PermissionFilters => ({
  group: '',
  guard_name: '',
  role_id: null,
  created_from: '',
  created_to: '',
})

const { t, locale } = useI18n()
const localizedDisplayName = useLocalizedDisplayName()
const loading = ref(false)
const page = ref(1)
const pageData = ref<Paginated<Permission> | null>(null)
const search = ref('')
const draftFilters = ref<PermissionFilters>(emptyFilters())
const appliedFilters = ref<PermissionFilters>(emptyFilters())
const roles = ref<Role[]>([])
const rolesLoading = ref(false)
const { can } = usePermissions()
const canLoadRoles = computed(() => can(['view-all-role', 'view-own-role']))

const activeFilterCount = computed(
  () =>
    Object.values(appliedFilters.value).filter(
      (value) => value !== null && String(value).trim() !== '',
    ).length,
)
const resetDisabled = computed(
  () =>
    !Object.values(draftFilters.value).some(
      (value) => value !== null && String(value).trim() !== '',
    ) && activeFilterCount.value === 0,
)
const roleOptions = computed(() =>
  roles.value.map((role) => ({
    value: role.id,
    label: localizedDisplayName(role),
  })),
)

const columns = computed<DataTableColumn<Permission>[]>(() => [
  { key: 'translation_display_name', label: t('admin.displayName') },
  { key: 'name', label: t('admin.key') },
  { key: 'display_group', label: t('admin.group') },
])

async function load() {
  loading.value = true
  try {
    const filters = appliedFilters.value
    const response = await listPermissions({
      page: page.value,
      per_page: 20,
      ...(search.value.trim() ? { search: search.value.trim() } : {}),
      ...(filters.group.trim() ? { group: filters.group.trim() } : {}),
      ...(filters.guard_name.trim()
        ? { guard_name: filters.guard_name.trim() }
        : {}),
      ...(filters.role_id !== null ? { role_id: filters.role_id } : {}),
      ...(filters.created_from ? { created_from: filters.created_from } : {}),
      ...(filters.created_to ? { created_to: filters.created_to } : {}),
    })
    pageData.value = Array.isArray(response)
      ? {
          data: response,
          current_page: 1,
          from: response.length ? 1 : null,
          last_page: 1,
          per_page: response.length,
          to: response.length || null,
          total: response.length,
        }
      : response
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  if (!canLoadRoles.value) return
  rolesLoading.value = true
  try {
    const response = await listRoles({ per_page: -1 })
    roles.value = Array.isArray(response) ? response : response.data
  } finally {
    rolesLoading.value = false
  }
}

function applySearch(value: string) {
  search.value = value
  page.value = 1
  void load()
}

function applyFilters() {
  appliedFilters.value = { ...draftFilters.value }
  page.value = 1
  void load()
}

function resetFilters() {
  draftFilters.value = emptyFilters()
  appliedFilters.value = emptyFilters()
  page.value = 1
  void load()
}

function changePage(nextPage: number) {
  page.value = nextPage
  void load()
}

onMounted(() => {
  void load()
  if (canLoadRoles.value) void loadRoles()
})
watch(locale, () => {
  void load()
  if (canLoadRoles.value) void loadRoles()
})
</script>

<template>
  <PageHeader
    :title="t('admin.permissionsTitle')"
    :description="t('admin.permissionsDescription')"
  />

  <CrudToolbar
    :search="search"
    :loading="loading"
    @search="applySearch"
    @refresh="load"
  />

  <CrudFilterPanel
    :active-count="activeFilterCount"
    :loading="loading"
    :reset-disabled="resetDisabled"
    @apply="applyFilters"
    @reset="resetFilters"
  >
    <FormInput
      id="permission-group-filter"
      v-model="draftFilters.group"
      :label="t('crud.group')"
    />
    <FormInput
      id="permission-guard-filter"
      v-model="draftFilters.guard_name"
      :label="t('crud.guard')"
    />
    <BaseSelect
      v-if="canLoadRoles"
      id="permission-role-filter"
      v-model="draftFilters.role_id"
      :label="t('crud.role')"
      :options="roleOptions"
      :loading="rolesLoading"
      :placeholder="t('crud.all')"
      searchable
      clearable
    />
    <DateInput
      id="permission-created-from-filter"
      v-model="draftFilters.created_from"
      :label="t('crud.fromDate')"
    />
    <DateInput
      id="permission-created-to-filter"
      v-model="draftFilters.created_to"
      :label="t('crud.toDate')"
    />
  </CrudFilterPanel>

  <DataTable
    :columns="columns"
    :rows="pageData?.data ?? []"
    :loading="loading"
  >
    <template #cell-translation_display_name="{ row }">{{ localizedDisplayName(row) }}</template>
  </DataTable>
  <Pagination v-if="pageData" :meta="pageData" @change="changePage" />
</template>
