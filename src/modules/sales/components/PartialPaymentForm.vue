<script setup lang="ts">
import FormInput from '@/components/forms/FormInput.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'

defineProps<{ amount: string | number; method: 'cash' | 'card'; total: number; remaining: number; error?: string }>()
const emit = defineEmits<{ 'update:amount': [value: string]; 'update:method': [value: 'cash' | 'card'] }>()
const methods = [{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }]
</script>

<template>
  <div class="grid gap-4 rounded-[var(--radius-lg)] border border-secondary/25 bg-secondary-soft/45 p-4">
    <FormInput id="initial-paid-amount" :model-value="amount" :label="$t('sales.initialPaidAmount')" type="number" :error="error" required @update:model-value="emit('update:amount', $event)" />
    <SelectInput id="initial-payment-method" :model-value="method" :label="$t('sales.initialPaymentMethod')" :options="methods.map((item) => ({ ...item, label: $t(`sales.paymentMethods.${item.value}`) }))" required @update:model-value="emit('update:method', $event as 'cash' | 'card')" />
    <dl class="grid grid-cols-2 gap-3 text-sm"><div><dt class="text-text-muted">{{ $t('sales.total') }}</dt><dd><MoneyDisplay :value="total" currency="EGP" /></dd></div><div><dt class="text-text-muted">{{ $t('sales.remainingAmount') }}</dt><dd><MoneyDisplay :value="remaining" currency="EGP" /></dd></div></dl>
  </div>
</template>
