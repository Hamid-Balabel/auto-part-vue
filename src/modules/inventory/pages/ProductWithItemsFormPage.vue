<script setup lang="ts">
import { Plus, Trash2 } from "@lucide/vue";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import FileUpload from "@/components/forms/FileUpload.vue";
import FormInput from "@/components/forms/FormInput.vue";
import SearchableSelectInput, {
  type SearchableSelectOption,
} from "@/components/forms/SearchableSelectInput.vue";
import BooleanField from "@/components/forms/BooleanField.vue";
import TranslatableFields from "@/components/forms/TranslatableFields.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import DetailsSection from "@/components/ui/DetailsSection.vue";
import FormPageLayout from "@/components/ui/FormPageLayout.vue";
import { ApiError } from "@/api/http";
import { listResource } from "@/modules/data-entry/api";
import { useToastStore } from "@/stores/toast";
import { usePermissions } from "@/composables/usePermissions";
import {
  createProductWithItems,
  listMerchants,
  listOptionValues,
  listProductOptions,
  listWarehouses,
} from "../api";
import type {
  Brand,
  Category,
  Merchant,
  ProductOption,
  ProductOptionValue,
  ProductWithItemsPayload,
  Warehouse,
} from "../types";
import MerchantSelectField from "../components/MerchantSelectField.vue";
import ProductItemOptionsField from "../components/ProductItemOptionsField.vue";

const router = useRouter();
const { t } = useI18n();
const toast = useToastStore();
const { can } = usePermissions();
const optionsLoading = ref(false);
const saving = ref(false);
const errors = ref<Record<string, string[]>>({});
const errorMessage = ref("");
const categories = ref<Category[]>([]);
const brands = ref<Brand[]>([]);
const productOptions = ref<ProductOption[]>([]);
const optionValues = ref<ProductOptionValue[]>([]);
const warehouses = ref<Warehouse[]>([]);
const merchants = ref<Merchant[]>([]);

function createEmptyItem(): ProductWithItemsPayload["items"][number] {
  return {
    price: 0,
    merchant_id: null,
    option_value_ids: [],
    stocks: warehouses.value.map((warehouse) => ({
      warehouse_id: warehouse.id,
      quantity: 0,
    })),
    images: [],
  };
}

const form = reactive<ProductWithItemsPayload>({
  name: { ar: "", en: "" },
  description: { ar: "", en: "" },
  category_id: null,
  brand_id: null,
  is_active: true,
  items: [createEmptyItem()],
});

const categoryOptions = computed<SearchableSelectOption<number>[]>(() =>
  categories.value.map((category) => ({
    label: displayName(category),
    value: category.id,
    searchText: [
      category.name,
      category.translation_name?.ar,
      category.translation_name?.en,
    ]
      .filter(Boolean)
      .join(" "),
  })),
);

const brandOptions = computed<SearchableSelectOption<number>[]>(() =>
  brands.value.map((brand) => ({
    label: displayName(brand),
    value: brand.id,
    searchText: [
      brand.name,
      brand.translation_name?.ar,
      brand.translation_name?.en,
    ]
      .filter(Boolean)
      .join(" "),
  })),
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

function normalizeList<T>(response: T[] | { data: T[] }): T[] {
  return Array.isArray(response) ? response : response.data;
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const canListMerchants =
      can("read-merchant") && can(["view-all-merchant", "view-own-merchant"]);
    const [
      categoryResponse,
      brandResponse,
      productOptionResponse,
      optionResponse,
      warehouseResponse,
      merchantResponse,
    ] = await Promise.all([
      listResource("categories", { per_page: -1 }),
      listResource("brands", { per_page: -1 }),
      listProductOptions({ per_page: -1 }),
      listOptionValues({ per_page: -1 }),
      listWarehouses({ per_page: -1 }),
      canListMerchants ? listMerchants({ per_page: -1 }) : Promise.resolve([]),
    ]);
    categories.value = normalizeList(categoryResponse);
    brands.value = normalizeList(brandResponse);
    productOptions.value = normalizeList(productOptionResponse);
    optionValues.value = normalizeList(optionResponse);
    warehouses.value = normalizeList(warehouseResponse);
    merchants.value = normalizeList(merchantResponse);
    form.items.forEach((item) => {
      item.stocks = warehouses.value.map((warehouse) => ({
        warehouse_id: warehouse.id,
        quantity: 0,
      }));
    });
  } finally {
    optionsLoading.value = false;
  }
}

