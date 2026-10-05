<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import DateInput from "@/components/forms/DateInput.vue";
import FormInput from "@/components/forms/FormInput.vue";
import SelectInput from "@/components/forms/SelectInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { ApiError } from "@/api/http";
import { usePermissions } from "@/composables/usePermissions";
import { useToastStore } from "@/stores/toast";
import { listParties, listWarehouses, purchaseStockBulk } from "../api";
import type { Party, ProductItem, ProductItemBatch, PurchaseBulkStockPayload, Warehouse } from "../types";
import type { PaymentMethod } from "@/modules/sales/types";
import PartySelectField from "./PartySelectField.vue";

const props = defineProps<{
  open: boolean;
  productItem?: ProductItem | null;
  productItemId?: number | null;
  productItemLabel?: string;
  defaultWarehouseId?: number | null;
}>();

const emit = defineEmits<{ close: []; success: [batch: ProductItemBatch] }>();
const { t } = useI18n();
const toast = useToastStore();
const { can } = usePermissions();
const router = useRouter();

const loadingOptions = ref(false);
const saving = ref(false);
const errors = ref<Record<string, string[]>>({});
const errorMessage = ref("");
const suppliers = ref<Party[]>([]);
const warehouses = ref<Warehouse[]>([]);
const merchantLoadError = ref("");
const quantityByWarehouseId = reactive<Record<number, string>>({});
const warehouseErrors = reactive<Record<number, string[]>>({});
const submittedIndexToWarehouseId = ref<Record<number, number>>({});

const form = reactive({
  supplier_party_id: null as number | null,
  purchase_price: 0 as number | string,
  purchased_at: "",
  payment_method: "cash" as PaymentMethod,
  create_installment_plan: false,
});

const itemId = computed(() => props.productItem?.id ?? props.productItemId ?? null);
const itemLabel = computed(() => props.productItemLabel ?? props.productItem?.sku ?? (itemId.value ? `#${itemId.value}` : "—"));
const canLoadSuppliers = computed(() => can("read-party") && can(["view-all-party", "view-own-party", "read-party"]));
const canCreatePurchasePlan = computed(() => can("create-installment") && can("read-purchase") && can(["view-all-purchase", "view-own-purchase"]));
const paymentMethodOptions = computed(() => (["cash", "card", "transfer"] as PaymentMethod[]).map((value) => ({ value, label: t(`sales.paymentMethods.${value}`) })));
const orderedWarehouses = computed(() => {
  const defaultId = props.defaultWarehouseId;
  return [...warehouses.value].sort((a, b) => {
    if (defaultId && a.id === defaultId) return -1;
    if (defaultId && b.id === defaultId) return 1;
    return displayName(a).localeCompare(displayName(b));
  });
});
function displayName(record?: { name?: string | null; translation_name?: { ar?: string | null; en?: string | null } } | null) {
  return record?.name ?? record?.translation_name?.ar ?? record?.translation_name?.en ?? "—";
}

function normalizeList<T>(response: T[] | { data: T[] }): T[] {
  return Array.isArray(response) ? response : response.data;
}

function resetForm() {
  Object.assign(form, {
    supplier_party_id: null,
    purchase_price: 0,
    purchased_at: "",
    payment_method: "cash",
    create_installment_plan: false,
  });
  Object.keys(quantityByWarehouseId).forEach((key) => delete quantityByWarehouseId[Number(key)]);
  clearWarehouseErrors();
  errors.value = {};
  errorMessage.value = "";
  merchantLoadError.value = "";
  submittedIndexToWarehouseId.value = {};
}

function selectPlan(checked: boolean) {
  form.create_installment_plan = checked && canCreatePurchasePlan.value;
}

function settlementMode(): PurchaseBulkStockPayload["settlement_mode"] {
  if (form.create_installment_plan && canCreatePurchasePlan.value) return "plan";
  return "paid";
}

function clearWarehouseErrors() {
  Object.keys(warehouseErrors).forEach((key) => delete warehouseErrors[Number(key)]);
}

async function loadOptions() {
  loadingOptions.value = true;
  merchantLoadError.value = "";
  try {
    const [warehouseResponse, merchantResponse] = await Promise.all([
      listWarehouses({ per_page: -1, is_active: true }),
      canLoadSuppliers.value ? listParties({ per_page: -1, classification: 'supplier', is_active: true }) : Promise.resolve([]),
    ]);
    warehouses.value = normalizeList(warehouseResponse);
    suppliers.value = normalizeList(merchantResponse);
    if (!canLoadSuppliers.value) merchantLoadError.value = t("parties.readRequired");
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message || t("inventory.addStockOptionsFailed");
      if (canLoadSuppliers.value) merchantLoadError.value = error.message;
    }
  } finally {
    loadingOptions.value = false;
  }
}

