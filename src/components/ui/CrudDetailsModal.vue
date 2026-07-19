<script setup lang="ts">
import { X } from '@lucide/vue'
import BaseButton from './BaseButton.vue'

defineProps<{
  open: boolean
  title: string
  subtitle?: string
  loading?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true">
    <div class="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-elevated">
      <header class="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div class="min-w-0">
          <h2 class="truncate text-xl font-bold text-text">{{ title }}</h2>
          <p v-if="subtitle" class="mt-1 text-sm text-text-muted">{{ subtitle }}</p>
        </div>
        <BaseButton variant="ghost" size="sm" type="button" :aria-label="$t('common.close')" @click="emit('close')">
          <X class="size-5" aria-hidden="true" />
        </BaseButton>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div v-if="loading" class="grid gap-4 md:grid-cols-2">
          <div v-for="index in 6" :key="index" class="h-28 animate-pulse rounded-[var(--radius-lg)] bg-background"></div>
        </div>
        <div v-else-if="errorMessage" class="rounded-[var(--radius-lg)] border border-danger/30 bg-danger/10 p-4 text-sm font-semibold text-danger">
          {{ errorMessage }}
        </div>
        <slot v-else />
      </div>
    </div>
  </div>
</template>
