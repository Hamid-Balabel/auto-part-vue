<script setup lang="ts">
import { CreditCard, Edit3, Trash2 } from "@lucide/vue";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ApiError } from "@/api/http";
import ConfirmDialog from "@/components/modals/ConfirmDialog.vue";
import BaseSelect from "@/components/forms/BaseSelect.vue";
import DateInput from "@/components/forms/DateInput.vue";
import FormInput from "@/components/forms/FormInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import CrudDetailsModal from "@/components/ui/CrudDetailsModal.vue";
import CrudFilterPanel from "@/components/ui/CrudFilterPanel.vue";
import CrudShowButton from "@/components/ui/CrudShowButton.vue";
import CrudToolbar from "@/components/ui/CrudToolbar.vue";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable.vue";
import DetailsField from "@/components/ui/DetailsField.vue";
import DetailsSection from "@/components/ui/DetailsSection.vue";
import MoneyDisplay from "@/components/ui/MoneyDisplay.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import Pagination from "@/components/ui/Pagination.vue";
import { useCrudList } from "@/composables/useCrudList";
import { usePermissions } from "@/composables/usePermissions";
import { listCustomers } from "@/modules/inventory/api";
import type { Customer } from "@/modules/inventory/types";
import { useToastStore } from "@/stores/toast";
import {
  createInstallment,
  deleteInstallment,
  generateInstallmentPlan,
  getInstallment,
  listInstallments,
  listOrders,
  payInstallment,
  updateInstallment,
} from "../api";
import SalesStatusBadge from "../components/SalesStatusBadge.vue";
import type {
  Installment,
  InstallmentListQuery,
  InstallmentStatus,
  Order,
  PaymentMethod,
} from "../types";

const { t, locale } = useI18n();
const { can } = usePermissions();
const toast = useToastStore();
const orders = ref<Order[]>([]);
const customers = ref<Customer[]>([]);
const optionsLoading = ref(false);
const detailsOpen = ref(false);
const detailsLoading = ref(false);
const detailsError = ref("");
const selectedInstallment = ref<Installment | null>(null);
const deleteTarget = ref<Installment | null>(null);
const formMode = ref<"create" | "edit" | "pay" | "plan" | null>(null);
const formTarget = ref<Installment | null>(null);
const formLoading = ref(false);
const formErrors = ref<Record<string, string[]>>({});

interface Filters {
  order_id: number | null;
  customer_id: number | null;
  status: InstallmentStatus | null;
  payment_method: PaymentMethod | null;
  amount_min: string;
  amount_max: string;
  due_date_from: string;
  due_date_to: string;
  paid_at_from: string;
  paid_at_to: string;
  is_paid: string;
  created_from: string;
  created_to: string;
}

const emptyFilters = (): Filters => ({
  order_id: null,
  customer_id: null,
  status: null,
  payment_method: null,
  amount_min: "",
  amount_max: "",
  due_date_from: "",
  due_date_to: "",
  paid_at_from: "",
  paid_at_to: "",
  is_paid: "",
  created_from: "",
  created_to: "",
});
const filters = reactive<Filters>(emptyFilters());
const appliedFilters = ref<Filters>(emptyFilters());
const installmentForm = reactive({
  order_id: null as number | null,
  amount: "",
  due_date: "",
  status: "pending" as InstallmentStatus,
  payment_method: "cash" as PaymentMethod,
});
const planForm = reactive({
  order_id: null as number | null,
  installment_count: "1",
  initial_paid_amount: "0",
  first_due_date: "",
  interval_months: "1",
  payment_method: "cash" as PaymentMethod,
});

const list = useCrudList<Installment>({
  list: (query) =>
    listInstallments({ ...query, ...toFilterQuery(appliedFilters.value) }),
  defaultSortColumn: "id",
  defaultSortDirection: "desc",
});

