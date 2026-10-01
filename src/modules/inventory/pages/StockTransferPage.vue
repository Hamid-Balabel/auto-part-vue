<script setup lang="ts">
import { useLocalizedName } from "@/composables/useLocalizedName";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import FormInput from "@/components/forms/FormInput.vue";
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
import { listStocks, listWarehouses, transferStock } from "../api";
import type {
  Stock,
  StockTransfer,
  StockTransferPayload,
  Warehouse,
} from "../types";

const route = useRoute();
const { t, locale } = useI18n();
const displayName = useLocalizedName();
const toast = useToastStore();
const { can } = usePermissions();
const loading = ref(true);
const stocksLoading = ref(false);
const destinationLoading = ref(false);
const saving = ref(false);
const warehouses = ref<Warehouse[]>([]);
const sourceStocks = ref<Stock[]>([]);
const destinationStock = ref<Stock | null>(null);
const errors = ref<Record<string, string[]>>({});
const errorMessage = ref("");
const result = ref<StockTransfer | null>(null);
let sourceRequestId = 0;
let destinationRequestId = 0;
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
    label: `${displayName(stock.item?.product, stock.item?.sku ?? `#${stock.item_id}`)} · ${stock.item?.sku ?? `#${stock.item_id}`}`,
    description: stock.item?.merchant?.name ?? undefined,
    meta: t("inventory.availableCount", {
      count: formatNumber(stock.quantity),
    }),
    searchText: [
      stock.item?.sku,
      stock.item?.product?.name,
      stock.item?.merchant?.name,
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
const destinationMissing = computed(() =>
  Boolean(
    form.to_warehouse_id &&
    form.product_item_id &&
    !destinationLoading.value &&
    !destinationStock.value,
  ),
);
const canSubmit = computed(
  () =>
    can("transfer-stock") &&
    form.from_warehouse_id &&
    form.to_warehouse_id &&
    form.product_item_id &&
    !sameWarehouse.value &&
    !quantityInvalid.value &&
    !exceedsAvailable.value &&
    !destinationLoading.value &&
    Boolean(destinationStock.value) &&
    !saving.value,
);
const cancelRoute = computed(() =>
  can(["read-stock", "create-stock", "update-stock"])
    ? { name: "stocks.index" }
    : { name: "dashboard" },
);


function formatNumber(value?: number | string | null) {
  return new Intl.NumberFormat(locale.value).format(Number(value ?? 0));
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

async function submit() {
  if (!canSubmit.value) return;
  saving.value = true;
  errors.value = {};
  errorMessage.value = "";
  result.value = null;
  try {
    result.value = await transferStock({
      from_warehouse_id: form.from_warehouse_id,
      to_warehouse_id: form.to_warehouse_id,
      product_item_id: form.product_item_id,
      quantity: quantityValue.value,
      notes: form.notes?.trim() || null,
    });
    toast.success(t("inventory.stockTransferSuccess"));
    form.quantity = "";
    try {
      await loadSourceStocks(true);
      await loadDestinationStock();
    } catch {
      toast.error(t("inventory.stockRefreshFailed"));
    }
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {};
      errorMessage.value = error.message;
    }
  } finally {
    saving.value = false;
  }
}

watch(
  () => form.from_warehouse_id,
  () => {
    if (!loading.value) void loadSourceStocks();
  },
);
watch([() => form.to_warehouse_id, () => form.product_item_id], () => {
  if (!loading.value) void loadDestinationStock();
});
watch(locale, async () => {
  try {
    const response = await listWarehouses({ is_active: true, per_page: -1 });
    warehouses.value = normalizeList(response).filter((warehouse) => normalizeBoolean(warehouse.is_active));
    if (form.from_warehouse_id) await loadSourceStocks(true);
    if (form.to_warehouse_id && form.product_item_id) await loadDestinationStock();
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('details.failedToLoad');
  }
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
              : destinationStock
                ? formatNumber(destinationStock.quantity)
                : "—"
          }}</strong>
          <span
            v-if="destinationMissing"
            class="mt-2 block text-xs text-danger"
            >{{ t("inventory.destinationStockMissing") }}</span
          >
        </div>
        <FormInput
          id="transfer_notes"
          v-model="form.notes"
          class="md:col-span-2"
          :label="t('sales.notes')"
          :error="errors.notes?.[0]"
        />
      </div>

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
