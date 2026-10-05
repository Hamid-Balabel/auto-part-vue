<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import FormInput from "@/components/forms/FormInput.vue";
import SwitchInput from "@/components/forms/SwitchInput.vue";
import SearchableSelectInput, {
  type SearchableSelectOption,
} from "@/components/forms/SearchableSelectInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import DetailsField from "@/components/ui/DetailsField.vue";
import DetailsSection from "@/components/ui/DetailsSection.vue";
import FormPageLayout from "@/components/ui/FormPageLayout.vue";
import { ApiError } from "@/api/http";
import { usePermissions } from "@/composables/usePermissions";
import { useToastStore } from "@/stores/toast";
import { normalizeBoolean } from "@/utils/boolean";
import { listAvailableBatches, listStocks, listWarehouses, transferStock } from "../api";
import type {
  ProductItemBatch,
  Stock,
  StockTransfer,
  StockTransferPayload,
  Warehouse,
} from "../types";

const route = useRoute();
const { t, locale } = useI18n();
const toast = useToastStore();
const { can } = usePermissions();
const loading = ref(true);
const stocksLoading = ref(false);
const destinationLoading = ref(false);
const batchesLoading = ref(false);
const saving = ref(false);
const warehouses = ref<Warehouse[]>([]);
const sourceStocks = ref<Stock[]>([]);
const destinationStock = ref<Stock | null>(null);
const errors = ref<Record<string, string[]>>({});
const errorMessage = ref("");
const result = ref<StockTransfer | null>(null);
const manualBatchSelection = ref(false);
const availableBatches = ref<ProductItemBatch[]>([]);
const batchQuantities = ref<Record<number, string>>({});
const batchErrorMessage = ref("");
let sourceRequestId = 0;
let destinationRequestId = 0;
let batchesRequestId = 0;
const form = reactive<StockTransferPayload>({
  from_warehouse_id: null,
  to_warehouse_id: null,
  product_item_id: null,
  quantity: "",
  notes: "",
});

const warehouseOptions = computed<SearchableSelectOption<number>[]>(() =>
  warehouses.value.map((warehouse) => ({
    value: warehouse.id,
    label: displayName(warehouse),
    description: warehouse.address ?? undefined,
    searchText: [
      warehouse.name,
      warehouse.translation_name?.ar,
      warehouse.translation_name?.en,
      warehouse.address,
    ]
      .filter(Boolean)
      .join(" "),
  })),
);
const itemOptions = computed<SearchableSelectOption<number>[]>(() =>
  sourceStocks.value.map((stock) => ({
    value: stock.item_id,
    label: `${stock.item?.product?.name ?? stock.item?.sku ?? `#${stock.item_id}`} · ${stock.item?.sku ?? `#${stock.item_id}`}`,
    meta: t("inventory.availableCount", {
      count: formatNumber(stock.quantity),
    }),
    searchText: [
      stock.item?.sku,
      stock.item?.product?.name,
    ]
      .filter(Boolean)
      .join(" "),
  })),
);
const selectedSourceStock = computed(
  () =>
    sourceStocks.value.find(
      (stock) => stock.item_id === Number(form.product_item_id),
    ) ?? null,
);
const availableQuantity = computed(() =>
  Number(selectedSourceStock.value?.quantity ?? 0),
);
const sameWarehouse = computed(() =>
  Boolean(
    form.from_warehouse_id &&
    form.to_warehouse_id &&
    form.from_warehouse_id === form.to_warehouse_id,
  ),
);
const quantityValue = computed(() => Number(form.quantity));
const quantityInvalid = computed(
  () => !Number.isInteger(quantityValue.value) || quantityValue.value < 1,
);
const exceedsAvailable = computed(
  () => !quantityInvalid.value && quantityValue.value > availableQuantity.value,
);
const selectedBatchTotal = computed(() =>
  availableBatches.value.reduce(
    (sum, batch) => sum + normalizeBatchQuantity(batchQuantities.value[batch.id]),
    0,
  ),
);
const batchQuantityErrors = computed<Record<number, string>>(() => {
  const next: Record<number, string> = {};
  for (const batch of availableBatches.value) {
    const raw = batchQuantities.value[batch.id];
    if (raw === "" || raw === undefined) continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) {
      next[batch.id] = t("inventory.batchQuantityInvalid");
    } else if (value > batchRemainingQuantity(batch)) {
      next[batch.id] = t("inventory.batchQuantityExceedsAvailable");
    }
  }
  return next;
});
const manualBatchInvalid = computed(() => {
  if (!manualBatchSelection.value) return false;
  return (
    batchesLoading.value ||
    Boolean(batchErrorMessage.value) ||
    Object.keys(batchQuantityErrors.value).length > 0 ||
    quantityInvalid.value ||
    selectedBatchTotal.value !== quantityValue.value
  );
});
const canSubmit = computed(
  () =>
    can("transfer-stock") &&
    form.from_warehouse_id &&
    form.to_warehouse_id &&
    form.product_item_id &&
    !sameWarehouse.value &&
    !quantityInvalid.value &&
    !exceedsAvailable.value &&
    !manualBatchInvalid.value &&
    !saving.value,
);
const cancelRoute = computed(() =>
  can(["read-stock", "create-stock", "update-stock"])
    ? { name: "stocks.index" }
    : { name: "dashboard" },
);

