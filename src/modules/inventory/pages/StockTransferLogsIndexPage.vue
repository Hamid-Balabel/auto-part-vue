<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import BaseSelect from "@/components/forms/BaseSelect.vue";
import DateInput from "@/components/forms/DateInput.vue";
import FormInput from "@/components/forms/FormInput.vue";
import BaseBadge from "@/components/ui/BaseBadge.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import CrudFilterPanel from "@/components/ui/CrudFilterPanel.vue";
import CrudShowButton from "@/components/ui/CrudShowButton.vue";
import CrudToolbar from "@/components/ui/CrudToolbar.vue";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import Pagination from "@/components/ui/Pagination.vue";
import { ApiError } from "@/api/http";
import { listUsers } from "@/modules/admin/api";
import type { User } from "@/modules/admin/types";
import { usePermissions } from "@/composables/usePermissions";
import { useToastStore } from "@/stores/toast";
import type { Paginated } from "@/types/api";
import {
  listProductItems,
  listStockTransferLogs,
  listWarehouses,
} from "../api";
import type {
  ProductItem,
  StockTransfer,
  StockTransferLogListQuery,
  Warehouse,
} from "../types";

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const toast = useToastStore();
const { can } = usePermissions();
const rows = ref<StockTransfer[]>([]);
const pageData = ref<Paginated<StockTransfer> | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const genericLoadError = ref(false);
const warehouses = ref<Warehouse[]>([]);
const productItems = ref<ProductItem[]>([]);
const users = ref<User[]>([]);
const lookupsLoading = ref(true);
const search = ref("");
const page = ref(1);
const sortColumn = ref("id");
const sortDirection = ref<"asc" | "desc">("desc");
let requestId = 0;
const allowedSortColumns = [
  "id",
  "created_at",
  "updated_at",
  "reference_number",
  "from_warehouse_id",
  "to_warehouse_id",
  "created_by",
  "transferred_at",
];

const emptyFilters = () => ({
  reference_number: "",
  warehouse_id: null as number | null,
  source_warehouse_id: null as number | null,
  destination_warehouse_id: null as number | null,
  product_item_id: null as number | null,
  created_by: null as number | null,
  from_date: "",
  to_date: "",
  created_from: "",
  created_to: "",
});
const filters = reactive(emptyFilters());
const appliedFilters = reactive(emptyFilters());

const canLoadUsers = computed(() => can(["view-all-user", "view-own-user"]));
const displayedError = computed(() =>
  genericLoadError.value ? t("stockTransferLogs.loadFailed") : errorMessage.value,
);
const hasFilters = computed(() =>
  Boolean(
    search.value.trim() ||
      appliedFilters.reference_number ||
      appliedFilters.warehouse_id ||
      appliedFilters.source_warehouse_id ||
      appliedFilters.destination_warehouse_id ||
      appliedFilters.product_item_id ||
      appliedFilters.created_by ||
      appliedFilters.from_date ||
      appliedFilters.to_date ||
      appliedFilters.created_from ||
      appliedFilters.created_to,
  ),
);
const activeFiltersCount = computed(() =>
  Object.values(appliedFilters).filter((value) => value !== null && value !== "").length,
);
const selectedWarehouse = computed(() =>
  warehouses.value.find((warehouse) => warehouse.id === appliedFilters.warehouse_id),
);
const pageTitle = computed(() =>
  selectedWarehouse.value
    ? `${t("stockTransferLogs.movementLog")} - ${displayName(selectedWarehouse.value)}`
    : t("stockTransferLogs.title"),
);
const columns = computed<DataTableColumn<StockTransfer>[]>(() => {
  const result: DataTableColumn<StockTransfer>[] = [
    {
      key: "reference_number",
      label: t("stockTransferLogs.reference"),
      sortable: true,
    },
    { key: "source_warehouse", label: t("stockTransferLogs.sourceWarehouse") },
    {
      key: "destination_warehouse",
      label: t("stockTransferLogs.destinationWarehouse"),
    },
  ];
  if (appliedFilters.warehouse_id)
    result.push({ key: "direction", label: t("stockTransferLogs.direction") });
  result.push(
    { key: "items_count", label: t("stockTransferLogs.itemsCount"), align: "center" },
    { key: "total_quantity", label: t("stockTransferLogs.totalQuantity"), align: "center" },
    { key: "creator", label: t("stockTransferLogs.transferredBy") },
    {
      key: "transferred_at",
      label: t("stockTransferLogs.transferDate"),
      sortable: true,
    },
    { key: "notes", label: t("stockTransferLogs.notes") },
    { key: "actions", label: t("table.actions"), align: "right" },
  );
  return result;
});
const warehouseOptions = computed(() =>
  warehouses.value.map((warehouse) => ({
    value: warehouse.id,
    label: displayName(warehouse),
    description: warehouse.branch ? displayName(warehouse.branch) : warehouse.address || undefined,
    searchText: [
      warehouse.name,
      warehouse.translation_name?.ar,
      warehouse.translation_name?.en,
      warehouse.branch?.name,
      warehouse.address,
    ]
      .filter(Boolean)
      .join(" "),
  })),
);
const productItemOptions = computed(() =>
  productItems.value.map((item) => ({
    value: item.id,
    label: `${displayName(item.product)} - ${item.sku}`,
    searchText: [item.sku, item.product?.name].filter(Boolean).join(" "),
  })),
);
const userOptions = computed(() =>
  users.value.map((user) => ({
    value: user.id,
    label: user.name,
    description: user.email,
  })),
);

