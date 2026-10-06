<script setup lang="ts">
import { useLocalizedName } from "@/composables/useLocalizedName";
import { ImageOff, Search, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import type { Product, ProductItem, Stock } from '@/modules/inventory/types'

const props = defineProps<{
  product?: Product | null
  items: ProductItem[]
  loading?: boolean
}>()

const translatedName = useLocalizedName()

const emit = defineEmits<{
  close: []
  addItem: [item: ProductItem]
}>()

const itemSearch = ref('')

watch(
  () => props.product?.id,
  () => {
    itemSearch.value = ''
  },
)

function itemProduct(item: ProductItem) {
  return item.product ?? props.product
}

function itemOptions(item: ProductItem) {
  return (item.option_values ?? item.optionValues ?? [])
    .map((option) => {
      const name = translatedName(option.product_option ?? option.productOption)
      const value = translatedName(option)
      return name === '—' ? value : `${name}: ${value}`
    })
    .filter((value) => value !== '—' && !value.endsWith(': —'))
    .join(' · ')
}

function itemImage(item: ProductItem) {
  return item.images?.[0]?.path?.replace(
    'https://auto-part.test/',
    'http://auto-part.test/',
  )
}

function availableStocks(item: ProductItem): Stock[] {
  return (item.stocks ?? []).filter(
    (stock) =>
      stock.warehouse?.is_active !== false && Number(stock.quantity) > 0,
  )
}

function effectiveMaxDiscount(item: ProductItem) {
  return item.effective_max_discount ?? '0.00'
}

const filteredItems = computed(() => {
  const query = itemSearch.value.trim().toLocaleLowerCase()
  if (!query) return props.items
  return props.items.filter((item) =>
    [
      item.sku,
      item.movement_code,
      item.barcode,
      itemOptions(item),
    ].some((value) =>
      String(value ?? '')
        .toLocaleLowerCase()
        .includes(query),
    ),
  )
})

function addExactSku() {
  const sku = itemSearch.value.trim().toLocaleLowerCase()
  if (!sku) return

  const item = props.items.find(
    (candidate) => [candidate.sku, candidate.movement_code, candidate.barcode].some((value) => value?.toLocaleLowerCase() === sku),
  )
  if (!item || !availableStocks(item).length) return

  emit('addItem', item)
  itemSearch.value = ''
}
</script>

<template>
  <Transition name="quick-sale-drawer">
    <div
      v-if="product"
      class="absolute inset-0 z-20 flex min-h-0 items-end bg-text/15 backdrop-blur-[1px]"
      data-testid="product-item-picker"
      @click.self="emit('close')"
    >
      <section
        class="flex max-h-[88%] min-h-0 w-full flex-col overflow-hidden rounded-t-[var(--radius-xl)] border border-border bg-surface shadow-elevated"
      >
        <header
          class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5"
        >
          <div class="min-w-0">
            <p
              class="text-xs font-semibold uppercase tracking-wide text-secondary"
            >
              {{ $t('sales.productItems') }}
            </p>
            <h2 class="mt-1 truncate text-lg font-bold text-text">
              {{ translatedName(product) }}
            </h2>
          </div>
          <BaseButton
            class="shrink-0"
            variant="ghost"
            size="sm"
            type="button"
            :aria-label="$t('common.close')"
            @click="emit('close')"
          >
            <X class="size-4" />{{ $t('common.close') }}
          </BaseButton>
        </header>

        <div class="shrink-0 border-b border-border p-4">
          <label class="form-label" for="order-item-search">{{
            $t('sales.searchProductItems')
          }}</label>
          <div class="relative mt-2">
            <Search
              class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            />
            <input
              id="order-item-search"
              v-model="itemSearch"
              class="form-control ps-10"
              type="search"
              :placeholder="$t('sales.searchProductItemsPlaceholder')"
              @keydown.enter.prevent="addExactSku"
            />
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <div v-if="loading" class="grid gap-3 md:grid-cols-2">
            <div
              v-for="index in 4"
              :key="index"
              class="h-36 animate-pulse rounded-[var(--radius-xl)] bg-neutral-soft"
            />
          </div>
          <EmptyState
            v-else-if="!filteredItems.length"
            :title="$t('sales.noProductItems')"
            :message="$t('sales.noProductItemsMessage')"
          />
          <div v-else class="grid gap-3 md:grid-cols-2">
            <article
              v-for="item in filteredItems"
              :key="item.id"
              class="min-w-0 rounded-[var(--radius-xl)] border border-border p-4"
              :data-testid="`quick-sale-picker-item-${item.id}`"
            >
              <div class="flex min-w-0 gap-3">
                <div
                  class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-background"
                >
                  <img
                    v-if="itemImage(item)"
                    :src="itemImage(item)"
                    :alt="item.sku"
                    class="size-full object-cover"
                  />
                  <ImageOff v-else class="size-5 text-text-muted" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="flex min-w-0 items-baseline gap-2 font-bold text-text">
                    <span class="truncate">{{ translatedName(itemProduct(item)) }}</span>
                    <span
                      v-if="item.movement_code"
                      class="shrink-0 text-xs font-semibold text-text-muted"
                      >{{ item.movement_code }}</span
                    >
                  </p>
                  <p class="mt-0.5 truncate text-xs text-text-muted">
                    {{ [item.sku, itemOptions(item)].filter(Boolean).join(' · ') }}
                  </p>
                </div>
              </div>

              <div class="mt-3 border-t border-border pt-3">
                <p class="text-xs font-semibold text-text-muted">
                  {{ $t('sales.warehouseAvailability') }}
                </p>
                <div
                  v-if="availableStocks(item).length"
                  class="mt-2 grid gap-1.5"
                >
                  <div
                    v-for="stock in availableStocks(item)"
                    :key="stock.warehouse_id"
                    class="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-background px-2.5 py-2 text-xs"
                  >
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-semibold text-text">{{
                        translatedName(stock.warehouse)
                      }}</span>
                      <span class="block truncate text-text-muted">{{
                        translatedName(stock.warehouse?.branch)
                      }}</span>
                    </span>
                    <BaseBadge v-if="stock.warehouse?.is_current" variant="primary">{{
                      $t('inventory.currentBranchMarker')
                    }}</BaseBadge>
                    <span
                      class="shrink-0 font-semibold tabular-nums text-success"
                      >{{
                        $t('sales.stockAvailable', { count: stock.quantity })
                      }}</span
                    >
                  </div>
                </div>
                <p v-else class="mt-2 text-xs text-danger">
                  {{ $t('sales.noWarehouseStock') }}
                </p>
              </div>

              <div
                class="mt-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <MoneyDisplay :value="item.current_price" currency="EGP" />
                  <p class="mt-1 text-xs text-text-muted">
                    {{ $t('sales.effectiveMaxDiscount') }}:
                    <MoneyDisplay :value="effectiveMaxDiscount(item)" currency="EGP" />
                  </p>
                </div>
                <BaseButton
                  size="sm"
                  type="button"
                  :disabled="
                    item.is_active === false || !availableStocks(item).length
                  "
                  @click="emit('addItem', item)"
                  >{{ $t('sales.addToOrder') }}</BaseButton
                >
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.quick-sale-drawer-enter-active,
.quick-sale-drawer-leave-active {
  transition: opacity 220ms ease;
}

.quick-sale-drawer-enter-active > section,
.quick-sale-drawer-leave-active > section {
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.quick-sale-drawer-enter-from,
.quick-sale-drawer-leave-to {
  opacity: 0;
}

.quick-sale-drawer-enter-from > section,
.quick-sale-drawer-leave-to > section {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .quick-sale-drawer-enter-active,
  .quick-sale-drawer-leave-active,
  .quick-sale-drawer-enter-active > section,
  .quick-sale-drawer-leave-active > section {
    transition-duration: 1ms;
  }
}
</style>