function addItem() {
  form.items.push(createEmptyItem());
}

function removeItem(index: number) {
  if (form.items.length > 1) form.items.splice(index, 1);
}

function addMerchant(merchant: Merchant) {
  if (!merchants.value.some((item) => item.id === merchant.id))
    merchants.value.push(merchant);
  toast.success(t("inventory.merchantCreatedSelected"));
}

function addProductOption(option: ProductOption) {
  if (!productOptions.value.some((item) => item.id === option.id))
    productOptions.value.push(option);
  for (const value of option.values ?? [])
    if (!optionValues.value.some((item) => item.id === value.id))
      optionValues.value.push({
        ...value,
        product_option_id: option.id,
        product_option: option,
      });
  toast.success(t("inventory.optionCreatedSelected"));
}

function addOptionValue(value: ProductOptionValue) {
  if (!optionValues.value.some((item) => item.id === value.id))
    optionValues.value.push(value);
  const option = productOptions.value.find(
    (item) => item.id === value.product_option_id,
  );
  if (option) option.values = [...(option.values ?? []), value];
  toast.success(t("inventory.valueCreatedSelected"));
}

async function submit() {
  saving.value = true;
  errors.value = {};
  errorMessage.value = "";
  try {
    await createProductWithItems(form);
    toast.success(t("crud.saved"));
    await router.push({ name: "products.index" });
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {};
      errorMessage.value = error.message;
    }
  } finally {
    saving.value = false;
  }
}

onMounted(loadOptions);
</script>

