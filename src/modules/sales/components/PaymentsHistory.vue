<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import type { Installment } from '../types'
import SalesStatusBadge from './SalesStatusBadge.vue'

defineProps<{ payments: Installment[] }>()
const { locale } = useI18n()
function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
}
</script>

<template>
  <div v-if="payments.length" class="overflow-x-auto">
    <table class="min-w-[680px] divide-y divide-border text-sm">
      <thead><tr class="text-text-muted"><th class="px-3 py-3 text-start">{{ $t('sales.paymentAmount') }}</th><th class="px-3 py-3 text-start">{{ $t('sales.paymentMethod') }}</th><th class="px-3 py-3 text-start">{{ $t('sales.paymentDate') }}</th><th class="px-3 py-3 text-start">{{ $t('sales.recordedBy') }}</th><th class="px-3 py-3 text-start">{{ $t('sales.paymentStatus') }}</th></tr></thead>
      <tbody class="divide-y divide-border"><tr v-for="payment in payments" :key="payment.id"><td class="px-3 py-3"><MoneyDisplay :value="payment.amount" currency="EGP" /></td><td class="px-3 py-3">{{ $t(`sales.paymentMethods.${payment.payment_method}`) }}</td><td class="px-3 py-3">{{ formatDate(payment.paid_at ?? payment.created_at) }}</td><td class="px-3 py-3">{{ payment.creator?.name ?? '—' }}</td><td class="px-3 py-3"><SalesStatusBadge :value="payment.status" /></td></tr></tbody>
    </table>
  </div>
  <p v-else class="text-sm text-text-muted">{{ $t('sales.noPayments') }}</p>
</template>
