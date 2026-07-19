<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const { t } = useI18n()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div class="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-elevated">
      <h2 class="text-lg font-bold text-text">{{ title }}</h2>
      <p class="mt-2 text-sm text-text-muted">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-2">
        <BaseButton variant="secondary" type="button" @click="emit('close')">{{ t('actions.cancel') }}</BaseButton>
        <BaseButton variant="danger" type="button" :loading="loading" @click="emit('confirm')">
          {{ confirmLabel ?? t('actions.confirm') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
