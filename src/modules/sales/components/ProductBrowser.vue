<script setup lang="ts">
import { useLocalizedName } from "@/composables/useLocalizedName";
import { PackageSearch, Search } from '@lucide/vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Product, ProductItem } from '@/modules/inventory/types'
import QuickSaleProductItemsDrawer from './QuickSaleProductItemsDrawer.vue'

defineProps<{
  products: Product[]
  selectedProduct?: Product | null
  selectedItems: ProductItem[]
  loading?: boolean
  itemsLoading?: boolean
  scanning?: boolean
  hasMore?: boolean
  search: string
}>()

const translatedName = useLocalizedName()

const emit = defineEmits<{
  'update:search': [value: string]
  selectProduct: [product: Product]
  closeProduct: []
  addItem: [item: ProductItem]
  scan: [value: string]
  loadMore: []
}>()

</script>

<template>
  <section
    class="panel relative isolate flex h-[min(72vh,48rem)] min-h-[32rem] min-w-0 flex-col overflow-hidden"
    data-testid="quick-sale-product-browser"
  >
    <div
      class="shrink-0 border-b border-border bg-gradient-to-br from-primary-soft/70 to-surface p-4 sm:p-5"
    >
      <label class="form-label" for="order-product-search">{{
        $t('sales.searchProducts')
      }}</label>
      <div class="relative mt-2">
        <Search
          class="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-primary"
        />
        <input
          id="order-product-search"
          class="form-control h-12 ps-12 text-base"
          type="search"
          autocomplete="off"
          :value="search"
          :placeholder="$t('sales.searchQuickSaleProducts')"
          data-testid="order-product-search"
          :aria-busy="scanning"
          @input="
            emit('update:search', ($event.target as HTMLInputElement).value)
          "
          @keydown.enter.prevent="
            emit('scan', ($event.target as HTMLInputElement).value)
          "
        />
      </div>
      <p class="mt-2 text-xs text-text-muted">
        {{ $t('sales.productSearchNotice') }}
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div
        v-if="loading && !products.length"
        class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="index in 6"
          :key="index"
          class="h-44 animate-pulse rounded-[var(--radius-xl)] bg-neutral-soft"
        />
      </div>
      <EmptyState
        v-else-if="!products.length"
        class="m-4"
        :title="$t('sales.noProductsFound')"
        :message="$t('sales.noProducts')"
      />
      <div v-else class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="product in products"
          :key="product.id"
          class="group min-h-40 min-w-0 rounded-[var(--radius-xl)] border bg-surface p-4 text-start transition hover:-translate-y-0.5 hover:border-primary hover:shadow-card"
          :class="
            selectedProduct?.id === product.id
              ? 'border-primary ring-2 ring-primary/15'
              : 'border-border'
          "
          type="button"
          @click="emit('selectProduct', product)"
        >
          <div class="flex items-start justify-between gap-3">
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary-soft text-primary"
            >
              <PackageSearch class="size-6" />
            </div>
            <span
              class="shrink-0 rounded-full bg-neutral-soft px-2.5 py-1 text-xs font-semibold text-neutral"
              >{{
                product.is_active === false
                  ? $t('dataEntry.inactive')
                  : $t('dataEntry.active')
              }}</span
            >
          </div>
          <h3
            class="mt-4 line-clamp-2 break-words font-bold text-text group-hover:text-primary"
          >
            {{ translatedName(product) }}
          </h3>
          <p class="mt-2 truncate text-xs text-text-muted">
            {{
              [translatedName(product.category), translatedName(product.brand)]
                .filter((value) => value !== '—')
                .join(' · ') || $t('sales.selectProductItems')
            }}
          </p>
        </button>
      </div>
      <div v-if="hasMore" class="border-t border-border p-4 text-center">
        <BaseButton
          variant="outline"
          type="button"
          :loading="loading"
          @click="emit('loadMore')"
          >{{ $t('sales.loadMoreProducts') }}</BaseButton
        >
      </div>
    </div>

    <QuickSaleProductItemsDrawer
      :product="selectedProduct"
      :items="selectedItems"
      :loading="itemsLoading"
      @close="emit('closeProduct')"
      @add-item="emit('addItem', $event)"
    />
  </section>
</template>
