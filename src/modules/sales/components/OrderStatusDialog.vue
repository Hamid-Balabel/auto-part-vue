<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SalesStatusBadge from './SalesStatusBadge.vue'
import type { OrderActionStatus } from '../orderWorkflow'

const props = defineProps<{
  open: boolean
  status: OrderActionStatus | null
  actionLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [notes: string]
}>()

const notes = ref('')
watch(() => props.open, (open) => { if (open) notes.value = '' })
</script>

<template>
  <div v-if="open && status" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div class="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-elevated">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-text">{{ $t('sales.confirmStatusChange') }}</h2>
        <SalesStatusBadge :value="status" />
      </div>
      <p class="mt-3 text-sm leading-6 text-text-muted">{{ $t(`sales.statusConfirmations.${status}`) }}</p>
      <label class="mt-5 block">
        <span class="form-label">{{ $t('sales.notes') }}</span>
        <textarea v-model="notes" class="form-control mt-1.5 min-h-28 resize-y" maxlength="1500" :placeholder="$t('sales.notesPlaceholder')"></textarea>
      </label>
      <div class="mt-6 flex justify-end gap-2">
        <BaseButton variant="secondary" type="button" @click="emit('close')">{{ $t('actions.cancel') }}</BaseButton>
        <BaseButton :variant="status === 'cancelled' || status === 'refunded' ? 'danger' : 'primary'" type="button" :loading="loading" @click="emit('confirm', notes)">{{ actionLabel ?? $t(`sales.statusActions.${status}`) }}</BaseButton>
      </div>
    </div>
  </div>
</template>
