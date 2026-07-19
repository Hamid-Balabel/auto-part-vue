<script setup lang="ts">
import { PackageOpen } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title?: string
  message?: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="panel flex min-h-52 flex-col items-center justify-center p-8 text-center">
    <div class="mb-4 rounded-[var(--radius-xl)] bg-primary-soft p-4 text-primary">
      <PackageOpen class="size-7" />
    </div>
    <p class="text-base font-semibold text-text">{{ title ?? t('states.emptyTitle') }}</p>
    <p class="mt-1 max-w-md text-sm text-text-muted">
      {{ message ?? t('states.emptyMessage') }}
    </p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
