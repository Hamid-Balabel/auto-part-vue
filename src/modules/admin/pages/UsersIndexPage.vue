<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import ActiveStatusSwitch from '@/components/ui/ActiveStatusSwitch.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import RowActions from '@/components/ui/RowActions.vue'
import { usePermissions } from '@/composables/usePermissions'
import type { Paginated } from '@/types/api'
import { deleteUser, listUsers, toggleUser } from '../api'
import type { User } from '../types'

const { t } = useI18n()
const loading = ref(false)
const deleting = ref(false)
const selectedId = ref<number | null>(null)
const page = ref(1)
const pageData = ref<Paginated<User> | null>(null)
const { can } = usePermissions()

const canCreate = computed(() => can('create-user'))
const canUpdate = computed(() => can('update-user'))
const canDelete = computed(() => can('delete-user'))
const canToggle = computed(() => can('toggle-active-user'))

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
    pageData.value = await listUsers({ page: page.value, per_page: 15 })
  } finally {
    loading.value = false
  }
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

onMounted(load)
</script>

<template>
  <PageHeader :title="t('admin.usersTitle')" :description="t('admin.usersDescription')">
    <template #actions>
      <BaseButton v-if="canCreate" data-testid="users-create" variant="primary" :to="{ name: 'users.create' }">{{ t('admin.createUser') }}</BaseButton>
    </template>
  </PageHeader>

  <DataTable :columns="columns" :rows="pageData?.data ?? []" :loading="loading">
    <template #cell-roles="{ row }">
      <div class="flex flex-wrap gap-1.5">
        <BaseBadge v-for="role in row.roles ?? []" :key="role.id" variant="secondary">
          {{ role.display_name ?? role.name ?? role.id }}
        </BaseBadge>
      </div>
    </template>
    <template #cell-is_active="{ row }">
      <ActiveStatusSwitch :data-testid="`user-status-${row.id}`" :row="row" :can-toggle="canToggle" :toggle="toggleUser" />
    </template>
    <template #cell-actions="{ row }">
      <RowActions :can-edit="canUpdate" :can-delete="canDelete" :edit-to="{ name: 'users.edit', params: { id: row.id } }" :delete-disabled="deleting" @delete="selectedId = row.id" />
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