<template>
  <FormPageLayout
    :title="t('inventory.createProductWithItemsTitle')"
    :description="t('inventory.productWithItemsDescription')"
    :error-message="errorMessage"
    :loading-text="optionsLoading ? t('common.loading') : ''"
    @submit="submit"
  >
    <div class="grid gap-5">
      <DetailsSection :title="t('inventory.productInformation')">
        <div class="grid gap-4 md:grid-cols-2">
          <TranslatableFields
            id="bulk_product_name"
            v-model="form.name"
            :label-ar="t('dataEntry.nameAr')"
            :label-en="t('dataEntry.nameEn')"
            :error-ar="errors['name.ar']?.[0]"
            :error-en="errors['name.en']?.[0]"
            required-ar
          />
          <TranslatableFields
            id="bulk_product_description"
            v-model="form.description"
            :label-ar="t('dataEntry.descriptionAr')"
            :label-en="t('dataEntry.descriptionEn')"
            :error-ar="errors['description.ar']?.[0]"
            :error-en="errors['description.en']?.[0]"
          />
          <SearchableSelectInput
            id="bulk_product_category"
            v-model="form.category_id"
            :label="t('table.category')"
            :options="categoryOptions"
            :placeholder="t('common.select')"
            :search-placeholder="t('crud.searchPlaceholder')"
            :empty-text="t('states.emptyTitle')"
            :loading="optionsLoading"
            :error="errors.category_id?.[0]"
            required
          />
          <SearchableSelectInput
            id="bulk_product_brand"
            v-model="form.brand_id"
            :label="t('table.brand')"
            :options="brandOptions"
            :placeholder="t('common.select')"
            :search-placeholder="t('crud.searchPlaceholder')"
            :empty-text="t('states.emptyTitle')"
            :loading="optionsLoading"
            :error="errors.brand_id?.[0]"
            required
          />
          <BooleanField
            id="bulk_product_status"
            v-model="form.is_active"
            class="md:col-span-2"
            :label="t('dataEntry.status')"
            :on-label="t('dataEntry.active')"
            :off-label="t('dataEntry.inactive')"
            :error="errors.is_active?.[0]"
            data-testid="bulk-product-active-field"
          />
        </div>
      </DetailsSection>

      <section class="grid gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-text">
              {{ t("inventory.itemsInformation") }}
            </h2>
            <p class="text-sm text-text-muted">
              {{ t("inventory.productItemsDescription") }}
            </p>
          </div>
          <BaseButton variant="secondary" type="button" @click="addItem">
            <Plus class="size-4" />
            {{ t("inventory.addAnotherItem") }}
          </BaseButton>
        </div>

        <article
          v-for="(item, itemIndex) in form.items"
          :key="itemIndex"
          class="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-sm"
        >
          <header
            class="flex items-center justify-between gap-3 border-b border-border bg-background/70 px-4 py-3 sm:px-5"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex size-8 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary"
                >{{ itemIndex + 1 }}</span
              >
              <h3 class="font-bold text-text">
                {{ t("inventory.itemNumber", { number: itemIndex + 1 }) }}
              </h3>
            </div>
            <BaseButton
              v-if="form.items.length > 1"
              variant="ghost"
              size="sm"
              type="button"
              :aria-label="t('inventory.removeProductItem')"
              :title="t('inventory.removeProductItem')"
              @click="removeItem(itemIndex)"
            >
              <Trash2 class="size-4 text-danger" />
            </BaseButton>
          </header>

          <div class="grid gap-5 p-4 sm:p-5">
            <div
              class="rounded-[var(--radius-lg)] border border-primary/20 bg-primary-soft p-3 text-sm text-primary"
            >
              {{ t("inventory.skuGeneratedAutomatically") }}
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <FormInput
                :id="`bulk_item_${itemIndex}_price`"
                v-model="item.price"
                :label="t('table.price')"
                type="number"
                :error="errors[`items.${itemIndex}.price`]?.[0]"
                required
              />
              <MerchantSelectField
                :id="`bulk_item_${itemIndex}_merchant`"
                v-model="item.merchant_id"
                :merchants="merchants"
                :loading="optionsLoading"
                :error="errors[`items.${itemIndex}.merchant_id`]?.[0]"
                :can-create="can('create-merchant')"
                @created="addMerchant"
              />
            </div>

            <ProductItemOptionsField
              :id="`bulk_item_${itemIndex}_options`"
              v-model="item.option_value_ids"
              :options="productOptions"
              :values="optionValues"
              :can-create-option="can('create-product-option')"
              :can-create-value="can('create-product-option-value')"
              :error="errors[`items.${itemIndex}.option_value_ids`]?.[0]"
              @option-created="addProductOption"
              @value-created="addOptionValue"
            />

            <div v-if="item.stocks.length" class="grid gap-3">
              <span class="form-label">{{
                t("inventory.warehouseQuantities")
              }}</span>
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FormInput
                  v-for="(stock, stockIndex) in item.stocks"
                  :id="`bulk_item_${itemIndex}_stock_${stock.warehouse_id}`"
                  :key="stock.warehouse_id"
                  v-model="stock.quantity"
                  :label="
                    displayName(
                      warehouses.find(
                        (warehouse) =>
                          warehouse.id === Number(stock.warehouse_id),
                      ),
                    )
                  "
                  type="number"
                  :error="
                    errors[
                      `items.${itemIndex}.stocks.${stockIndex}.quantity`
                    ]?.[0]
                  "
                />
              </div>
            </div>

            <FileUpload
              :id="`bulk_item_${itemIndex}_images`"
              :label="t('inventory.images')"
              accept="image/jpeg,image/png,image/webp"
              multiple
              :error="errors[`items.${itemIndex}.images.0`]?.[0]"
              @change="item.images = $event"
            />
          </div>
        </article>
      </section>
    </div>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'products.index' }">{{
        t("actions.cancel")
      }}</BaseButton>
      <BaseButton type="submit" :loading="saving">{{
        saving ? t("actions.saving") : t("actions.save")
      }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
