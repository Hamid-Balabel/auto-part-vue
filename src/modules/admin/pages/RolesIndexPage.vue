<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { usePermissions } from '@/composables/usePermissions'
import type { Paginated } from '@/types/api'
import { deleteRole, listRoles } from '../api'
import type { Role } from '../types'

const { t } = useI18n()
const loading = ref(false)
const deleting = ref(false)
const selectedId = ref<number | null>(null)
const page = ref(1)
const pageData = ref<Paginated<Role> | null>(null)
const { can } = usePermissions()

const canCreate = computed(() => can('create-role'))
const canUpdate = computed(() => can('update-role'))
const canDelete = computed(() => can('delete-role'))

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
    const roles = await listRoles({ page: page.value, per_page: 15 })
    pageData.value = Array.isArray(roles)
      ? { data: roles, current_page: 1, from: roles.length ? 1 : null, last_page: 1, per_page: roles.length, to: roles.length || null, total: roles.length }
      : roles
  } finally {
    loading.value = false
  }
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

onMounted(load)
</script>

<template>
  <PageHeader :title="t('admin.rolesTitle')" :description="t('admin.rolesDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" data-testid="roles-create" variant="primary" :to="{ name: 'roles.create' }">{{ t('admin.createRole') }}</BaseButton>
    </template>
  </PageHeader>

  <DataTable :columns="columns" :rows="pageData?.data ?? []" :loading="loading">
    <template #cell-permissions="{ row }">
      <BaseBadge variant="primary">{{ row.permissions?.length ?? 0 }}</BaseBadge>
    </template>
    <template #cell-is_active="{ value }">
      <StatusBadge :value="value" />
    </template>
    <template #cell-actions="{ row }">
      <RowActions :can-edit="canUpdate" :can-delete="canDelete" :edit-to="{ name: 'roles.edit', params: { id: row.id } }" :delete-disabled="deleting" @delete="selectedId = row.id" />
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