function displayName(record?: { name?: string | null; translation_name?: { ar?: string | null; en?: string | null } } | null) {
  return record?.name ?? record?.translation_name?.ar ?? record?.translation_name?.en ?? "—";
}

function sourceWarehouse(log: StockTransfer) {
  return log.source_warehouse ?? log.from_warehouse;
}

function destinationWarehouse(log: StockTransfer) {
  return log.destination_warehouse ?? log.to_warehouse;
}

function formatNumber(value?: number | string | null) {
  return new Intl.NumberFormat(locale.value).format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
}

function direction(log: StockTransfer) {
  if (!appliedFilters.warehouse_id) return null;
  const sourceId = log.source_warehouse_id ?? log.from_warehouse_id;
  const destinationId = log.destination_warehouse_id ?? log.to_warehouse_id;
  if (sourceId === appliedFilters.warehouse_id) return "outgoing";
  if (destinationId === appliedFilters.warehouse_id) return "incoming";
  return null;
}

function numberFromQuery(value: unknown) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function hydrateFromQuery() {
  search.value = typeof route.query.search === "string" ? route.query.search : "";
  page.value = numberFromQuery(route.query.page) ?? 1;
  sortColumn.value =
    typeof route.query.sort_column === "string" &&
    allowedSortColumns.includes(route.query.sort_column)
      ? route.query.sort_column
      : "id";
  sortDirection.value = route.query.sort_direction === "asc" ? "asc" : "desc";
  filters.reference_number =
    typeof route.query.reference_number === "string" ? route.query.reference_number : "";
  filters.warehouse_id = numberFromQuery(route.query.warehouse_id);
  filters.source_warehouse_id =
    numberFromQuery(route.query.source_warehouse_id) ??
    numberFromQuery(route.query.from_warehouse_id);
  filters.destination_warehouse_id =
    numberFromQuery(route.query.destination_warehouse_id) ??
    numberFromQuery(route.query.to_warehouse_id);
  filters.product_item_id = numberFromQuery(route.query.product_item_id);
  filters.created_by = numberFromQuery(route.query.created_by);
  filters.from_date = typeof route.query.from_date === "string" ? route.query.from_date : "";
  filters.to_date = typeof route.query.to_date === "string" ? route.query.to_date : "";
  filters.created_from =
    typeof route.query.created_from === "string" ? route.query.created_from : "";
  filters.created_to =
    typeof route.query.created_to === "string" ? route.query.created_to : "";
  Object.assign(appliedFilters, filters);
}

function queryParams(): StockTransferLogListQuery {
  return {
    page: page.value,
    per_page: 15,
    sort_column: sortColumn.value,
    sort_direction: sortDirection.value,
    ...(search.value.trim() ? { search: search.value.trim() } : {}),
    ...(appliedFilters.reference_number.trim()
      ? { reference_number: appliedFilters.reference_number.trim() }
      : {}),
    ...(appliedFilters.warehouse_id ? { warehouse_id: appliedFilters.warehouse_id } : {}),
    ...(appliedFilters.source_warehouse_id ? { source_warehouse_id: appliedFilters.source_warehouse_id } : {}),
    ...(appliedFilters.destination_warehouse_id ? { destination_warehouse_id: appliedFilters.destination_warehouse_id } : {}),
    ...(appliedFilters.product_item_id ? { product_item_id: appliedFilters.product_item_id } : {}),
    ...(appliedFilters.created_by ? { created_by: appliedFilters.created_by } : {}),
    ...(appliedFilters.from_date ? { from_date: appliedFilters.from_date } : {}),
    ...(appliedFilters.to_date ? { to_date: appliedFilters.to_date } : {}),
    ...(appliedFilters.created_from ? { created_from: appliedFilters.created_from } : {}),
    ...(appliedFilters.created_to ? { created_to: appliedFilters.created_to } : {}),
  };
}

