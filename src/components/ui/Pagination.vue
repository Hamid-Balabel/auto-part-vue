<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PaginationMeta } from '@/types/api'

defineProps<{
  meta: PaginationMeta
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="mt-4 flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-surface px-5 py-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <p class="text-text-muted">
      {{ t('table.showing', { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total }) }}
    </p>
    <div class="flex items-center gap-2">
      <button class="btn-secondary" type="button" :disabled="meta.current_page <= 1" @click="emit('change', meta.current_page - 1)">
        {{ t('actions.previous') }}
      </button>
      <span class="text-text-muted">{{ t('table.page', { current: meta.current_page, last: meta.last_page }) }}</span>
      <button class="btn-secondary" type="button" :disabled="meta.current_page >= meta.last_page" @click="emit('change', meta.current_page + 1)">
        {{ t('actions.next') }}
      </button>
    </div>
  </div>
</template>
