<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormInput from '@/components/forms/FormInput.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import type { PaymentMethod } from '../types'

const props = defineProps<{ open: boolean; total: number | string; paid: number | string; remaining: number | string; loading?: boolean; backendError?: string }>()
const emit = defineEmits<{ close: []; confirm: [payload: { amount: number; payment_method: Exclude<PaymentMethod, 'transfer'> }] }>()
const amount = ref<number | string>('')
const paymentMethod = ref<Exclude<PaymentMethod, 'transfer'>>('cash')
const localError = computed(() => {
  const value = Number(amount.value)
  if (amount.value === '') return undefined
  if (!Number.isFinite(value) || value <= 0) return 'positive'
  if (value > Number(props.remaining)) return 'exceeds'
  return undefined
})
const methods = [{ value: 'cash', label: 'cash' }, { value: 'card', label: 'card' }]

watch(() => props.open, (open) => {
  if (open) {
    amount.value = ''
    paymentMethod.value = 'cash'
  }
})

function confirm() {
  if (localError.value || !amount.value) return
  emit('confirm', { amount: Number(amount.value), payment_method: paymentMethod.value })
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form class="w-full max-w-lg rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-elevated" @submit.prevent="confirm">
      <h2 class="text-lg font-bold text-text">{{ $t('sales.addPayment') }}</h2>
      <div class="mt-4 grid grid-cols-3 gap-3 text-sm"><div><p class="text-text-muted">{{ $t('sales.total') }}</p><MoneyDisplay :value="total" currency="EGP" /></div><div><p class="text-text-muted">{{ $t('sales.paidAmount') }}</p><MoneyDisplay :value="paid" currency="EGP" /></div><div><p class="text-text-muted">{{ $t('sales.remainingAmount') }}</p><MoneyDisplay :value="remaining" currency="EGP" /></div></div>
      <div class="mt-5 grid gap-4">
        <FormInput id="new-payment-amount" v-model="amount" :label="$t('sales.paymentAmount')" type="number" :error="localError === 'positive' ? $t('sales.validation.positivePayment') : localError === 'exceeds' ? $t('sales.validation.paymentExceedsRemaining') : backendError" required />
        <SelectInput id="new-payment-method" v-model="paymentMethod" :label="$t('sales.paymentMethod')" :options="methods.map((item) => ({ value: item.value, label: $t(`sales.paymentMethods.${item.label}`) }))" required />
      </div>
      <div class="mt-6 flex justify-end gap-2"><BaseButton variant="secondary" type="button" @click="emit('close')">{{ $t('actions.cancel') }}</BaseButton><BaseButton type="submit" :loading="loading" :disabled="Boolean(localError) || !amount">{{ $t('sales.recordPayment') }}</BaseButton></div>
    </form>
  </div>
</template>
