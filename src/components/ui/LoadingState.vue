<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="panel flex min-h-44 items-center justify-center p-8 text-sm text-text-muted">
    <div class="flex items-center gap-3">
      <span class="size-2.5 animate-pulse rounded-full bg-primary"></span>
      <span>{{ t('states.loading') }}</span>
    </div>
  </div>
</template>
