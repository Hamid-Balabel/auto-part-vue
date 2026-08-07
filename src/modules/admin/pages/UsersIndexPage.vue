<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CrudFilterPanel from '@/components/ui/CrudFilterPanel.vue'
import CrudToolbar from '@/components/ui/CrudToolbar.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { usePermissions } from '@/composables/usePermissions'
import type { Paginated } from '@/types/api'
import { deleteUser, listRoles, listUsers, toggleUser } from '../api'
import type { Role, User } from '../types'

interface UserFilters {
  gender: string
  role_id: number | null
  is_active: string
  trashed: string
  last_login_from: string
  last_login_to: string
  created_from: string
  created_to: string
}

const emptyFilters = (): UserFilters => ({
  gender: '',
  role_id: null,
  is_active: '',
  trashed: '',
  last_login_from: '',
  last_login_to: '',
  created_from: '',
  created_to: '',
})

const { t } = useI18n()
const loading = ref(false)
const deleting = ref(false)
const selectedId = ref<number | null>(null)
const page = ref(1)
const pageData = ref<Paginated<User> | null>(null)
const search = ref('')
const draftFilters = ref<UserFilters>(emptyFilters())
const appliedFilters = ref<UserFilters>(emptyFilters())
const roles = ref<Role[]>([])
const rolesLoading = ref(false)
const { can } = usePermissions()

const canCreate = computed(() => can('create-user'))
const canUpdate = computed(() => can('update-user'))
const canDelete = computed(() => can('delete-user'))
const canToggle = computed(() => can('toggle-active-user'))
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
    label: role.translation_display_name ?? role.name,
  })),
)
const genderOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'male', label: t('crud.male') },
  { value: 'female', label: t('crud.female') },
])
const statusOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'true', label: t('crud.active') },
  { value: 'false', label: t('crud.inactive') },
])
const trashedOptions = computed(() => [
  { value: '', label: t('crud.all') },
  { value: 'with', label: t('crud.withDeleted') },
  { value: 'only', label: t('crud.onlyDeleted') },
])

const columns = computed<DataTableColumn<User>[]>(() => [
  { key: 'name', label: t('admin.name') },
  { key: 'email', label: t('admin.email') },
  { key: 'roles', label: t('admin.roles') },
  { key: 'is_active', label: t('admin.userStatus') },
  { key: 'actions', label: t('table.actions'), align: 'right' },
])

async function load() {
  loading.value = true
  try {
    const filters = appliedFilters.value
    pageData.value = await listUsers({
      page: page.value,
      per_page: 15,
      ...(search.value.trim() ? { search: search.value.trim() } : {}),
      ...(filters.gender ? { gender: filters.gender } : {}),
      ...(filters.role_id !== null ? { role_id: filters.role_id } : {}),
      ...(filters.is_active ? { is_active: filters.is_active } : {}),
      ...(filters.trashed ? { trashed: filters.trashed } : {}),
      ...(filters.last_login_from
        ? { last_login_from: filters.last_login_from }
        : {}),
      ...(filters.last_login_to
        ? { last_login_to: filters.last_login_to }
        : {}),
      ...(filters.created_from ? { created_from: filters.created_from } : {}),
      ...(filters.created_to ? { created_to: filters.created_to } : {}),
    })
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

async function confirmDelete() {
  if (!selectedId.value) return
  deleting.value = true
  try {
    await deleteUser(selectedId.value)
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
  if (canLoadRoles.value) void loadRoles()
})
</script>

<template>
  <PageHeader
    :title="t('admin.usersTitle')"
    :description="t('admin.usersDescription')"
  >
    <template #actions>
      <BaseButton
        v-if="canCreate"
        data-testid="users-create"
        variant="primary"
        :to="{ name: 'users.create' }"
        >{{ t('admin.createUser') }}</BaseButton
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
    <BaseSelect
      id="user-gender-filter"
      v-model="draftFilters.gender"
      :label="t('crud.gender')"
      :options="genderOptions"
    />
    <BaseSelect
      v-if="canLoadRoles"
      id="user-role-filter"
      v-model="draftFilters.role_id"
      :label="t('crud.role')"
      :options="roleOptions"
      :loading="rolesLoading"
      :placeholder="t('crud.all')"
      searchable
      clearable
    />
    <BaseSelect
      id="user-status-filter"
      v-model="draftFilters.is_active"
      :label="t('crud.status')"
      :options="statusOptions"
    />
    <BaseSelect
      id="user-trashed-filter"
      v-model="draftFilters.trashed"
      :label="t('crud.deletedRecords')"
      :options="trashedOptions"
    />
    <DateInput
      id="user-last-login-from-filter"
      v-model="draftFilters.last_login_from"
      :label="t('crud.lastLoginFrom')"
    />
    <DateInput
      id="user-last-login-to-filter"
      v-model="draftFilters.last_login_to"
      :label="t('crud.lastLoginTo')"
    />
    <DateInput
      id="user-created-from-filter"
      v-model="draftFilters.created_from"
      :label="t('crud.fromDate')"
    />
    <DateInput
      id="user-created-to-filter"
      v-model="draftFilters.created_to"
      :label="t('crud.toDate')"
    />
  </CrudFilterPanel>

  <DataTable :columns="columns" :rows="pageData?.data ?? []" :loading="loading">
    <template #cell-roles="{ row }">
      <div class="flex flex-wrap gap-1.5">
        <BaseBadge
          v-for="role in row.roles ?? []"
          :key="role.id"
          variant="secondary"
        >
          {{ role.display_name ?? role.name ?? role.id }}
        </BaseBadge>
      </div>
    </template>
    <template #cell-is_active="{ row }">
      <ActiveStatusSwitch
        :data-testid="`user-status-${row.id}`"
        :row="row"
        :can-toggle="canToggle"
        :toggle="toggleUser"
      />
    </template>
    <template #cell-actions="{ row }">
      <RowActions
        :can-edit="canUpdate"
        :can-delete="canDelete"
        :edit-to="{ name: 'users.edit', params: { id: row.id } }"
        :delete-disabled="deleting"
        @delete="selectedId = row.id"
      />
    </template>
  </DataTable>

  <Pagination v-if="pageData" :meta="pageData" @change="changePage" />

  <ConfirmDialog
    :open="selectedId !== null"
    :title="t('admin.deleteUser')"
    :message="t('admin.deleteUserMessage')"
    :confirm-label="t('actions.delete')"
    :loading="deleting"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />
</template>
