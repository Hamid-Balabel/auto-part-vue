<script setup lang="ts">
import { RotateCcw, Trash2 } from "@lucide/vue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import ConfirmDialog from "@/components/modals/ConfirmDialog.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import CrudDetailsModal from "@/components/ui/CrudDetailsModal.vue";
import CrudShowButton from "@/components/ui/CrudShowButton.vue";
import CrudToolbar from "@/components/ui/CrudToolbar.vue";
import ActiveStatusSwitch from "@/components/ui/ActiveStatusSwitch.vue";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable.vue";
import DetailsBadge from "@/components/ui/DetailsBadge.vue";
import DetailsField from "@/components/ui/DetailsField.vue";
import DetailsSection from "@/components/ui/DetailsSection.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import Pagination from "@/components/ui/Pagination.vue";
import RelationshipCard from "@/components/ui/RelationshipCard.vue";
import RowActions from "@/components/ui/RowActions.vue";
import BaseSelect from "@/components/forms/BaseSelect.vue";
import { ApiError } from "@/api/http";
import { useCrudList } from "@/composables/useCrudList";
import { useResourcePermissions } from "@/composables/useResourcePermissions";
import { useToastStore } from "@/stores/toast";
import {
  deleteMerchant,
  forceDeleteMerchant,
  getMerchant,
  listMerchants,
  restoreMerchant,
  toggleMerchant,
} from "../api";
import type { Merchant } from "../types";

const { t, locale } = useI18n();
const toast = useToastStore();
const permissions = useResourcePermissions("merchant");
const selectedId = ref<number | null>(null);
const destructiveAction = ref<"delete" | "force" | null>(null);
const activeFilter = ref<string>("");
const itemsFilter = ref<string>("");
const trashedFilter = ref<string>("");
const detailsOpen = ref(false);
const detailsLoading = ref(false);
const detailsLoadingId = ref<number | null>(null);
const detailsError = ref("");
const selectedMerchant = ref<Merchant | null>(null);
let detailsRequestId = 0;
const list = useCrudList<Merchant>({
  list: (query) =>
    listMerchants({
      ...query,
      ...(activeFilter.value !== "" ? { is_active: activeFilter.value } : {}),
      ...(itemsFilter.value !== ""
        ? { has_product_items: itemsFilter.value }
        : {}),
      ...(trashedFilter.value
        ? { trashed: trashedFilter.value as "with" | "only" }
        : {}),
    }),
  defaultSortColumn: "id",
  defaultSortDirection: "desc",
});
const viewingTrashed = computed(() => trashedFilter.value === "only");

const columns = computed<DataTableColumn<Merchant>[]>(() => [
  { key: "id", label: t("table.id"), sortable: true },
  { key: "name", label: t("table.name"), sortable: true },
  { key: "email", label: t("admin.email"), sortable: true },
  { key: "phone", label: t("admin.phone"), sortable: true },
  { key: "is_active", label: t("table.status"), sortable: true },
  { key: "actions", label: t("table.actions"), align: "right" },
]);

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

async function openDetails(id: number) {
  if (detailsLoading.value) return;
  detailsOpen.value = true;
  detailsLoading.value = true;
  detailsLoadingId.value = id;
  detailsError.value = "";
  selectedMerchant.value = null;
  const requestId = ++detailsRequestId;
  try {
    const merchant = await getMerchant(id);
    if (requestId === detailsRequestId && detailsOpen.value)
      selectedMerchant.value = merchant;
  } catch (error) {
    if (requestId === detailsRequestId && error instanceof ApiError)
      detailsError.value = error.message || t("details.failedToLoad");
  } finally {
    if (requestId === detailsRequestId) {
      detailsLoading.value = false;
      detailsLoadingId.value = null;
    }
  }
}

function closeDetails() {
  detailsRequestId += 1;
  detailsOpen.value = false;
  detailsLoading.value = false;
  detailsLoadingId.value = null;
  detailsError.value = "";
  selectedMerchant.value = null;
}

async function confirmDelete() {
  if (!selectedId.value) return;
  try {
    await list.mutate(async () => {
      if (destructiveAction.value === "force")
        await forceDeleteMerchant(selectedId.value as number);
      else await deleteMerchant(selectedId.value as number);
      toast.success(t("crud.deleted"));
    });
    selectedId.value = null;
    destructiveAction.value = null;
  } catch (error) {
    if (error instanceof ApiError) toast.error(error.message);
  }
}

async function restore(id: number) {
  try {
    await list.mutate(async () => {
      await restoreMerchant(id);
      toast.success(t("inventory.merchantRestored"));
    });
  } catch (error) {
    if (error instanceof ApiError) toast.error(error.message);
  }
}

function applyFilters() {
  list.page.value = 1;
  void list.load();
}

onMounted(list.load);
</script>

