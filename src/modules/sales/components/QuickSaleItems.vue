<script setup lang="ts">
import { RefreshCw, RotateCcw, Trash2 } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { useLocalizedName } from '@/composables/useLocalizedName'
import SearchableSelectInput from '@/components/forms/SearchableSelectInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import type { Warehouse } from '@/modules/inventory/types'
import type { QuickSaleLine } from '../types'
import ProductItemIdentity from './ProductItemIdentity.vue'
import QuantityControl from './QuantityControl.vue'

defineProps<{
  lines: QuickSaleLine[]
  canEditPrice?: boolean
  priceLocked?: boolean
  errors?: Record<string, string[]>
  syncingStock?: boolean
}>()

const emit = defineEmits<{
  quantity: [lineId: string, quantity: number]
  warehouse: [lineId: string, warehouseId: number | null]
  price: [lineId: string, price: string]
  resetPrice: [lineId: string]
  remove: [lineId: string]
  sync: []
}>()

const { t } = useI18n()
const localizedName = useLocalizedName()

function toCents(value: string | number) {
  const match = String(value).trim().match(/^(\d+)(?:\.(\d{1,2}))?$/)
  if (!match) return null
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
}

function isCustomPrice(line: QuickSaleLine) {
  return toCents(line.unitPrice) !== toCents(line.systemPrice)
}

function lineTotal(line: QuickSaleLine) {
  return Math.max(0, grossLineTotal(line) - (toCents(line.discount) ?? 0)) / 100
}

function grossLineTotal(line: QuickSaleLine) {
  return (toCents(line.unitPrice) ?? 0) * line.quantity
}

function maxDiscount(line: QuickSaleLine) {
  return ((toCents(line.item.effective_max_discount ?? 0) ?? 0) / 100).toFixed(2)
}

function warehouseName(warehouse?: Warehouse | null) {
  return localizedName(warehouse)
}

function branchName(warehouse?: Warehouse | null) {
  return localizedName(warehouse?.branch)
}

function warehouseOptions(line: QuickSaleLine) {
  return line.warehouseStocks.map((stock) => ({
    value: stock.warehouse_id,
    label: t('sales.warehouseOptionLabel', {
      warehouse: warehouseName(stock.warehouse),
      branch: branchName(stock.warehouse),
      count: stock.quantity,
    }),
    meta: stock.warehouse?.is_current
      ? t('inventory.currentBranchMarker')
      : undefined,
    searchText: `${warehouseName(stock.warehouse)} ${branchName(stock.warehouse)}`,
  }))
}

function fieldError(errors: string[] | undefined) {
  const value = errors?.[0]
  if (value === 'warehouseRequired')
    return t('sales.validation.warehouseRequired')
  if (value === 'warehouseUnavailable')
    return t('sales.validation.warehouseUnavailable')
  if (value === 'stockExceeded') return t('sales.validation.stockExceeded')
  if (value === 'invalidPrice') return t('sales.validation.invalidPrice')
  if (value === 'invalidDiscount') return t('sales.validation.invalidDiscount')
  if (value === 'discountExceedsMax') return t('sales.validation.discountExceedsMax')
  if (value === 'discountExceedsSubtotal')
    return t('sales.validation.discountExceedsSubtotal')
  return value
}

function hasStockConflict(line: QuickSaleLine) {
  return (
    Boolean(line.warehouseId) &&
    (line.availableQuantity <= 0 || line.quantity > line.availableQuantity)
  )
}
</script>