function displayName(
  record?: {
    name?: string | null;
    translation_name?: { ar?: string | null; en?: string | null };
  } | null,
) {
  return (
    record?.name ??
    record?.translation_name?.ar ??
    record?.translation_name?.en ??
    "—"
  );
}

function formatNumber(value?: number | string | null) {
  return new Intl.NumberFormat(locale.value).format(Number(value ?? 0));
}

function formatCurrency(value?: number | string | null, legacy = false) {
  if (value === null || value === undefined || legacy) return t("inventory.unknown");
  return new Intl.NumberFormat(locale.value, { style: "currency", currency: "EGP" }).format(Number(value));
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, { dateStyle: "medium" }).format(new Date(value))
    : "—";
}

function normalizeBatchQuantity(value?: string) {
  if (value === "" || value === undefined) return 0;
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : 0;
}

function batchWarehouseStock(batch: ProductItemBatch) {
  return batch.warehouse_stocks?.find((stock) => stock.warehouse_id === Number(form.from_warehouse_id)) ?? null;
}

function batchRemainingQuantity(batch: ProductItemBatch) {
  return Number(batchWarehouseStock(batch)?.remaining_quantity ?? batch.remaining_quantity ?? batch.total_remaining_quantity ?? 0);
}

function batchBackendError(index: number) {
  const selectedIndex = availableBatches.value
    .slice(0, index)
    .filter((entry) => normalizeBatchQuantity(batchQuantities.value[entry.id]) > 0).length;
  return (
    errors.value[`batches.${selectedIndex}.quantity`]?.[0] ??
    errors.value[`batches.${selectedIndex}.batch_id`]?.[0] ??
    errors.value[`batches.${index}.quantity`]?.[0] ??
    errors.value[`batches.${index}.batch_id`]?.[0]
  );
}

function manualBatchPayload() {
  return availableBatches.value
    .map((batch) => ({ batch_id: batch.id, quantity: normalizeBatchQuantity(batchQuantities.value[batch.id]) }))
    .filter((batch) => batch.quantity > 0);
}

function merchantName(batch: ProductItemBatch) {
  return batch.merchant?.name ?? t("inventory.unknown");
}

function normalizeList<T>(response: T[] | { data: T[] }): T[] {
  return Array.isArray(response) ? response : response.data;
}

async function loadSourceStocks(preserveItem = false) {
  const requestId = ++sourceRequestId;
  sourceStocks.value = [];
  if (!preserveItem) form.product_item_id = null;
  destinationStock.value = null;
  if (!form.from_warehouse_id) {
    stocksLoading.value = false;
    return;
  }
  stocksLoading.value = true;
  try {
    const response = await listStocks({
      warehouse_id: form.from_warehouse_id,
      in_stock: true,
      per_page: -1,
    });
    if (requestId !== sourceRequestId) return;
    sourceStocks.value = normalizeList(response).filter((stock) =>
      normalizeBoolean(stock.item?.is_active),
    );
    if (
      preserveItem &&
      !sourceStocks.value.some(
        (stock) => stock.item_id === Number(form.product_item_id),
      )
    )
      form.product_item_id = null;
  } finally {
    if (requestId === sourceRequestId) stocksLoading.value = false;
  }
}