<template>
  <PageHeader
    :title="t('inventory.merchantsTitle')"
    :description="t('inventory.merchantsDescription')"
  >
    <template #actions>
      <BaseButton
        v-if="permissions.canCreate.value"
        :to="{ name: 'merchants.create' }"
        >{{ t("inventory.addMerchant") }}</BaseButton
      >
    </template>
  </PageHeader>

  <CrudToolbar
    :search="list.search.value"
    :loading="list.loading.value"
    :search-placeholder="t('inventory.searchMerchants')"
    @search="list.applySearch"
    @refresh="list.load"
  />

  <div class="panel mb-5 grid gap-3 p-4 sm:grid-cols-3">
    <BaseSelect
      id="merchant_active_filter"
      v-model="activeFilter"
      :label="t('table.status')"
      :options="[
        { value: '', label: t('inventory.allStatuses') },
        { value: 'true', label: t('dataEntry.active') },
        { value: 'false', label: t('dataEntry.inactive') },
      ]"
      @update:model-value="applyFilters"
    />
    <BaseSelect
      id="merchant_items_filter"
      v-model="itemsFilter"
      :label="t('inventory.productItemRelation')"
      :options="[
        { value: '', label: t('inventory.allMerchants') },
        { value: 'true', label: t('inventory.withProductItems') },
        { value: 'false', label: t('inventory.withoutProductItems') },
      ]"
      @update:model-value="applyFilters"
    />
    <BaseSelect
      id="merchant_trashed_filter"
      v-model="trashedFilter"
      :label="t('inventory.recordScope')"
      :options="[
        { value: '', label: t('inventory.activeRecords') },
        { value: 'with', label: t('inventory.withDeletedRecords') },
        { value: 'only', label: t('inventory.deletedRecords') },
      ]"
      @update:model-value="applyFilters"
    />
  </div>

  <DataTable
    :columns="columns"
    :rows="list.rows.value"
    :loading="list.loading.value"
    :sort-column="list.sortColumn.value"
    :sort-direction="list.sortDirection.value"
    @sort="list.sortBy"
  >
    <template #cell-email="{ value }">{{ value || "—" }}</template>
    <template #cell-phone="{ value }">{{ value || "—" }}</template>
    <template #cell-is_active="{ row }">
      <ActiveStatusSwitch
        :row="row"
        :can-toggle="permissions.canToggle.value && !viewingTrashed"
        :toggle="toggleMerchant"
        :data-testid="`merchant-status-${row.id}`"
      />
    </template>
    <template #cell-actions="{ row }">
      <div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton
          v-if="permissions.canView.value && !viewingTrashed"
          :loading="detailsLoadingId === row.id"
          :disabled="detailsLoading"
          @click="openDetails(row.id)"
        />
        <RowActions
          v-if="!viewingTrashed"
          :can-edit="permissions.canUpdate.value"
          :can-delete="permissions.canDelete.value"
          :edit-to="{ name: 'merchants.edit', params: { id: row.id } }"
          :delete-disabled="list.mutating.value"
          @delete="
            selectedId = row.id;
            destructiveAction = 'delete';
          "
        />
        <BaseButton
          v-if="viewingTrashed && permissions.canRestore.value"
          variant="ghost"
          size="sm"
          type="button"
          :aria-label="t('actions.restore')"
          :title="t('actions.restore')"
          @click="restore(row.id)"
          ><RotateCcw class="size-4"
        /></BaseButton>
        <BaseButton
          v-if="viewingTrashed && permissions.canForceDelete.value"
          variant="danger"
          size="sm"
          type="button"
          :aria-label="t('inventory.forceDelete')"
          :title="t('inventory.forceDelete')"
          @click="
            selectedId = row.id;
            destructiveAction = 'force';
          "
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

  <ConfirmDialog
    :open="selectedId !== null"
    :title="
      t(
        destructiveAction === 'force'
          ? 'inventory.forceDeleteMerchant'
          : 'inventory.deleteMerchant',
      )
    "
    :message="
      t(
        destructiveAction === 'force'
          ? 'inventory.forceDeleteMerchantMessage'
          : 'inventory.deleteMerchantMessage',
      )
    "
    :confirm-label="t('actions.delete')"
    @close="
      selectedId = null;
      destructiveAction = null;
    "
    @confirm="confirmDelete"
  />

  <CrudDetailsModal
    :open="detailsOpen"
    :title="selectedMerchant?.name ?? t('details.merchantDetails')"
    :subtitle="t('details.details')"
    :loading="detailsLoading"
    :error-message="detailsError"
    @close="closeDetails"
  >
    <div v-if="selectedMerchant" class="grid gap-4">
      <DetailsSection :title="t('details.mainInformation')">
        <dl class="grid gap-3 md:grid-cols-2">
          <DetailsField
            :label="t('table.name')"
            :value="selectedMerchant.name"
          />
          <DetailsField
            :label="t('admin.email')"
            :value="selectedMerchant.email"
          />
          <DetailsField
            :label="t('admin.phone')"
            :value="selectedMerchant.phone"
          />
          <DetailsField :label="t('table.status')"
            ><DetailsBadge :value="selectedMerchant.is_active"
          /></DetailsField>
          <DetailsField
            :label="t('table.createdAt')"
            :value="formatDate(selectedMerchant.created_at)"
          />
          <DetailsField
            :label="t('table.updatedAt')"
            :value="formatDate(selectedMerchant.updated_at)"
          />
        </dl>
      </DetailsSection>
      <DetailsSection :title="t('details.creator')">
        <RelationshipCard
          :title="selectedMerchant.creator?.name ?? t('details.noRelatedData')"
          :subtitle="selectedMerchant.creator?.email"
        >
          <template #badge
            ><DetailsBadge :value="selectedMerchant.creator?.is_active"
          /></template>
        </RelationshipCard>
      </DetailsSection>
    </div>
  </CrudDetailsModal>
</template>
