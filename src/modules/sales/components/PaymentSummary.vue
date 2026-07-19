<script setup lang="ts">
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import type { Order } from '../types'
import SalesStatusBadge from './SalesStatusBadge.vue'

defineProps<{ order: Order }>()
</script>

<template>
  <dl class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div class="rounded-[var(--radius-md)] border border-border bg-surface p-3"><dt class="text-xs font-semibold text-text-muted">{{ $t('sales.total') }}</dt><dd class="mt-1"><MoneyDisplay :value="order.total" currency="EGP" /></dd></div>
    <div class="rounded-[var(--radius-md)] border border-border bg-surface p-3"><dt class="text-xs font-semibold text-text-muted">{{ $t('sales.paidAmount') }}</dt><dd class="mt-1"><MoneyDisplay :value="order.paid_amount" currency="EGP" /></dd></div>
    <div class="rounded-[var(--radius-md)] border border-border bg-surface p-3"><dt class="text-xs font-semibold text-text-muted">{{ $t('sales.remainingAmount') }}</dt><dd class="mt-1"><MoneyDisplay :value="order.remaining_amount" currency="EGP" /></dd></div>
    <div class="rounded-[var(--radius-md)] border border-border bg-surface p-3"><dt class="text-xs font-semibold text-text-muted">{{ $t('sales.paymentStatus') }}</dt><dd class="mt-1 flex flex-wrap items-center gap-2"><SalesStatusBadge :value="order.payment_status" /><span class="text-xs text-text-muted">{{ $t(`sales.paymentMethods.${order.payment_method}`) }}</span></dd></div>
  </dl>
</template>