function closeDialog() {
  if (saving.value) return;
  resetForm();
  emit("close");
}

function validate() {
  const next: Record<string, string[]> = {};
  clearWarehouseErrors();
  if (!itemId.value) next.product_item_id = [t("inventory.productItemRequired")];
  if (!form.supplier_party_id) next.supplier_party_id = [t("inventory.supplierRequired")];
  let hasPositiveQuantity = false;
  for (const warehouse of orderedWarehouses.value) {
    const parsed = parseWarehouseQty(quantityByWarehouseId[warehouse.id]);
    if (parsed === 0) continue; // blank or zero → skip
    if (parsed === null) { warehouseErrors[warehouse.id] = [t("inventory.quantityIntegerMin")]; }
    else { hasPositiveQuantity = true; }
  }
  if (!hasPositiveQuantity && !Object.keys(warehouseErrors).length) next.warehouses = [t("inventory.atLeastOneWarehouseQuantity")];
  if (form.purchase_price === "" || Number(form.purchase_price) < 0) next.purchase_price = [t("inventory.purchasePriceMin")];
  else if (!Number.isFinite(Number(form.purchase_price)) || form.purchase_price.toString().split('.')[1]?.length > 2) next.purchase_price = [t("inventory.purchasePriceDecimals")];
  errors.value = next;
  return Object.keys(next).length === 0 && Object.keys(warehouseErrors).length === 0;
}

function buildWarehouseLines() {
  return orderedWarehouses.value.flatMap((warehouse) => {
    const parsed = parseWarehouseQty(quantityByWarehouseId[warehouse.id]);
    if (!parsed) return [];
    return [{ warehouse_id: warehouse.id, quantity: parsed }];
  });
}

/** Safely parse a warehouse quantity input: blank/0 → skip, valid positive int → number, otherwise → null (error). */
function parseWarehouseQty(raw: string | number | null | undefined): number | null {
  const s = raw == null ? "" : String(raw).trim();
  if (s === "" || (/^\d+$/.test(s) && Number(s) === 0)) return 0; // 0 sentinel = skip
  if (/^\d+$/.test(s) && Number(s) >= 1) return Number(s);
  return null; // error – non-numeric / negative / decimal
}

function applyApiErrors(apiErrors: Record<string, string[]>) {
  const nextErrors: Record<string, string[]> = {};
  clearWarehouseErrors();
  Object.entries(apiErrors).forEach(([key, messages]) => {
    const match = key.match(/^warehouses\.(\d+)\.(warehouse_id|quantity)$/);
    if (match) {
      const warehouseId = submittedIndexToWarehouseId.value[Number(match[1])];
      if (warehouseId) warehouseErrors[warehouseId] = messages;
      else nextErrors[key] = messages;
      return;
    }
    nextErrors[key] = messages;
  });
  errors.value = nextErrors;
}

async function submit() {
  if (saving.value || !validate()) return;
  saving.value = true;
  errorMessage.value = "";
  try {
    const lines = buildWarehouseLines();
    submittedIndexToWarehouseId.value = Object.fromEntries(lines.map((line, index) => [index, line.warehouse_id]));
    const mode = settlementMode();
    const payload: PurchaseBulkStockPayload = {
      product_item_id: itemId.value as number,
      supplier_party_id: form.supplier_party_id as number,
      purchase_price: form.purchase_price,
      payment_method: form.payment_method,
      settlement_mode: mode,
      warehouses: lines,
      ...(form.purchased_at ? { purchased_at: form.purchased_at } : {}),
    };
    const batch = await purchaseStockBulk(payload);
    toast.success(t("inventory.stockPurchased"));
    const planMode = mode === "plan";
    resetForm();
    emit("success", batch);
    emit("close");
    if (planMode && batch.purchase_id) void router.push({ name: 'purchases.show', params: { id: batch.purchase_id }, query: { plan: '1' } });
  } catch (error) {
    if (error instanceof ApiError) {
      applyApiErrors(error.errors ?? {});
      errorMessage.value = error.message;
    }
  } finally {
    saving.value = false;
  }
}

