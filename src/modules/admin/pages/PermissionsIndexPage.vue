<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import type { Paginated } from '@/types/api'
import { listPermissions } from '../api'
import type { Permission } from '../types'

const { t } = useI18n()
const loading = ref(false)
const page = ref(1)
const pageData = ref<Paginated<Permission> | null>(null)

const columns = computed<DataTableColumn<Permission>[]>(() => [
  { key: 'translation_display_name', label: t('admin.displayName') },
  { key: 'name', label: t('admin.key') },
  { key: 'display_group', label: t('admin.group') },
])

async function load() {
  loading.value = true
  try {
    const permissions = await listPermissions({ page: page.value, per_page: 20 })
    pageData.value = Array.isArray(permissions)
      ? { data: permissions, current_page: 1, from: permissions.length ? 1 : null, last_page: 1, per_page: permissions.length, to: permissions.length || null, total: permissions.length }
      : permissions
  } finally {
    loading.value = false
  }
}

function changePage(nextPage: number) {
  page.value = nextPage
  void load()
}

onMounted(load)
</script>

<template>
  <PageHeader :title="t('admin.permissionsTitle')" :description="t('admin.permissionsDescription')" />

  <DataTable :columns="columns" :rows="pageData?.data ?? []" :loading="loading" />
  <Pagination v-if="pageData" :meta="pageData" @change="changePage" />
</template>
