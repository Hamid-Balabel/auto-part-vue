<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="panel p-8">
    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-danger">{{ t('states.forbiddenLabel') }}</p>
    <h1 class="mt-3 text-2xl font-bold text-text">{{ t('states.forbiddenTitle') }}</h1>
    <p class="mt-2 text-sm text-text-muted">{{ t('states.forbiddenDescription') }}</p>
  </div>
</template>
