<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import type { QuickSaleLine } from '../types'
import ProductItemIdentity from './ProductItemIdentity.vue'
import QuantityControl from './QuantityControl.vue'

defineProps<{ lines: QuickSaleLine[] }>()
const emit = defineEmits<{ quantity: [itemId: number, quantity: number]; remove: [itemId: number] }>()
</script>

<template>
  <EmptyState v-if="!lines.length" :title="$t('sales.noSaleItems')" :message="$t('sales.searchToAddItems')" />
  <div v-else class="panel overflow-hidden">
    <div v-for="line in lines" :key="line.item.id" class="grid gap-4 border-b border-border p-4 last:border-0 md:grid-cols-[minmax(220px,1fr)_auto_auto_auto] md:items-center">
      <ProductItemIdentity :item="line.item" />
      <div><p class="text-xs text-text-muted">{{ $t('sales.unitPrice') }}</p><MoneyDisplay :value="line.item.current_price" currency="EGP" /></div>
      <QuantityControl :model-value="line.quantity" :label="$t('sales.quantityFor', { sku: line.item.sku })" @update:model-value="emit('quantity', line.item.id, $event)" />
      <div class="flex items-center justify-between gap-3 md:justify-end"><div><p class="text-xs text-text-muted">{{ $t('sales.lineTotal') }}</p><MoneyDisplay :value="Number(line.item.current_price ?? 0) * line.quantity" currency="EGP" /></div><BaseButton variant="danger" size="sm" type="button" :aria-label="$t('actions.delete')" :title="$t('actions.delete')" @click="emit('remove', line.item.id)"><Trash2 class="size-4" /></BaseButton></div>
    </div>
  </div>
</template>