async function load() {
  const currentRequest = ++requestId;
  loading.value = true;
  errorMessage.value = "";
  genericLoadError.value = false;
  try {
    const response = await listStockTransferLogs(queryParams());
    if (currentRequest !== requestId) return;
    if (Array.isArray(response)) {
      rows.value = response;
      pageData.value = null;
    } else {
      rows.value = response.data;
      pageData.value = response;
    }
  } catch (error) {
    if (currentRequest !== requestId) return;
    rows.value = [];
    pageData.value = null;
    genericLoadError.value =
      !(error instanceof ApiError) || !error.statusCode || error.statusCode >= 500;
    errorMessage.value = error instanceof ApiError ? error.message : "";
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

async function updateRoute() {
  const query = Object.fromEntries(
    Object.entries(queryParams())
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );
  const target = router.resolve({ name: "stock-transfer-logs.index", query });
  if (target.fullPath === route.fullPath) await load();
  else await router.replace(target);
}

function applySearch(value: string) {
  search.value = value;
  page.value = 1;
  void updateRoute();
}

function applyFilters() {
  Object.assign(appliedFilters, filters);
  page.value = 1;
  void updateRoute();
}

function resetFilters() {
  Object.assign(filters, emptyFilters());
  Object.assign(appliedFilters, emptyFilters());
  page.value = 1;
  void updateRoute();
}

function changePage(nextPage: number) {
  page.value = nextPage;
  void updateRoute();
}

function sortBy(column: string) {
  if (!["reference_number", "transferred_at", "created_at"].includes(column)) return;
  if (sortColumn.value === column) sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  else {
    sortColumn.value = column;
    sortDirection.value = "asc";
  }
  page.value = 1;
  void updateRoute();
}

async function loadLookups() {
  lookupsLoading.value = true;
  const requests: Promise<void>[] = [
    listWarehouses({ per_page: -1 })
      .then((response) => { warehouses.value = Array.isArray(response) ? response : response.data; }),
    listProductItems({ per_page: -1 })
      .then((response) => { productItems.value = Array.isArray(response) ? response : response.data; }),
  ];
  if (canLoadUsers.value)
    requests.push(
      listUsers({ per_page: 1000 })
        .then((response) => { users.value = response.data; }),
    );
  const results = await Promise.allSettled(requests);
  lookupsLoading.value = false;
  if (results.some((result) => result.status === "rejected"))
    toast.error(t("stockTransferLogs.filtersLoadFailed"));
}

function openDetails(log: StockTransfer) {
  void router.push({
    name: "stock-transfer-logs.show",
    params: { id: log.id },
    query: route.query,
  });
}

watch(
  () => route.query,
  () => {
    hydrateFromQuery();
    void load();
  },
  { deep: true, immediate: true },
);

onMounted(() => void loadLookups());
</script>

<template>
  <PageHeader :title="pageTitle" :description="t('stockTransferLogs.description')" />

  <CrudToolbar
    :search="search"
    :loading="loading"
    :search-placeholder="t('stockTransferLogs.searchPlaceholder')"
    @search="applySearch"
    @refresh="load"
  />

  <CrudFilterPanel
    :active-count="activeFiltersCount"
    :loading="loading"
    :reset-disabled="!activeFiltersCount"
    :title="t('stockTransferLogs.filterTitle')"
    :hint="t('stockTransferLogs.filterHint')"
    @apply="applyFilters"
    @reset="resetFilters"
  >
    <FormInput
      id="transfer-log-reference"
      v-model="filters.reference_number"
      :label="t('stockTransferLogs.reference')"
      :placeholder="t('stockTransferLogs.referencePlaceholder')"
    />
    <BaseSelect
      id="transfer-log-warehouse"
      v-model="filters.warehouse_id"
      :label="t('stockTransferLogs.relatedWarehouse')"
      :options="warehouseOptions"
      :loading="lookupsLoading"
      searchable
      clearable
    />
    <BaseSelect
      id="transfer-log-source"
      v-model="filters.source_warehouse_id"
      :label="t('stockTransferLogs.sourceWarehouse')"
      :options="warehouseOptions"
      :loading="lookupsLoading"
      searchable
      clearable
    />
    <BaseSelect
      id="transfer-log-destination"
      v-model="filters.destination_warehouse_id"
      :label="t('stockTransferLogs.destinationWarehouse')"
      :options="warehouseOptions"
      :loading="lookupsLoading"
      searchable
      clearable
    />
    <BaseSelect
      id="transfer-log-product-item"
      v-model="filters.product_item_id"
      :label="t('table.productItem')"
      :options="productItemOptions"
      :loading="lookupsLoading"
      searchable
      clearable
    />
    <BaseSelect
      v-if="canLoadUsers"
      id="transfer-log-user"
      v-model="filters.created_by"
      :label="t('stockTransferLogs.transferredBy')"
      :options="userOptions"
      :loading="lookupsLoading"
      searchable
      clearable
    />
    <DateInput id="transfer-log-from-date" v-model="filters.from_date" :label="t('stockTransferLogs.fromDate')" />
    <DateInput id="transfer-log-to-date" v-model="filters.to_date" :label="t('stockTransferLogs.toDate')" />
    <DateInput
      id="transfer-log-created-from"
      v-model="filters.created_from"
      :label="`${t('table.createdAt')} - ${t('stockTransferLogs.fromDate')}`"
    />
    <DateInput
      id="transfer-log-created-to"
      v-model="filters.created_to"
      :label="`${t('table.createdAt')} - ${t('stockTransferLogs.toDate')}`"
    />
  </CrudFilterPanel>

  <div v-if="displayedError" class="panel border-danger/30 p-6 text-danger" role="alert">
    <p class="font-semibold">{{ displayedError }}</p>
    <BaseButton class="mt-4" variant="outline" type="button" @click="load">{{ t("actions.refresh") }}</BaseButton>
  </div>
  <DataTable
    v-else
    :columns="columns"
    :rows="rows"
    :loading="loading"
    :empty-title="hasFilters ? t('stockTransferLogs.noMatchingResults') : t('stockTransferLogs.emptyTitle')"
    :empty-message="t('stockTransferLogs.emptyMessage')"
    :sort-column="sortColumn"
    :sort-direction="sortDirection"
    @sort="sortBy"
  >
    <template #cell-reference_number="{ row }">
      <button class="font-mono text-sm font-bold text-primary hover:underline" type="button" @click="openDetails(row)">
        {{ row.reference_number || `#${row.id}` }}
      </button>
    </template>
    <template #cell-source_warehouse="{ row }">
      <div class="font-semibold">{{ displayName(sourceWarehouse(row)) }}</div>
      <div v-if="sourceWarehouse(row)?.branch" class="mt-1 text-xs text-text-muted">{{ displayName(sourceWarehouse(row)?.branch) }}</div>
    </template>
    <template #cell-destination_warehouse="{ row }">
      <div class="font-semibold">{{ displayName(destinationWarehouse(row)) }}</div>
      <div v-if="destinationWarehouse(row)?.branch" class="mt-1 text-xs text-text-muted">{{ displayName(destinationWarehouse(row)?.branch) }}</div>
    </template>
    <template #cell-direction="{ row }">
      <BaseBadge v-if="direction(row)" :variant="direction(row) === 'incoming' ? 'success' : 'secondary'">
        {{ t(`stockTransferLogs.${direction(row)}`) }}
      </BaseBadge>
      <span v-else>—</span>
    </template>
    <template #cell-items_count="{ row }">{{ formatNumber(row.items_count ?? 0) }}</template>
    <template #cell-total_quantity="{ row }"><strong>{{ formatNumber(row.total_quantity ?? row.quantity) }}</strong></template>
    <template #cell-creator="{ row }">{{ row.creator?.name ?? "—" }}</template>
    <template #cell-transferred_at="{ row }">{{ formatDate(row.transferred_at ?? row.created_at) }}</template>
    <template #cell-notes="{ row }"><span class="block max-w-56 truncate" :title="row.notes || undefined">{{ row.notes || "—" }}</span></template>
    <template #cell-actions="{ row }"><CrudShowButton @click="openDetails(row)" /></template>
  </DataTable>

  <Pagination v-if="pageData && !displayedError" :meta="pageData" @change="changePage" />
</template>