async function loadDestinationStock() {
  const requestId = ++destinationRequestId;
  destinationStock.value = null;
  if (!form.to_warehouse_id || !form.product_item_id || sameWarehouse.value) {
    destinationLoading.value = false;
    return;
  }
  destinationLoading.value = true;
  try {
    const response = await listStocks({
      warehouse_id: form.to_warehouse_id,
      item_id: form.product_item_id,
      per_page: 1,
    });
    if (requestId === destinationRequestId)
      destinationStock.value = normalizeList(response)[0] ?? null;
  } finally {
    if (requestId === destinationRequestId) destinationLoading.value = false;
  }
}

function clearBatchSelection() {
  availableBatches.value = [];
  batchQuantities.value = {};
  batchErrorMessage.value = "";
  batchesLoading.value = false;
  batchesRequestId++;
}

async function loadBatches(preserveQuantities = true) {
  const requestId = ++batchesRequestId;
  const previousQuantities = preserveQuantities ? { ...batchQuantities.value } : {};
  availableBatches.value = [];
  batchQuantities.value = {};
  batchErrorMessage.value = "";
  if (!manualBatchSelection.value || !form.from_warehouse_id || !form.product_item_id) {
    batchesLoading.value = false;
    return;
  }
  batchesLoading.value = true;
  try {
    const response = await listAvailableBatches(form.product_item_id, form.from_warehouse_id);
    if (requestId !== batchesRequestId) return;
    availableBatches.value = response.filter((batch) => batchRemainingQuantity(batch) > 0);
    for (const batch of availableBatches.value) {
      if (batch.id in previousQuantities) {
        batchQuantities.value[batch.id] = previousQuantities[batch.id];
      }
    }
  } catch (error) {
    if (requestId !== batchesRequestId) return;
    batchErrorMessage.value = error instanceof ApiError ? error.message : t("inventory.batchesLoadFailed");
  } finally {
    if (requestId === batchesRequestId) batchesLoading.value = false;
  }
}

async function submit() {
  if (!canSubmit.value) return;
  saving.value = true;
  errors.value = {};
  errorMessage.value = "";
  result.value = null;
  try {
    const payload: StockTransferPayload = {
      from_warehouse_id: form.from_warehouse_id,
      to_warehouse_id: form.to_warehouse_id,
      product_item_id: form.product_item_id,
      quantity: quantityValue.value,
      notes: form.notes?.trim() || null,
    };
    if (manualBatchSelection.value) {
      payload.batches = manualBatchPayload();
    }
    result.value = await transferStock(payload);
    toast.success(t("inventory.stockTransferSuccess"));
    form.quantity = "";
    try {
      await loadSourceStocks(true);
      await loadDestinationStock();
      if (manualBatchSelection.value) await loadBatches(false);
    } catch {
      toast.error(t("inventory.stockRefreshFailed"));
    }
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {};
      errorMessage.value = error.message;
    }
    try {
      await loadSourceStocks(true);
      await loadDestinationStock();
      if (manualBatchSelection.value) await loadBatches(true);
    } catch {
      // Keep the backend error visible; refresh is best-effort after stale stock/batch failures.
    }
  } finally {
    saving.value = false;
  }
}

watch(
  () => form.from_warehouse_id,
  () => {
    clearBatchSelection();
    if (!loading.value) void loadSourceStocks();
  },
);
watch([() => form.to_warehouse_id, () => form.product_item_id], ([, item], [, oldItem]) => {
  if (item !== oldItem) {
    clearBatchSelection();
    if (!loading.value && manualBatchSelection.value) void loadBatches();
  }
  if (!loading.value) void loadDestinationStock();
});
watch(manualBatchSelection, (enabled) => {
  clearBatchSelection();
  if (enabled && !loading.value) void loadBatches();
});

