<script setup lang="ts">
import { useLocalizedName } from "@/composables/useLocalizedName";
import { ArrowRightLeft } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import BaseBadge from "@/components/ui/BaseBadge.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable.vue";
import DetailsField from "@/components/ui/DetailsField.vue";
import DetailsSection from "@/components/ui/DetailsSection.vue";
import LoadingState from "@/components/ui/LoadingState.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import { ApiError } from "@/api/http";
import { getStockTransferLog } from "../api";
import type { StockTransfer, StockTransferItem } from "../types";

const props = defineProps<{ id: string }>();
const route = useRoute();
const { t, locale } = useI18n();
const displayName = useLocalizedName();
const loading = ref(true);
const errorMessage = ref("");
const genericLoadError = ref(false);
const log = ref<StockTransfer | null>(null);
let requestId = 0;

const columns = computed<DataTableColumn<StockTransferItem>[]>(() => [
  { key: "product", label: t("table.product") },
  { key: "product_item", label: t("table.productItem") },
  { key: "sku", label: t("table.sku") },
  { key: "quantity", label: t("stockTransferLogs.transferredQuantity"), align: "center" },
  { key: "source_quantity_before", label: t("stockTransferLogs.sourceBefore"), align: "center" },
  { key: "source_quantity_after", label: t("stockTransferLogs.sourceAfter"), align: "center" },
  { key: "destination_quantity_before", label: t("stockTransferLogs.destinationBefore"), align: "center" },
  { key: "destination_quantity_after", label: t("stockTransferLogs.destinationAfter"), align: "center" },
]);
const sourceWarehouse = computed(() => log.value?.source_warehouse ?? log.value?.from_warehouse);
const destinationWarehouse = computed(() => log.value?.destination_warehouse ?? log.value?.to_warehouse);
const backRoute = computed(() => ({ name: "stock-transfer-logs.index", query: route.query }));
const displayedError = computed(() =>
  genericLoadError.value ? t("stockTransferLogs.loadDetailsFailed") : errorMessage.value,
);


function formatNumber(value?: number | string | null) {
  return new Intl.NumberFormat(locale.value).format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
}

function optionNames(item: StockTransferItem) {
  const values = item.product_item?.option_values ?? item.product_item?.optionValues ?? [];
  return values.map((value) => displayName(value)).filter((value) => value !== "—").join(" / ") || "—";
}

function delta(before: number, after: number) {
  const value = Number(after) - Number(before);
  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}

async function load() {
  const currentRequest = ++requestId;
  loading.value = true;
  errorMessage.value = "";
  genericLoadError.value = false;
  log.value = null;
  try {
    const response = await getStockTransferLog(props.id);
    if (currentRequest === requestId) log.value = response;
  } catch (error) {
    if (currentRequest !== requestId) return;
    genericLoadError.value =
      !(error instanceof ApiError) || !error.statusCode || error.statusCode >= 500;
    errorMessage.value = error instanceof ApiError ? error.message : "";
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

watch([() => props.id, locale], load, { immediate: true });
</script>

<template>
  <PageHeader
    :title="log?.reference_number || t('stockTransferLogs.detailsTitle')"
    :description="t('stockTransferLogs.detailsDescription')"
  >
    <template #actions>
      <BaseButton variant="outline" :to="backRoute">{{ t("stockTransferLogs.backToLogs") }}</BaseButton>
    </template>
  </PageHeader>

  <LoadingState v-if="loading" />
  <div v-else-if="displayedError" class="panel border-danger/30 p-6 text-danger" role="alert">
    <p class="font-semibold">{{ displayedError }}</p>
    <BaseButton class="mt-4" variant="outline" type="button" @click="load">{{ t("actions.refresh") }}</BaseButton>
  </div>
  <div v-else-if="log" class="grid min-w-0 gap-5">
    <section class="panel overflow-hidden p-5 sm:p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <div class="rounded-[var(--radius-lg)] bg-primary-soft p-3 text-primary"><ArrowRightLeft class="size-6" /></div>
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wide text-text-muted">{{ t("stockTransferLogs.warehouseMovement") }}</p>
            <h2 class="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold text-text sm:text-xl">
              <span>{{ displayName(sourceWarehouse) }}</span>
              <ArrowRightLeft class="size-5 shrink-0 text-secondary" aria-hidden="true" />
              <span>{{ displayName(destinationWarehouse) }}</span>
            </h2>
          </div>
        </div>
        <BaseBadge variant="primary"><span class="font-mono">{{ log.reference_number || `#${log.id}` }}</span></BaseBadge>
      </div>
    </section>

    <DetailsSection :title="t('stockTransferLogs.summary')">
      <dl class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailsField :label="t('stockTransferLogs.reference')" :value="log.reference_number || `#${log.id}`" />
        <DetailsField :label="t('stockTransferLogs.sourceWarehouse')" :value="displayName(sourceWarehouse)" />
        <DetailsField :label="t('stockTransferLogs.destinationWarehouse')" :value="displayName(destinationWarehouse)" />
        <DetailsField :label="t('stockTransferLogs.sourceBranch')" :value="displayName(sourceWarehouse?.branch)" />
        <DetailsField :label="t('stockTransferLogs.destinationBranch')" :value="displayName(destinationWarehouse?.branch)" />
        <DetailsField :label="t('stockTransferLogs.transferredBy')" :value="log.creator?.name" />
        <DetailsField :label="t('stockTransferLogs.transferDate')" :value="formatDate(log.transferred_at ?? log.created_at)" />
        <DetailsField :label="t('stockTransferLogs.itemsCount')" :value="formatNumber(log.items_count ?? log.items?.length ?? 0)" />
        <DetailsField :label="t('stockTransferLogs.totalQuantity')" :value="formatNumber(log.total_quantity ?? log.quantity)" />
        <DetailsField class="md:col-span-2 xl:col-span-3" :label="t('stockTransferLogs.notes')" :value="log.notes" :fallback="t('stockTransferLogs.noNotes')" />
      </dl>
    </DetailsSection>

    <DetailsSection :title="t('stockTransferLogs.transferredItems')" :description="t('stockTransferLogs.snapshotsHint')">
      <DataTable
        :columns="columns"
        :rows="log.items ?? []"
        :empty-title="t('stockTransferLogs.noItems')"
        :empty-message="t('stockTransferLogs.noItemsMessage')"
      >
        <template #cell-product="{ row }"><strong>{{ displayName(row.product_item?.product) }}</strong></template>
        <template #cell-product_item="{ row }">{{ optionNames(row) }}</template>
        <template #cell-sku="{ row }"><span class="font-mono font-semibold">{{ row.product_item?.sku ?? "—" }}</span></template>
        <template #cell-quantity="{ row }"><strong>{{ formatNumber(row.quantity) }}</strong></template>
        <template #cell-source_quantity_before="{ row }">{{ formatNumber(row.source_quantity_before) }}</template>
        <template #cell-source_quantity_after="{ row }">
          <div class="font-semibold">{{ formatNumber(row.source_quantity_after) }}</div>
          <div class="mt-1 text-xs text-danger">{{ delta(row.source_quantity_before, row.source_quantity_after) }}</div>
        </template>
        <template #cell-destination_quantity_before="{ row }">{{ formatNumber(row.destination_quantity_before) }}</template>
        <template #cell-destination_quantity_after="{ row }">
          <div class="font-semibold">{{ formatNumber(row.destination_quantity_after) }}</div>
          <div class="mt-1 text-xs text-success">{{ delta(row.destination_quantity_before, row.destination_quantity_after) }}</div>
        </template>
      </DataTable>
    </DetailsSection>
  </div>
</template>