watch(() => props.open, (open) => {
  if (!open) return;
  resetForm();
  void loadOptions();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[70] grid place-items-center bg-text/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" :aria-label="t('inventory.addStock')">
      <form class="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-elevated" @submit.prevent="submit">
        <h2 class="text-lg font-bold text-text">{{ t("inventory.addStock") }}</h2>
        <p class="mt-1 text-sm text-text-muted">{{ t("inventory.addStockDescription", { item: itemLabel }) }}</p>
        <p v-if="errorMessage" class="mt-3 rounded-[var(--radius-md)] bg-danger/10 p-3 text-sm text-danger">{{ errorMessage }}</p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <PartySelectField id="purchase_supplier" v-model="form.supplier_party_id" class="md:col-span-2" :label="t('parties.supplier')" :placeholder="t('parties.selectSupplier')" :parties="suppliers" :loading="loadingOptions" :disabled="!canLoadSuppliers || Boolean(merchantLoadError)" :error="errors.supplier_party_id?.[0] || errors.merchant_id?.[0] || merchantLoadError" required />
          <FormInput id="purchase_price" v-model="form.purchase_price" :label="t('inventory.purchasePrice')" type="number" min="0" step="0.01" required :error="errors.purchase_price?.[0]" />
          <DateInput id="purchase_date" v-model="form.purchased_at" :label="t('inventory.purchaseDate')" :error="errors.purchased_at?.[0]" />
          <SelectInput id="purchase_payment_method" v-model="form.payment_method" :label="t('sales.paymentMethod')" :options="paymentMethodOptions" :error="errors.payment_method?.[0]" required />
          <div class="flex flex-wrap gap-4 md:col-span-2">
            <label class="inline-flex items-center gap-2 text-sm font-medium text-text"><input :checked="form.create_installment_plan" type="checkbox" class="rounded border-border text-primary" :disabled="!canCreatePurchasePlan" @change="selectPlan(($event.target as HTMLInputElement).checked)" />{{ t('installments.createPlanAfterPurchase') }}<span v-if="!canCreatePurchasePlan" class="text-xs font-normal text-text-muted">({{ t('installments.planPermissionRequired') }})</span></label>
          </div>
          <div class="md:col-span-2">
            <div class="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p class="form-label">{{ t("inventory.warehouseQuantities") }}</p>
                <p class="mt-1 text-xs text-text-muted">{{ t("inventory.blankZeroWarehouseHint") }}</p>
              </div>
            </div>
            <p v-if="errors.warehouses?.[0]" class="form-error mt-2">{{ errors.warehouses[0] }}</p>
            <div class="mt-3 max-h-80 overflow-y-auto rounded-[var(--radius-lg)] border border-border">
              <div v-if="loadingOptions" class="p-4 text-sm text-text-muted">{{ t("states.loading") }}</div>
              <div v-else-if="!orderedWarehouses.length" class="p-4 text-sm text-text-muted">{{ t("states.emptyTitle") }}</div>
              <div v-else class="divide-y divide-border">
                <label v-for="(warehouse, index) in orderedWarehouses" :key="warehouse.id" class="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start" :for="`purchase_warehouse_${warehouse.id}`">
                  <span>
                    <span class="font-medium text-text">
                      {{ displayName(warehouse) }}
                      <span v-if="warehouse.id === defaultWarehouseId" class="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{{ t("common.default") }}</span>
                    </span>
                    <span v-if="warehouse.address" class="mt-1 block text-xs text-text-muted">{{ warehouse.address }}</span>
                    <span v-if="warehouseErrors[warehouse.id]?.[0]" class="form-error mt-1">{{ warehouseErrors[warehouse.id][0] }}</span>
                  </span>
                  <input
                    :id="`purchase_warehouse_${warehouse.id}`"
                    v-model="quantityByWarehouseId[warehouse.id]"
                    class="form-control"
                    :autofocus="index === 0 && warehouse.id === defaultWarehouseId"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    step="1"
                    pattern="[0-9]*"
                    :placeholder="t('table.quantity')"
                    :disabled="saving"
                    :aria-invalid="warehouseErrors[warehouse.id]?.[0] ? 'true' : 'false'"
                    @keydown="['-', '+', '.', ',', 'e', 'E'].includes($event.key) && $event.preventDefault()"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <BaseButton variant="secondary" type="button" :disabled="saving" @click="closeDialog">{{ t("actions.cancel") }}</BaseButton>
          <BaseButton type="submit" :loading="saving" :disabled="loadingOptions || !canLoadSuppliers || Boolean(merchantLoadError)">{{ saving ? t("actions.saving") : t("inventory.addStock") }}</BaseButton>
        </div>
      </form>
    </div>
  </Teleport>
</template>
