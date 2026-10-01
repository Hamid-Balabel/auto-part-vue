<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useLocalizedDisplayName } from '@/composables/useLocalizedName'
import type { Paginated } from '@/types/api'
import { deleteRole, listPermissions, listRoles } from '../api'
import type { Permission, Role } from '../types'

interface RoleFilters {
  guard_name: string
  permission_id: number | null
  is_active: string
  created_from: string
  created_to: string
}

const emptyFilters = (): RoleFilters => ({
  guard_name: '',
  permission_id: null,
  is_active: '',
  created_from: '',
  created_to: '',
})

const { t, locale } = useI18n()
const localizedDisplayName = useLocalizedDisplayName()
const loading = ref(false)
const deleting = ref(false)
const selectedId = ref<number | null>(null)
const page = ref(1)
const pageData = ref<Paginated<Role> | null>(null)
const search = ref('')
const draftFilters = ref<RoleFilters>(emptyFilters())
const appliedFilters = ref<RoleFilters>(emptyFilters())
const permissions = ref<Permission[]>([])
const permissionsLoading = ref(false)
const { can } = usePermissions()

const canCreate = computed(() => can('create-role'))
const canUpdate = computed(() => can('update-role'))
const canDelete = computed(() => can('delete-role'))
const canLoadPermissions = computed(() => can('read-permission'))
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
const permissionOptions = computed(() =>
  permissions.value.map((permission) => ({
    value: permission.id,
    label: localizedDisplayName(permission),
  })),
)
const statusOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'true', label: t('crud.active') },
  { value: 'false', label: t('crud.inactive') },
])

const columns = computed<DataTableColumn<Role>[]>(() => [
  { key: 'translation_display_name', label: t('admin.displayName') },
  { key: 'name', label: t('admin.key') },
  { key: 'permissions', label: t('admin.permissions') },
  { key: 'is_active', label: t('table.status') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])

async function load() {
  loading.value = true
  try {
    const filters = appliedFilters.value
    const response = await listRoles({
      page: page.value,
      per_page: 15,
      ...(search.value.trim() ? { search: search.value.trim() } : {}),
      ...(filters.guard_name.trim()
        ? { guard_name: filters.guard_name.trim() }
        : {}),
      ...(filters.permission_id !== null
        ? { permission_id: filters.permission_id }
        : {}),
      ...(filters.is_active ? { is_active: filters.is_active } : {}),
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

async function loadPermissions() {
  if (!canLoadPermissions.value) return
  permissionsLoading.value = true
  try {
    const response = await listPermissions({ per_page: -1 })
    permissions.value = Array.isArray(response) ? response : response.data
  } finally {
    permissionsLoading.value = false
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

async function confirmDelete() {
  if (!selectedId.value) return
  deleting.value = true
  try {
    await deleteRole(selectedId.value)
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

onMounted(() => {
  void load()
  if (canLoadPermissions.value) void loadPermissions()
})
watch(locale, () => {
  void load()
  if (canLoadPermissions.value) void loadPermissions()
})
</script>

<template>
  <PageHeader
    :title="t('admin.rolesTitle')"
    :description="t('admin.rolesDescription')"
  >
    <template #actions>
      <BaseButton
        v-if="canCreate"
        data-testid="roles-create"
        variant="primary"
        :to="{ name: 'roles.create' }"
        >{{ t('admin.createRole') }}</BaseButton
      >
    </template>
  </PageHeader>

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
      id="role-guard-filter"
      v-model="draftFilters.guard_name"
      :label="t('crud.guard')"
    />
    <BaseSelect
      v-if="canLoadPermissions"
      id="role-permission-filter"
      v-model="draftFilters.permission_id"
      :label="t('crud.permission')"
      :options="permissionOptions"
      :loading="permissionsLoading"
      :placeholder="t('crud.all')"
      searchable
      clearable
    />
    <BaseSelect
      id="role-status-filter"
      v-model="draftFilters.is_active"
      :label="t('crud.status')"
      :options="statusOptions"
    />
    <DateInput
      id="role-created-from-filter"
      v-model="draftFilters.created_from"
      :label="t('crud.fromDate')"
    />
    <DateInput
      id="role-created-to-filter"
      v-model="draftFilters.created_to"
      :label="t('crud.toDate')"
    />
  </CrudFilterPanel>

  <DataTable :columns="columns" :rows="pageData?.data ?? []" :loading="loading">
    <template #cell-translation_display_name="{ row }">{{ localizedDisplayName(row) }}</template>
    <template #cell-permissions="{ row }">
      <BaseBadge variant="primary">{{
        row.permissions?.length ?? 0
      }}</BaseBadge>
    </template>
    <template #cell-is_active="{ value }">
      <StatusBadge :value="value" />
    </template>
    <template #cell-actions="{ row }">
      <RowActions
        :can-edit="canUpdate"
        :can-delete="canDelete"
        :edit-to="{ name: 'roles.edit', params: { id: row.id } }"
        :delete-disabled="deleting"
        @delete="selectedId = row.id"
      />
    </template>
  </DataTable>

  <Pagination v-if="pageData" :meta="pageData" @change="changePage" />

  <ConfirmDialog
    :open="selectedId !== null"
    :title="t('admin.deleteRole')"
    :message="t('admin.deleteRoleMessage')"
    :confirm-label="t('actions.delete')"
    :loading="deleting"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />
</template>