onMounted(async () => {
  try {
    const response = await listWarehouses({ is_active: true, per_page: -1 });
    warehouses.value = normalizeList(response).filter((warehouse) =>
      normalizeBoolean(warehouse.is_active),
    );
    const sourceId = Number(route.query.from_warehouse_id);
    const itemId = Number(route.query.product_item_id);
    if (
      sourceId &&
      warehouses.value.some((warehouse) => warehouse.id === sourceId)
    ) {
      form.from_warehouse_id = sourceId;
      await loadSourceStocks();
      if (
        itemId &&
        sourceStocks.value.some((stock) => stock.item_id === itemId)
      )
        form.product_item_id = itemId;
    }
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('inventory.warehouseLoadFailed');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <FormPageLayout
    :title="t('inventory.stockTransfer')"
    :description="t('inventory.stockTransferDescription')"
    :error-message="errorMessage"
    :loading-text="loading ? t('common.loading') : ''"
    data-testid="stock-transfer-form"
    @submit="submit"
  >
    <div class="grid gap-5">
      <div class="grid gap-4 md:grid-cols-2">
        <SearchableSelectInput
          id="transfer_source"
          v-model="form.from_warehouse_id"
          :label="t('inventory.sourceWarehouse')"
          :options="warehouseOptions"
          :loading="loading"
          :error="errors.from_warehouse_id?.[0]"
          required
        />
        <SearchableSelectInput
          id="transfer_destination"
          v-model="form.to_warehouse_id"
          :label="t('inventory.destinationWarehouse')"
          :options="warehouseOptions"
          :loading="loading"
          :error="
            errors.to_warehouse_id?.[0] ??
            (sameWarehouse ? t('inventory.sameWarehouseError') : undefined)
          "
          required
        />
        <SearchableSelectInput
          id="transfer_item"
          v-model="form.product_item_id"
          :label="t('table.productItem')"
          :options="itemOptions"
          :loading="stocksLoading"
          :disabled="!form.from_warehouse_id"
          :error="errors.product_item_id?.[0]"
          :empty-text="t('inventory.noAvailableStock')"
          required
        />
        <FormInput
          id="transfer_quantity"
          v-model="form.quantity"
          :label="t('inventory.transferQuantity')"
          type="number"
          :error="
            errors.quantity?.[0] ??
            (exceedsAvailable
              ? t('inventory.exceedsAvailableError')
              : quantityInvalid && form.quantity !== ''
                ? t('inventory.positiveIntegerError')
                : undefined)
          "
          required
        />
        <div
          class="rounded-[var(--radius-lg)] border border-border bg-background p-4"
        >
          <span class="text-xs font-semibold text-text-muted">{{
            t("inventory.availableQuantity")
          }}</span>
          <strong class="mt-1 block text-2xl text-text">{{
            formatNumber(availableQuantity)
          }}</strong>
        </div>
        <div
          class="rounded-[var(--radius-lg)] border border-border bg-background p-4"
        >
          <span class="text-xs font-semibold text-text-muted">{{
            t("inventory.destinationQuantity")
          }}</span>
          <strong class="mt-1 block text-2xl text-text">{{
            destinationLoading
              ? "…"
              : formatNumber(destinationStock?.quantity ?? 0)
          }}</strong>
        </div>
        <FormInput
          id="transfer_notes"
          v-model="form.notes"
          class="md:col-span-2"
          :label="t('sales.notes')"
          :error="errors.notes?.[0]"
        />
      </div>

      <DetailsSection
        :title="t('inventory.batchSelection')"
        :description="manualBatchSelection ? t('inventory.manualBatchDescription') : t('inventory.automaticFifoDescription')"
      >
        <div class="grid gap-4">
          <div class="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-semibold text-text">{{ t("inventory.automaticFifoTitle") }}</p>
              <p class="mt-1 text-sm text-text-muted">{{ t("inventory.automaticFifoDescription") }}</p>
            </div>
            <SwitchInput
              v-model="manualBatchSelection"
              :disabled="saving"
              :on-label="t('inventory.manualBatchSelection')"
              :off-label="t('inventory.automaticFifo')"
              :aria-label="t('inventory.manualBatchSelection')"
            />
          </div>

          <div v-if="manualBatchSelection" class="grid gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span class="font-semibold text-text">
                {{ t("inventory.selectedBatchTotal", { selected: formatNumber(selectedBatchTotal), total: formatNumber(quantityValue || 0) }) }}
              </span>
              <span v-if="selectedBatchTotal !== quantityValue && form.quantity !== ''" class="text-danger">
                {{ t("inventory.batchTotalMustMatch") }}
              </span>
            </div>

            <div v-if="batchesLoading" class="rounded-[var(--radius-lg)] border border-border p-4 text-sm text-text-muted">
              {{ t("inventory.loadingBatches") }}
            </div>
            <div v-else-if="batchErrorMessage" class="rounded-[var(--radius-lg)] border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
              {{ batchErrorMessage }}
            </div>
            <div v-else-if="!availableBatches.length" class="rounded-[var(--radius-lg)] border border-border p-4 text-sm text-text-muted">
              {{ t("inventory.noAvailableBatchesForTransfer") }}
            </div>
            <div v-else class="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
              <table class="min-w-full divide-y divide-border text-sm">
                <thead class="bg-neutral-soft text-xs font-semibold uppercase text-text-muted">
                  <tr>
                    <th class="px-3 py-2 text-start">{{ t("table.merchant") }}</th>
                    <th class="px-3 py-2 text-start">{{ t("inventory.purchasePrice") }}</th>
                    <th class="px-3 py-2 text-center">{{ t("inventory.availableQuantity") }}</th>
                    <th class="px-3 py-2 text-start">{{ t("inventory.purchaseDate") }}</th>
                    <th class="px-3 py-2 text-start">{{ t("inventory.transferQuantity") }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border bg-surface">
                  <tr v-for="(batch, index) in availableBatches" :key="batch.id">
                    <td class="px-3 py-2">{{ merchantName(batch) }}</td>
                    <td class="px-3 py-2">{{ formatCurrency(batch.purchase_price, batch.is_legacy_unknown) }}</td>
                    <td class="px-3 py-2 text-center font-semibold">{{ formatNumber(batchRemainingQuantity(batch)) }}</td>
                    <td class="px-3 py-2">
                      <span>{{ formatDate(batch.purchased_at) }}</span>
                      <span v-if="batch.is_legacy_unknown" class="ms-2 text-xs text-text-muted">{{ t("inventory.legacyBatch") }}</span>
                    </td>
                    <td class="min-w-40 px-3 py-2">
                      <FormInput
                        :id="`transfer_batch_${batch.id}`"
                        v-model="batchQuantities[batch.id]"
                        :label="t('inventory.transferQuantity')"
                        type="number"
                        :error="batchQuantityErrors[batch.id] ?? batchBackendError(index)"
                        :disabled="saving"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="errors.batches?.[0]" class="text-sm text-danger">{{ errors.batches[0] }}</p>
          </div>
        </div>
      </DetailsSection>

      <DetailsSection v-if="result" :title="t('inventory.transferResult')">
        <dl class="grid gap-3 md:grid-cols-3">
          <DetailsField
            :label="t('stockTransferLogs.reference')"
            :value="result.reference_number || `#${result.id}`"
          />
          <DetailsField
            :label="t('table.sku')"
            :value="result.product_item?.sku"
          />
          <DetailsField
            :label="t('inventory.sourceQuantityAfter')"
            :value="formatNumber(result.source_quantity)"
          />
          <DetailsField
            :label="t('inventory.destinationQuantityAfter')"
            :value="formatNumber(result.destination_quantity)"
          />
        </dl>
        <BaseButton
          v-if="result.id && can('read-stock-transfer')"
          class="mt-4"
          variant="outline"
          :to="{ name: 'stock-transfer-logs.show', params: { id: result.id } }"
        >
          {{ t("stockTransferLogs.viewTransferLog") }}
        </BaseButton>
      </DetailsSection>
    </div>

    <template #actions>
      <BaseButton variant="secondary" :to="cancelRoute">{{
        t("actions.cancel")
      }}</BaseButton>
      <BaseButton
        v-if="can('transfer-stock')"
        type="submit"
        :loading="saving"
        :disabled="!canSubmit"
        >{{
          saving ? t("actions.saving") : t("inventory.transferStockAction")
        }}</BaseButton
      >
    </template>
  </FormPageLayout>
</template>