const columns = computed<DataTableColumn<Installment>[]>(() => [
  { key: "id", label: t("table.id"), sortable: true },
  { key: "order", label: t("sales.invoiceNo") },
  { key: "customer", label: t("sales.customer") },
  { key: "amount", label: t("sales.installmentAmount"), sortable: true },
  { key: "due_date", label: t("sales.dueDate"), sortable: true },
  { key: "paid_at", label: t("sales.paymentDate"), sortable: true },
  { key: "payment_method", label: t("sales.paymentMethod"), sortable: true },
  { key: "status", label: t("table.status"), sortable: true },
  { key: "actions", label: t("table.actions"), align: "right" },
]);
const statusOptions = computed(() =>
  (["pending", "paid", "overdue"] as InstallmentStatus[]).map((value) => ({
    value,
    label: t(`sales.statuses.${value}`),
  })),
);
const editableStatusOptions = computed(() =>
  statusOptions.value.filter(({ value }) => value !== "paid"),
);
const paymentMethodOptions = computed(() =>
  (["cash", "card", "transfer"] as PaymentMethod[]).map((value) => ({
    value,
    label: t(`sales.paymentMethods.${value}`),
  })),
);
const paidOptions = computed(() => [
  { value: "", label: t("crud.all") },
  { value: "true", label: t("crud.yes") },
  { value: "false", label: t("crud.no") },
]);
const orderOptions = computed(() =>
  orders.value.map((order) => ({
    value: order.id,
    label: order.invoice_no,
    description: order.customer?.name,
    searchText: `${order.invoice_no} ${order.customer?.name ?? ""}`,
  })),
);
const customerOptions = computed(() =>
  customers.value.map((customer) => ({
    value: customer.id,
    label: customer.name,
    description: customer.phone ?? customer.email ?? undefined,
    searchText: `${customer.name} ${customer.phone ?? ""} ${customer.email ?? ""}`,
  })),
);
const activeFilterCount = computed(
  () =>
    Object.values(appliedFilters.value).filter(
      (value) => value !== "" && value !== null,
    ).length,
);
const formTitle = computed(() => {
  if (formMode.value === "edit") return t("sales.editInstallment");
  if (formMode.value === "pay") return t("sales.payInstallment");
  if (formMode.value === "plan") return t("sales.generateInstallmentPlan");
  return t("sales.createInstallment");
});

function toFilterQuery(value: Filters): InstallmentListQuery {
  const query = Object.fromEntries(
    Object.entries(value).filter(
      ([, filterValue]) => filterValue !== "" && filterValue !== null,
    ),
  ) as InstallmentListQuery;
  if (value.is_paid !== "") query.is_paid = value.is_paid === "true";
  return query;
}

function fieldError(field: string) {
  return formErrors.value[field]?.[0];
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(
    locale.value,
    withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  ).format(new Date(value));
}

function applyFilters() {
  appliedFilters.value = { ...filters };
  list.page.value = 1;
  void list.load();
}

function resetFilters() {
  Object.assign(filters, emptyFilters());
  appliedFilters.value = emptyFilters();
  list.page.value = 1;
  void list.load();
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const [orderResponse, customerResponse] = await Promise.all([
      listOrders({ per_page: -1 }),
      listCustomers({ per_page: -1 }),
    ]);
    orders.value = Array.isArray(orderResponse)
      ? orderResponse
      : orderResponse.data;
    customers.value = Array.isArray(customerResponse)
      ? customerResponse
      : customerResponse.data;
  } catch (error) {
    toast.error(
      error instanceof ApiError ? error.message : t("sales.optionsLoadFailed"),
    );
  } finally {
    optionsLoading.value = false;
  }
}

async function openDetails(id: number) {
  detailsOpen.value = true;
  detailsLoading.value = true;
  detailsError.value = "";
  selectedInstallment.value = null;
  try {
    selectedInstallment.value = await getInstallment(id);
  } catch (error) {
    detailsError.value =
      error instanceof ApiError ? error.message : t("details.failedToLoad");
  } finally {
    detailsLoading.value = false;
  }
}

function closeDetails() {
  detailsOpen.value = false;
  selectedInstallment.value = null;
  detailsError.value = "";
}

function openCreate() {
  formTarget.value = null;
  Object.assign(installmentForm, {
    order_id: null,
    amount: "",
    due_date: "",
    status: "pending",
    payment_method: "cash",
  });
  formErrors.value = {};
  formMode.value = "create";
}

function openEdit(installment: Installment) {
  formTarget.value = installment;
  Object.assign(installmentForm, {
    order_id: installment.order_id,
    amount: String(installment.amount),
    due_date: installment.due_date?.slice(0, 10) ?? "",
    status: installment.status === "paid" ? "pending" : installment.status,
    payment_method: installment.payment_method,
  });
  formErrors.value = {};
  formMode.value = "edit";
}

function openPay(installment: Installment) {
  formTarget.value = installment;
  Object.assign(installmentForm, {
    order_id: installment.order_id,
    amount: String(installment.amount),
    due_date: installment.due_date?.slice(0, 10) ?? "",
    status: installment.status,
    payment_method: installment.payment_method,
  });
  formErrors.value = {};
  formMode.value = "pay";
}

function openPlan() {
  formTarget.value = null;
  Object.assign(planForm, {
    order_id: null,
    installment_count: "1",
    initial_paid_amount: "0",
    first_due_date: "",
    interval_months: "1",
    payment_method: "cash",
  });
  formErrors.value = {};
  formMode.value = "plan";
}