<template>
  <EmptyState
    v-if="!lines.length"
    :title="$t('sales.noSaleItems')"
    :message="$t('sales.searchToAddItems')"
  />
  <section
    v-else
    class="panel flex max-h-[min(62vh,42rem)] min-w-0 flex-col overflow-hidden"
    data-testid="order-summary-items"
  >
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background/60 px-4 py-3"
    >
      <h2 class="font-bold text-text">{{ $t('sales.currentOrder') }}</h2>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="outline"
          size="sm"
          type="button"
          :loading="syncingStock"
          :disabled="syncingStock"
          data-testid="sync-quick-sale-stock"
          @click="emit('sync')"
        >
          <RefreshCw v-if="!syncingStock" class="size-3.5" />
          {{ $t('sales.syncStock') }}
        </BaseButton>
        <BaseBadge variant="primary">{{
          $t('sales.itemsSelected', { count: lines.length })
        }}</BaseBadge>
      </div>
    </div>

    <div
      class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
    >
      <article
        v-for="(line, index) in lines"
        :key="line.lineId"
        class="min-w-0 border-b border-border p-3 last:border-0 sm:p-4"
        :class="hasStockConflict(line) ? 'bg-danger-soft/60' : ''"
        :data-testid="`quick-sale-line-${index}`"
      >
        <div class="flex min-w-0 items-start gap-2">
          <div class="min-w-0 flex-1">
            <ProductItemIdentity :item="line.item" quick-sale-title />
          </div>
          <BaseButton
            class="shrink-0"
            variant="ghost"
            size="sm"
            type="button"
            :aria-label="$t('actions.delete')"
            :title="$t('actions.delete')"
            @click="emit('remove', line.lineId)"
            ><Trash2 class="size-4 text-danger"
          /></BaseButton>
        </div>

        <div
          class="mt-3 grid min-w-0 gap-3 rounded-[var(--radius-lg)] bg-background p-3"
        >
          <div
            v-if="hasStockConflict(line)"
            class="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft p-3 text-sm text-danger sm:col-span-2"
            role="alert"
          >
            <p v-if="line.availableQuantity <= 0" class="font-semibold">
              {{ $t('sales.stockUnavailableNow') }}
            </p>
            <p v-else class="font-semibold">
              {{ $t('sales.stockChanged') }}
            </p>
            <p class="mt-1">
              {{ $t('sales.requestedQuantity', { count: line.quantity }) }} ·
              {{
                $t('sales.availableQuantityNow', {
                  count: line.availableQuantity,
                })
              }}
            </p>
          </div>
          <div class="min-w-0">
            <SearchableSelectInput
              :id="`order-warehouse-${line.lineId}`"
              :model-value="line.warehouseId"
              :label="$t('sales.warehouse')"
              :options="warehouseOptions(line)"
              :placeholder="$t('sales.selectWarehouse')"
              :search-placeholder="$t('sales.searchWarehouses')"
              :empty-text="$t('sales.noWarehouseStock')"
              :error="fieldError(errors?.[`items.${index}.warehouse_id`])"
              :data-testid="`quick-sale-warehouse-${index}`"
              @update:model-value="emit('warehouse', line.lineId, $event)"
            />
            <p
              v-if="!fieldError(errors?.[`items.${index}.warehouse_id`]) && !line.warehouseId"
              class="mt-1 text-xs text-warning"
            >
              {{ $t('sales.validation.warehouseRequired') }}
            </p>
            <p v-else class="mt-1 text-xs text-text-muted">
              {{
                $t('sales.selectedWarehouseStock', {
                  count: line.availableQuantity,
                })
              }}
            </p>
          </div>

          <div class="grid min-w-0 gap-3 sm:grid-cols-2">
            <div class="min-w-0">
              <p class="form-label mb-1.5">{{ $t('sales.quantity') }}</p>
              <QuantityControl
                :model-value="line.quantity"
                :max="line.availableQuantity"
                :disabled="!line.warehouseId || line.availableQuantity <= 0"
                :label="$t('sales.quantityFor', { sku: line.item.sku })"
                @update:model-value="emit('quantity', line.lineId, $event)"
              />
              <p
                v-if="fieldError(errors?.[`items.${index}.quantity`])"
                class="form-error"
              >
                {{ fieldError(errors?.[`items.${index}.quantity`]) }}
              </p>
            </div>

            <div class="min-w-0">
              <div class="mb-1.5 flex min-w-0 flex-wrap items-center gap-2">
                <label
                  class="form-label min-w-0 flex-1"
                  :for="`order-price-${line.lineId}`"
                  >{{ $t('sales.orderSellingPrice') }}</label
                >
                <BaseBadge v-if="isCustomPrice(line)" variant="secondary">{{
                  $t('sales.customPrice')
                }}</BaseBadge>
              </div>
              <input
                :id="`order-price-${line.lineId}`"
                class="form-control min-w-0 text-base font-bold tabular-nums"
                :class="
                  errors?.[`items.${index}.price`]?.length
                    ? 'border-danger'
                    : ''
                "
                type="number"
                inputmode="decimal"
                min="0"
                max="99999999.99"
                step="0.01"
                :value="line.unitPrice"
                :readonly="!canEditPrice || priceLocked"
                :aria-label="$t('sales.orderSellingPrice')"
                @input="
                  emit(
                    'price',
                    line.lineId,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
              <p
                class="mt-1 inline-flex items-center gap-1 text-xs font-medium leading-normal text-text-muted"
              >
                {{ $t('sales.effectiveMaxDiscount') }}:
                <MoneyDisplay
                  :value="maxDiscount(line)"
                  currency="EGP"
                  class="!text-xs !font-semibold !text-text"
                />
              </p>
              <p v-if="fieldError(errors?.[`items.${index}.discount`])" class="form-error">
                {{ fieldError(errors?.[`items.${index}.discount`]) }}
              </p>
              <p
                v-if="fieldError(errors?.[`items.${index}.price`])"
                class="form-error"
              >
                {{ fieldError(errors?.[`items.${index}.price`]) }}
              </p>
            </div>
          </div>

          <div
            class="flex min-w-0 flex-wrap items-end justify-between gap-2 border-t border-border pt-2"
          >
            <span class="min-w-0 text-xs text-text-muted">
              {{ $t('sales.systemPrice') }}:
              <MoneyDisplay :value="line.systemPrice" currency="EGP" />
            </span>
            <button
              v-if="canEditPrice && !priceLocked && isCustomPrice(line)"
              class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              type="button"
              @click="emit('resetPrice', line.lineId)"
            >
              <RotateCcw class="size-3.5" />{{ $t('sales.resetSystemPrice') }}
            </button>
            <div class="ms-auto min-w-0 text-end">
              <p class="text-xs text-text-muted">{{ $t('sales.netLineTotal') }}</p>
              <MoneyDisplay
                class="text-lg"
                :value="lineTotal(line)"
                currency="EGP"
              />
            </div>
          </div>
        </div>

        <p v-if="isCustomPrice(line)" class="mt-2 text-xs text-secondary">
          {{ $t('sales.customPriceNotice') }}
        </p>
      </article>
    </div>
    <p
      v-if="priceLocked"
      class="shrink-0 border-t border-warning/25 bg-warning-soft p-3 text-sm text-warning"
    >
      {{ $t('sales.priceLockedByPayments') }}
    </p>
  </section>
</template>
