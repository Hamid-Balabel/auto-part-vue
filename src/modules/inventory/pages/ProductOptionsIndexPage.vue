<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import ConfirmDialog from "@/components/modals/ConfirmDialog.vue";
import BaseBadge from "@/components/ui/BaseBadge.vue";
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
import RowActions from "@/components/ui/RowActions.vue";
import BaseSelect from "@/components/forms/BaseSelect.vue";
import { ApiError } from "@/api/http";
import { useCrudList } from "@/composables/useCrudList";
import { useResourcePermissions } from "@/composables/useResourcePermissions";
import { useToastStore } from "@/stores/toast";
import {
  deleteProductOption,
  getProductOption,
  listProductOptions,
  toggleProductOption,
} from "../api";
import type { ProductOption } from "../types";

const { t } = useI18n();
const toast = useToastStore();
const permissions = useResourcePermissions("product-option");
const selectedId = ref<number | null>(null);
const activeFilter = ref<string>("");
const valuesFilter = ref<string>("");
const detailsOpen = ref(false);
const detailsLoading = ref(false);
const detailsError = ref("");
const selectedOption = ref<ProductOption | null>(null);
const list = useCrudList<ProductOption>({
  list: (query) =>
    listProductOptions({
      ...query,
      ...(activeFilter.value !== "" ? { is_active: activeFilter.value } : {}),
      ...(valuesFilter.value !== "" ? { has_values: valuesFilter.value } : {}),
    }),
  defaultSortColumn: "id",
  defaultSortDirection: "desc",
});
const columns = computed<DataTableColumn<ProductOption>[]>(() => [
  { key: "id", label: t("table.id"), sortable: true },
  { key: "name", label: t("inventory.option"), sortable: true },
  { key: "values", label: t("inventory.optionValues") },
  { key: "is_active", label: t("table.status"), sortable: true },
  { key: "actions", label: t("table.actions"), align: "right" },
]);

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

async function openDetails(id: number) {
  detailsOpen.value = true;
  detailsLoading.value = true;
  detailsError.value = "";
  selectedOption.value = null;
  try {
    selectedOption.value = await getProductOption(id);
  } catch (error) {
    if (error instanceof ApiError) detailsError.value = error.message;
  } finally {
    detailsLoading.value = false;
  }
}

async function confirmDelete() {
  if (!selectedId.value) return;
  try {
    await list.mutate(async () => {
      await deleteProductOption(selectedId.value as number);
      toast.success(t("crud.deleted"));
    });
    selectedId.value = null;
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
    :title="t('inventory.productOptionsTitle')"
    :description="t('inventory.productOptionsDescription')"
  >
    <template #actions
      ><BaseButton
        v-if="permissions.canCreate.value"
        :to="{ name: 'product-options.create' }"
        >{{ t("inventory.addOption") }}</BaseButton
      ></template
    >
  </PageHeader>
  <CrudToolbar
    :search="list.search.value"
    :loading="list.loading.value"
    :search-placeholder="t('inventory.searchOptions')"
    @search="list.applySearch"
    @refresh="list.load"
  />
  <div class="panel mb-5 grid gap-3 p-4 sm:grid-cols-2">
    <BaseSelect
      id="option_active_filter"
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
      id="option_values_filter"
      v-model="valuesFilter"
      :label="t('inventory.optionValues')"
      :options="[
        { value: '', label: t('inventory.allOptions') },
        { value: 'true', label: t('inventory.withValues') },
        { value: 'false', label: t('inventory.withoutValues') },
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
    <template #cell-name="{ row }">{{ displayName(row) }}</template>
    <template #cell-values="{ row }">
      <div class="flex max-w-xl flex-wrap gap-1.5">
        <BaseBadge v-for="value in row.values?.slice(0, 6)" :key="value.id">{{
          displayName(value)
        }}</BaseBadge
        ><span
          v-if="(row.values?.length ?? 0) > 6"
          class="text-xs text-text-muted"
          >+{{ (row.values?.length ?? 0) - 6 }}</span
        ><span v-if="!row.values?.length">—</span>
      </div>
    </template>
    <template #cell-is_active="{ row }"
      ><ActiveStatusSwitch
        :row="row"
        :can-toggle="permissions.canToggle.value"
        :toggle="toggleProductOption"
        :data-testid="`product-option-status-${row.id}`"
    /></template>
    <template #cell-actions="{ row }"
      ><div class="inline-flex items-center justify-end gap-1.5">
        <CrudShowButton
          v-if="permissions.canView.value"
          @click="openDetails(row.id)"
        /><RowActions
          :can-edit="permissions.canUpdate.value"
          :can-delete="permissions.canDelete.value"
          :edit-to="{ name: 'product-options.edit', params: { id: row.id } }"
          @delete="selectedId = row.id"
        /></div
    ></template>
  </DataTable>
  <Pagination
    v-if="list.pageData.value"
    :meta="list.pageData.value"
    @change="list.changePage"
  />
  <ConfirmDialog
    :open="selectedId !== null"
    :title="t('inventory.deleteOption')"
    :message="t('inventory.deleteOptionMessage')"
    :confirm-label="t('actions.delete')"
    @close="selectedId = null"
    @confirm="confirmDelete"
  />
  <CrudDetailsModal
    :open="detailsOpen"
    :title="displayName(selectedOption)"
    :subtitle="t('inventory.optionDetails')"
    :loading="detailsLoading"
    :error-message="detailsError"
    @close="detailsOpen = false"
  >
    <div v-if="selectedOption" class="grid gap-4">
      <DetailsSection :title="t('details.mainInformation')"
        ><dl class="grid gap-3 md:grid-cols-2">
          <DetailsField
            :label="t('dataEntry.nameAr')"
            :value="selectedOption.translation_name?.ar"
          /><DetailsField
            :label="t('dataEntry.nameEn')"
            :value="selectedOption.translation_name?.en"
          /><DetailsField :label="t('table.status')"
            ><DetailsBadge :value="selectedOption.is_active"
          /></DetailsField></dl
      ></DetailsSection>
      <DetailsSection :title="t('inventory.optionValues')"
        ><div class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="value in selectedOption.values"
            :key="value.id"
            class="rounded-[var(--radius-lg)] border border-border p-3"
          >
            <p class="font-semibold text-text">{{ displayName(value) }}</p>
            <p class="text-xs text-text-muted">
              {{ value.translation_name?.ar }} /
              {{ value.translation_name?.en || "—" }}
            </p>
          </div>
          <p
            v-if="!selectedOption.values?.length"
            class="text-sm text-text-muted"
          >
            {{ t("inventory.noOptionValues") }}
          </p>
        </div></DetailsSection
      >
    </div>
  </CrudDetailsModal>
</template>