function closeForm() {
  if (formLoading.value) return;
  formMode.value = null;
  formTarget.value = null;
  formErrors.value = {};
}

async function submitForm() {
  formLoading.value = true;
  formErrors.value = {};
  try {
    if (formMode.value === "plan" && planForm.order_id) {
      await generateInstallmentPlan(planForm.order_id, {
        installment_count: Number(planForm.installment_count),
        initial_paid_amount: planForm.initial_paid_amount || 0,
        first_due_date: planForm.first_due_date,
        interval_months: Number(planForm.interval_months),
        payment_method: planForm.payment_method,
      });
      toast.success(t("sales.installmentPlanCreated"));
    } else if (formMode.value === "pay" && formTarget.value) {
      await payInstallment(formTarget.value.id, {
        amount: formTarget.value.amount,
        payment_method: installmentForm.payment_method,
      });
      toast.success(t("sales.installmentPaid"));
    } else if (formMode.value === "edit" && formTarget.value) {
      await updateInstallment(formTarget.value.id, {
        amount: installmentForm.amount,
        due_date: installmentForm.due_date || null,
        status: installmentForm.status,
        payment_method: installmentForm.payment_method,
      });
      toast.success(t("crud.saved"));
    } else if (formMode.value === "create" && installmentForm.order_id) {
      await createInstallment({
        order_id: installmentForm.order_id,
        amount: installmentForm.amount,
        due_date: installmentForm.due_date || null,
        status: installmentForm.status,
        payment_method: installmentForm.payment_method,
      });
      toast.success(t("crud.saved"));
    } else {
      return;
    }
    formMode.value = null;
    formTarget.value = null;
    await list.load();
  } catch (error) {
    if (error instanceof ApiError) {
      formErrors.value = error.errors ?? {};
      toast.error(error.message);
    } else toast.error(t("sales.installmentSaveFailed"));
  } finally {
    formLoading.value = false;
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await list.mutate(async () => {
      await deleteInstallment(deleteTarget.value!.id);
      toast.success(t("crud.deleted"));
    });
    deleteTarget.value = null;
  } catch (error) {
    toast.error(
      error instanceof ApiError
        ? error.message
        : t("sales.installmentDeleteFailed"),
    );
  }
}

onMounted(() => {
  void list.load();
  void loadOptions();
});
</script>

