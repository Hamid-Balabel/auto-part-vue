<script setup lang="ts">
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'

defineProps<{
  subtotal: number | string
  discount?: number | string
  total: number | string
  paid?: number | string
  remaining?: number | string
}>()
</script>

<template>
  <section class="panel p-5">
    <h2 class="text-base font-bold text-text">{{ $t('sales.orderSummary') }}</h2>
    <dl class="mt-4 divide-y divide-border text-sm">
      <div class="flex items-center justify-between py-3"><dt class="text-text-muted">{{ $t('sales.subtotal') }}</dt><dd><MoneyDisplay :value="subtotal" currency="EGP" /></dd></div>
      <div v-if="discount !== undefined" class="flex items-center justify-between py-3"><dt class="text-text-muted">{{ $t('sales.discount') }}</dt><dd><MoneyDisplay :value="discount" currency="EGP" /></dd></div>
      <div v-if="paid !== undefined" class="flex items-center justify-between py-3"><dt class="text-text-muted">{{ $t('sales.paidAmount') }}</dt><dd><MoneyDisplay :value="paid" currency="EGP" /></dd></div>
      <div v-if="remaining !== undefined" class="flex items-center justify-between py-3"><dt class="text-text-muted">{{ $t('sales.remainingAmount') }}</dt><dd><MoneyDisplay :value="remaining" currency="EGP" /></dd></div>
      <div class="flex items-center justify-between pt-4 text-base"><dt class="font-bold text-text">{{ $t('sales.total') }}</dt><dd class="text-lg"><MoneyDisplay :value="total" currency="EGP" /></dd></div>
    </dl>
    <p class="mt-4 rounded-[var(--radius-md)] bg-secondary-soft p-3 text-xs leading-5 text-secondary-hover">{{ $t('sales.backendTotalsNotice') }}</p>
  </section>
</template>
