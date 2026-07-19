<script setup lang="ts">
import { Boxes, ChartNoAxesCombined, Settings2 } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { t } = useI18n()

const cards = computed(() => [
  { label: t('dashboard.inventoryLabel'), value: t('dashboard.inventoryValue'), icon: Boxes },
  { label: t('dashboard.salesLabel'), value: t('dashboard.salesValue'), icon: ChartNoAxesCombined },
  { label: t('dashboard.adminLabel'), value: t('dashboard.adminValue'), icon: Settings2 },
])
</script>

<template>
  <PageHeader
    :title="t('dashboard.title')"
    :description="t('dashboard.description')"
  />

  <div class="grid gap-5 md:grid-cols-3">
    <div v-for="card in cards" :key="card.label" class="panel group p-6 transition duration-300 hover:-translate-y-1 hover:shadow-elevated">
      <div class="mb-5 flex size-12 items-center justify-center rounded-[var(--radius-lg)] bg-secondary-soft text-secondary-hover ring-1 ring-secondary/20 transition group-hover:scale-105">
        <component :is="card.icon" class="size-5" />
      </div>
      <p class="text-sm font-medium text-text-muted">{{ card.label }}</p>
      <p class="mt-3 text-xl font-bold text-text">{{ card.value }}</p>
    </div>
  </div>

  <div class="panel mt-6 p-6">
    <h2 class="text-lg font-bold text-text">{{ t('dashboard.session') }}</h2>
    <p class="mt-2 text-sm text-text-muted">{{ t('dashboard.signedInAs', { name: auth.user?.name ?? t('common.user') }) }}</p>
    <p class="mt-1 text-sm leading-6 text-text-muted">{{ t('dashboard.permissionNotice') }}</p>
  </div>
</template>
