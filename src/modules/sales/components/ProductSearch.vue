<script setup lang="ts">
import { Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useLocalizedName } from '@/composables/useLocalizedName'
import type { ProductItem } from '@/modules/inventory/types'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'

const props = defineProps<{ products: ProductItem[]; loading?: boolean }>()
const emit = defineEmits<{ select: [item: ProductItem] }>()
const query = ref('')
const localizedName = useLocalizedName()

function productName(item: ProductItem) {
  return localizedName(item.product, item.sku)
}

const results = computed(() => {
  const value = query.value.trim().toLowerCase()
  if (!value) return []
  return props.products.filter((item) => [productName(item), item.sku].some((field) => String(field ?? '').toLowerCase().includes(value))).slice(0, 12)
})

function select(item: ProductItem) {
  emit('select', item)
  query.value = ''
}
</script>

<template>
  <div class="relative">
    <label class="form-label" for="quick-sale-search">{{ $t('sales.searchProducts') }}</label>
    <div class="relative mt-1.5">
      <Search class="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
      <input id="quick-sale-search" v-model="query" class="form-control ps-11" type="search" autocomplete="off" :placeholder="$t('sales.searchProductsPlaceholder')" :disabled="loading" data-testid="quick-sale-search" />
    </div>
    <div v-if="query" class="absolute z-40 mt-2 max-h-96 w-full overflow-y-auto rounded-[var(--radius-xl)] border border-border bg-surface p-2 shadow-elevated">
      <button v-for="item in results" :key="item.id" class="flex w-full items-center justify-between gap-4 rounded-[var(--radius-lg)] px-3 py-3 text-start transition hover:bg-primary-soft" type="button" @click="select(item)">
        <span class="min-w-0"><span class="block truncate font-bold text-text">{{ productName(item) }}</span><span class="block text-xs text-text-muted">{{ item.sku }}</span></span>
        <span class="shrink-0 text-end"><MoneyDisplay :value="item.current_price" currency="EGP" /><span class="block text-xs text-text-muted">{{ $t('sales.stockAvailable', { count: item.total_stock ?? 0 }) }}</span></span>
      </button>
      <p v-if="!results.length" class="px-3 py-6 text-center text-sm text-text-muted">{{ $t('sales.noProductsFound') }}</p>
    </div>
  </div>
</template>
