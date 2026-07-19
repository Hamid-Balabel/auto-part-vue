<script setup lang="ts">
import { Banknote, CreditCard, Split } from '@lucide/vue'
import type { Component } from 'vue'
import type { QuickSalePaymentMode } from '../types'

defineProps<{ modelValue: QuickSalePaymentMode; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: QuickSalePaymentMode] }>()
const options: Array<{ value: QuickSalePaymentMode; icon: Component }> = [
  { value: 'cash', icon: Banknote },
  { value: 'card', icon: CreditCard },
  { value: 'partial', icon: Split },
]
</script>

<template>
  <fieldset>
    <legend class="form-label">{{ $t('sales.paymentMethod') }}</legend>
    <div class="mt-2 grid grid-cols-3 gap-2">
      <button v-for="option in options" :key="option.value" class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border px-2 py-3 text-xs font-bold transition" :class="modelValue === option.value ? 'border-primary bg-primary-soft text-primary ring-1 ring-primary/20' : 'border-border bg-surface text-text-muted hover:border-primary/40'" type="button" :disabled="disabled" @click="emit('update:modelValue', option.value)"><component :is="option.icon" class="size-5" /><span>{{ $t(`sales.salePaymentModes.${option.value}`) }}</span></button>
    </div>
  </fieldset>
</template>