<template>
  <PageHeader
    :title="t('sales.installmentsTitle')"
    :description="t('sales.installmentsDescription')"
  >
    <template #actions>
      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-if="can('create-installment')"
          variant="outline"
          @click="openPlan"
        >
          {{ t("sales.generateInstallmentPlan") }}
        </BaseButton>
        <BaseButton v-if="can('create-installment')" @click="openCreate">
          {{ t("sales.createInstallment") }}
        </BaseButton>
      </div>
    </template>
  </PageHeader>

  <CrudToolbar
    :search="list.search.value"
    :loading="list.loading.value"
    :search-placeholder="t('sales.searchInstallments')"
    @search="list.applySearch"
    @refresh="list.load"
  />

  <CrudFilterPanel
    :active-count="activeFilterCount"
    :loading="list.loading.value"
    @apply="applyFilters"
    @reset="resetFilters"
  >
    <BaseSelect
      id="installment-order-filter"
      v-model="filters.order_id"
      :label="t('sales.order')"
      :options="orderOptions"
      :loading="optionsLoading"
      :placeholder="t('crud.all')"
      searchable
      clearable
    />
    <BaseSelect
      id="installment-customer-filter"
      v-model="filters.customer_id"
      :label="t('sales.customer')"
      :options="customerOptions"
      :loading="optionsLoading"
      :placeholder="t('crud.all')"
      searchable
      clearable
    />
    <BaseSelect
      id="installment-status-filter"
      v-model="filters.status"
      :label="t('table.status')"
      :options="statusOptions"
      :placeholder="t('crud.all')"
      clearable
    />
    <BaseSelect
      id="installment-method-filter"
      v-model="filters.payment_method"
      :label="t('sales.paymentMethod')"
      :options="paymentMethodOptions"
      :placeholder="t('crud.all')"
      clearable
    />
    <FormInput
      id="installment-amount-min"
      v-model="filters.amount_min"
      type="number"
      :label="t('sales.amountMin')"
    />
    <FormInput
      id="installment-amount-max"
      v-model="filters.amount_max"
      type="number"
      :label="t('sales.amountMax')"
    />
    <DateInput
      id="installment-due-from"
      v-model="filters.due_date_from"
      :label="t('sales.dueDateFrom')"
    />
    <DateInput
      id="installment-due-to"
      v-model="filters.due_date_to"
      :label="t('sales.dueDateTo')"
    />
    <DateInput
      id="installment-paid-from"
      v-model="filters.paid_at_from"
      :label="t('sales.paidAtFrom')"
    />
    <DateInput
      id="installment-paid-to"
      v-model="filters.paid_at_to"
      :label="t('sales.paidAtTo')"
    />
    <BaseSelect
      id="installment-is-paid"
      v-model="filters.is_paid"
      :label="t('sales.isPaid')"
      :options="paidOptions"
    />
    <DateInput
      id="installment-created-from"
      v-model="filters.created_from"
      :label="t('crud.fromDate')"
    />
    <DateInput
      id="installment-created-to"
      v-model="filters.created_to"
      :label="t('crud.toDate')"
    />
  </CrudFilterPanel>

  <DataTable
    :columns="columns"
    :rows="list.rows.value"
    :loading="list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    @sort="list.sortBy"
  >
    <template #cell-order="{ row }">
      <BaseButton
        variant="link"
        :to="{ name: 'orders.show', params: { id: row.order_id } }"
      >
        {{ row.order?.invoice_no ?? `#${row.order_id}` }}
      </BaseButton>
    </template>
    <template #cell-customer="{ row }">
      <div>
        <p class="font-semibold">{{ row.order?.customer?.name ?? "—" }}</p>
        <p class="text-xs text-text-muted">
          {{ row.order?.customer?.phone ?? row.order?.customer?.email ?? "" }}
        </p>
      </div>
    </template>
    <template #cell-amount="{ value }"
      ><MoneyDisplay :value="value as string" currency="EGP"
    /></template>
    <template #cell-due_date="{ value }">{{
      formatDate(value as string)
    }}</template>
    <template #cell-paid_at="{ value }">{{
      formatDate(value as string, true)
    }}</template>
    <template #cell-payment_method="{ value }">{{
      t(`sales.paymentMethods.${value}`)
    }}</template>
    <template #cell-status="{ value }"
      ><SalesStatusBadge :value="String(value)"
    /></template>
    <template #cell-actions="{ row }">
      <div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton @click="openDetails(row.id)" />
        <BaseButton
          v-if="can('update-installment') && row.status !== 'paid'"
          variant="outline"
          size="sm"
          :aria-label="t('sales.payInstallment')"
          :title="t('sales.payInstallment')"
          @click="openPay(row)"
          ><CreditCard class="size-4"
        /></BaseButton>
        <BaseButton
          v-if="can('update-installment') && row.status !== 'paid'"
          variant="ghost"
          size="sm"
          :aria-label="t('actions.edit')"
          :title="t('actions.edit')"
          @click="openEdit(row)"
          ><Edit3 class="size-4"
        /></BaseButton>
        <BaseButton
          v-if="can('delete-installment') && row.status !== 'paid'"
          variant="danger"
          size="sm"
          :aria-label="t('actions.delete')"
          :title="t('actions.delete')"
          @click="deleteTarget = row"
          ><Trash2 class="size-4"
        /></BaseButton>
      </div>
    </template>
  </DataTable>
  <Pagination
    v-if="list.pageData.value"
    :meta="list.pageData.value"
    @change="list.changePage"
  />

  <CrudDetailsModal
    :open="detailsOpen"
    :title="t('sales.installmentDetails')"
    :subtitle="selectedInstallment?.order?.invoice_no"
    :loading="detailsLoading"
    :error-message="detailsError"
    @close="closeDetails"
  >
    <div v-if="selectedInstallment" class="grid gap-4">
      <DetailsSection :title="t('details.mainInformation')">
        <dl class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <DetailsField
            :label="t('table.id')"
            :value="selectedInstallment.id"
          />
          <DetailsField
            :label="t('sales.invoiceNo')"
            :value="
              selectedInstallment.order?.invoice_no ??
              `#${selectedInstallment.order_id}`
            "
          />
          <DetailsField
            :label="t('sales.customer')"
            :value="selectedInstallment.order?.customer?.name"
          />
          <DetailsField :label="t('sales.installmentAmount')"
            ><MoneyDisplay :value="selectedInstallment.amount" currency="EGP"
          /></DetailsField>
          <DetailsField
            :label="t('sales.dueDate')"
            :value="formatDate(selectedInstallment.due_date)"
          />
          <DetailsField
            :label="t('sales.paymentDate')"
            :value="formatDate(selectedInstallment.paid_at, true)"
          />
          <DetailsField
            :label="t('sales.paymentMethod')"
            :value="
              t(`sales.paymentMethods.${selectedInstallment.payment_method}`)
            "
          />
          <DetailsField :label="t('table.status')"
            ><SalesStatusBadge :value="selectedInstallment.status"
          /></DetailsField>
          <DetailsField
            :label="t('sales.createdBy')"
            :value="
              selectedInstallment.creator?.name ??
              selectedInstallment.creator?.email
            "
          />
          <DetailsField
            :label="t('sales.createdAt')"
            :value="formatDate(selectedInstallment.created_at, true)"
          />
          <DetailsField
            :label="t('sales.updatedAt')"
            :value="formatDate(selectedInstallment.updated_at, true)"
          />
        </dl>
      </DetailsSection>
    </div>
  </CrudDetailsModal>

  <div
    v-if="formMode"
    class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-3 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
  >
    <form
      class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-elevated sm:p-6"
      @submit.prevent="submitForm"
    >
      <h2 class="text-xl font-bold">{{ formTitle }}</h2>
      <p v-if="formMode === 'pay'" class="mt-2 text-sm text-text-muted">
        {{ t("sales.exactInstallmentPaymentHint") }}
      </p>
      <div v-if="formMode === 'plan'" class="mt-5 grid gap-4 md:grid-cols-2">
        <BaseSelect
          id="plan-order"
          v-model="planForm.order_id"
          :label="t('sales.order')"
          :options="orderOptions"
          :loading="optionsLoading"
          :error="
            fieldError('order_id') ||
            fieldError('installments') ||
            fieldError('order')
          "
          searchable
          required
        />
        <FormInput
          id="plan-count"
          v-model="planForm.installment_count"
          type="number"
          :label="t('sales.installmentCount')"
          :error="fieldError('installment_count')"
          required
        />
        <FormInput
          id="plan-initial"
          v-model="planForm.initial_paid_amount"
          type="number"
          :label="t('sales.initialPaidAmount')"
          :error="fieldError('initial_paid_amount')"
        />
        <DateInput
          id="plan-first-due"
          v-model="planForm.first_due_date"
          :label="t('sales.firstDueDate')"
          :error="fieldError('first_due_date')"
          required
        />
        <FormInput
          id="plan-interval"
          v-model="planForm.interval_months"
          type="number"
          :label="t('sales.intervalMonths')"
          :error="fieldError('interval_months')"
        />
        <BaseSelect
          id="plan-method"
          v-model="planForm.payment_method"
          :label="t('sales.paymentMethod')"
          :options="paymentMethodOptions"
          :error="fieldError('payment_method')"
          required
        />
      </div>
      <div v-else class="mt-5 grid gap-4 md:grid-cols-2">
        <BaseSelect
          id="installment-order"
          v-model="installmentForm.order_id"
          :label="t('sales.order')"
          :options="orderOptions"
          :loading="optionsLoading"
          :disabled="formMode !== 'create'"
          :error="fieldError('order_id') || fieldError('order')"
          searchable
          required
        />
        <FormInput
          id="installment-amount"
          v-model="installmentForm.amount"
          type="number"
          :label="t('sales.installmentAmount')"
          :readonly="formMode === 'pay'"
          :error="fieldError('amount') || fieldError('installment')"
          required
        />
        <DateInput
          v-if="formMode !== 'pay'"
          id="installment-due-date"
          v-model="installmentForm.due_date"
          :label="t('sales.dueDate')"
          :error="fieldError('due_date')"
        />
        <BaseSelect
          v-if="formMode !== 'pay'"
          id="installment-status"
          v-model="installmentForm.status"
          :label="t('table.status')"
          :options="formMode === 'edit' ? editableStatusOptions : statusOptions"
          :error="fieldError('status')"
          required
        />
        <BaseSelect
          id="installment-method"
          v-model="installmentForm.payment_method"
          :label="t('sales.paymentMethod')"
          :options="paymentMethodOptions"
          :error="fieldError('payment_method')"
          required
        />
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <BaseButton
          variant="secondary"
          type="button"
          :disabled="formLoading"
          @click="closeForm"
          >{{ t("actions.cancel") }}</BaseButton
        >
        <BaseButton type="submit" :loading="formLoading">{{
          formMode === "pay" ? t("sales.payInstallment") : t("actions.save")
        }}</BaseButton>
      </div>
    </form>
  </div>

  <ConfirmDialog
    :open="deleteTarget !== null"
    :title="t('sales.deleteInstallment')"
    :message="t('sales.deleteInstallmentMessage')"
    :confirm-label="t('actions.delete')"
    :loading="list.mutating.value"
    @close="deleteTarget = null"
    @confirm="confirmDelete"
  />
</template>
