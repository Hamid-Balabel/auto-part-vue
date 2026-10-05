<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import FileUpload from "@/components/forms/FileUpload.vue";
import FormInput from "@/components/forms/FormInput.vue";
import SearchableSelectInput, {
  type SearchableSelectOption,
} from "@/components/forms/SearchableSelectInput.vue";
import BooleanField from "@/components/forms/BooleanField.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import FormPageLayout from "@/components/ui/FormPageLayout.vue";
import ConfirmDialog from "@/components/modals/ConfirmDialog.vue";
import { ApiError } from "@/api/http";
import { useResourcePermissions } from "@/composables/useResourcePermissions";
import { usePermissions } from "@/composables/usePermissions";
import { useLocalizedName } from "@/composables/useLocalizedName";
import { useToastStore } from "@/stores/toast";
import {
  createProductItem,
  deleteProductItemImage,
  getProductItem,
  listMerchants,
  listOptionValues,
  listProductOptions,
  listProducts,
  listWarehouses,
  updateProductItem,
} from "../api";
import type {
  Merchant,
  Product,
  ProductItemPayload,
  ProductItemImage,
  ProductOption,
  ProductOptionValue,
  Warehouse,
} from "../types";
import { normalizeBoolean } from "@/utils/boolean";
import MerchantSelectField from "../components/MerchantSelectField.vue";
import ProductItemOptionsField from "../components/ProductItemOptionsField.vue";

const props = defineProps<{ id?: string }>();
const router = useRouter();
const { t } = useI18n();
const localizedName = useLocalizedName();
const toast = useToastStore();
const permissions = useResourcePermissions("product-item");
const { can } = usePermissions();
const loading = ref(false);
const optionsLoading = ref(false);
const saving = ref(false);
const errors = ref<Record<string, string[]>>({});
const errorMessage = ref("");
const products = ref<Product[]>([]);
const productOptionTypes = ref<ProductOption[]>([]);
const optionValues = ref<ProductOptionValue[]>([]);
const warehouses = ref<Warehouse[]>([]);
const merchants = ref<Merchant[]>([]);
const images = ref<File[]>([]);
const existingImages = ref<ProductItemImage[]>([]);
const imageToDelete = ref<ProductItemImage | null>(null);
const deletingImage = ref(false);
const generatedSku = ref("");
const isEdit = computed(() => Boolean(props.id));
const canSave = computed(() =>
  props.id ? permissions.canUpdate.value : permissions.canCreate.value,
);
const displayedImages = computed(() => [
  ...existingImages.value.map((image) => ({
    key: `existing:${image.id}`,
    name: image.name?.trim() || `#${image.id}`,
  })),
  ...images.value.map((file, index) => ({
    key: `new:${index}`,
    name: file.name,
  })),
]);
const form = reactive<ProductItemPayload>({
  product_id: null,
  merchant_id: null,
  is_active: true,
  option_value_ids: [],
  price: 0,
  stocks: [],
  images: [],
});

const productOptions = computed<SearchableSelectOption<number>[]>(() =>
  products.value.map((product) => ({
    label: localizedName(product, `#${product.id}`),
    value: product.id,
    searchText: [
      product.name,
      product.translation_name?.ar,
      product.translation_name?.en,
    ]
      .filter(Boolean)
      .join(" "),
  })),
);

function normalizeList<T>(response: T[] | { data: T[] }): T[] {
  return Array.isArray(response) ? response : response.data;
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const canListMerchants =
      can("read-merchant") && can(["view-all-merchant", "view-own-merchant"]);
    const [
      productResponse,
      productOptionResponse,
      optionResponse,
      warehouseResponse,
      merchantResponse,
    ] = await Promise.all([
      listProducts({ per_page: -1 }),
      listProductOptions({ per_page: -1 }),
      listOptionValues({ per_page: -1 }),
      listWarehouses({ per_page: -1 }),
      canListMerchants ? listMerchants({ per_page: -1 }) : Promise.resolve([]),
    ]);
    products.value = normalizeList(productResponse);
    productOptionTypes.value = normalizeList(productOptionResponse);
    optionValues.value = normalizeList(optionResponse);
    warehouses.value = normalizeList(warehouseResponse);
    merchants.value = normalizeList(merchantResponse);
    if (!form.stocks?.length)
      form.stocks = warehouses.value.map((warehouse) => ({
        warehouse_id: warehouse.id,
        quantity: 0,
      }));
  } finally {
    optionsLoading.value = false;
  }
}

async function loadRecord() {
  if (!props.id) return;
  loading.value = true;
  try {
    const item = await getProductItem(props.id);
    generatedSku.value = item.sku ?? "";
    existingImages.value = item.images ?? [];
    if (
      item.merchant &&
      !merchants.value.some((merchant) => merchant.id === item.merchant?.id)
    )
      merchants.value.unshift(item.merchant);
    form.product_id = item.product_id ?? item.product?.id ?? null;
    form.merchant_id = item.merchant_id ?? item.merchant?.id ?? null;
    form.is_active = normalizeBoolean(item.is_active, true);
    form.price = item.current_price ?? 0;
    form.option_value_ids =
      (item.option_values ?? item.optionValues)?.map((value) => value.id) ?? [];
    const quantities = new Map(
      item.stocks?.map((stock) => [stock.warehouse_id, stock.quantity]) ?? [],
    );
    form.stocks = warehouses.value.map((warehouse) => ({
      warehouse_id: warehouse.id,
      quantity: quantities.get(warehouse.id) ?? 0,
    }));
  } finally {
    loading.value = false;
  }
}

function addMerchant(merchant: Merchant) {
  if (!merchants.value.some((item) => item.id === merchant.id))
    merchants.value.push(merchant);
  toast.success(t("inventory.merchantCreatedSelected"));
}

function addProductOption(option: ProductOption) {
  if (!productOptionTypes.value.some((item) => item.id === option.id))
    productOptionTypes.value.push(option);
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
  const option = productOptionTypes.value.find(
    (item) => item.id === value.product_option_id,
  );
  if (option) option.values = [...(option.values ?? []), value];
  toast.success(t("inventory.valueCreatedSelected"));
}

function setImages(files: File[]) {
  images.value = [...images.value, ...files];
  form.images = images.value;
}

function removeImage(key: string) {
  if (key.startsWith("new:")) {
    images.value.splice(Number(key.slice(4)), 1);
    form.images = images.value;
    return;
  }

  const image = existingImages.value.find((item) => item.id === Number(key.slice(9)));
  if (image) imageToDelete.value = image;
}

async function confirmDeleteImage() {
  const image = imageToDelete.value;
  if (!image || deletingImage.value) return;
  deletingImage.value = true;
  errorMessage.value = "";
  try {
    await deleteProductItemImage(image.id);
    existingImages.value = existingImages.value.filter((item) => item.id !== image.id);
    imageToDelete.value = null;
    toast.success(t("inventory.imageDeleted"));
  } catch (error) {
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t("inventory.imageDeleteFailed");
    toast.error(errorMessage.value);
  } finally {
    deletingImage.value = false;
  }
}

async function submit() {
  saving.value = true;
  errors.value = {};
  errorMessage.value = "";
  try {
    const payload = { ...form, images: images.value };
    if (props.id) await updateProductItem(props.id, payload);
    else await createProductItem(payload);
    toast.success(t("crud.saved"));
    await router.push({ name: "product-items.index" });
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {};
      errorMessage.value = error.message;
    }
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadOptions();
  await loadRecord();
});
</script>

<template>
  <FormPageLayout
    :title="
      t(isEdit ? 'inventory.editProductItem' : 'inventory.createProductItem')
    "
    :description="t('inventory.productItemFormDescription')"
    :error-message="errorMessage"
    :loading-text="loading ? t('inventory.loadingProductItem') : ''"
    @submit="submit"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <div
        v-if="generatedSku"
        class="rounded-[var(--radius-lg)] border border-border bg-background p-3"
      >
        <span class="block text-xs font-semibold text-text-muted">{{
          t("table.sku")
        }}</span>
        <span class="mt-1 block font-mono font-bold text-text">{{
          generatedSku
        }}</span>
      </div>
      <div
        v-else
        class="rounded-[var(--radius-lg)] border border-primary/20 bg-primary-soft p-3 text-sm text-primary md:col-span-2"
      >
        {{ t("inventory.skuGeneratedAutomatically") }}
      </div>
      <SearchableSelectInput
        id="item_product"
        v-model="form.product_id"
        :label="t('table.product')"
        :options="productOptions"
        :placeholder="t('common.select')"
        :empty-text="t('states.emptyTitle')"
        :loading="optionsLoading"
        :error="errors.product_id?.[0]"
        required
      />
      <MerchantSelectField
        id="item_merchant"
        v-model="form.merchant_id"
        :merchants="merchants"
        :loading="optionsLoading"
        :error="errors.merchant_id?.[0]"
        :can-create="can('create-merchant')"
        @created="addMerchant"
      />
      <FormInput
        id="item_price"
        v-model="form.price"
        :label="t('table.price')"
        type="number"
        required
        :error="errors.price?.[0]"
      />
      <BooleanField
        id="item_status"
        v-model="form.is_active"
        class="md:col-span-2"
        :label="t('dataEntry.status')"
        :on-label="t('dataEntry.active')"
        :off-label="t('dataEntry.inactive')"
        :error="errors.is_active?.[0]"
        data-testid="product-item-active-field"
      />
      <ProductItemOptionsField
        id="item_options"
        v-model="form.option_value_ids!"
        class="md:col-span-2"
        :options="productOptionTypes"
        :values="optionValues"
        :can-create-option="can('create-product-option')"
        :can-create-value="can('create-product-option-value')"
        :error="errors.option_value_ids?.[0]"
        @option-created="addProductOption"
        @value-created="addOptionValue"
      />
      <div class="md:col-span-2">
        <span class="form-label">{{ t("inventory.warehouseQuantities") }}</span>
        <div class="mt-2 grid gap-3 md:grid-cols-2">
          <FormInput
            v-for="(stock, index) in form.stocks"
            :id="`stock_${stock.warehouse_id}`"
            :key="stock.warehouse_id"
            v-model="stock.quantity"
            :label="
              localizedName(warehouses.find(
                (warehouse) => warehouse.id === Number(stock.warehouse_id),
              ), `#${stock.warehouse_id}`)
            "
            type="number"
            :error="errors[`stocks.${index}.quantity`]?.[0]"
          />
        </div>
      </div>
      <FileUpload
        id="item_images"
        class="md:col-span-2"
        :label="t('inventory.images')"
        accept="image/jpeg,image/png,image/webp"
        multiple
        :managed-files="displayedImages"
        :disabled="saving || deletingImage"
        :error="errors['images.0']?.[0]"
        @change="setImages"
        @remove="removeImage"
      />
    </div>
    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'product-items.index' }">{{
        t("actions.cancel")
      }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving" :disabled="deletingImage">{{
        saving ? t("actions.saving") : t("actions.save")
      }}</BaseButton>
    </template>
  </FormPageLayout>
  <ConfirmDialog
    :open="imageToDelete !== null"
    :title="t('inventory.deleteImageTitle')"
    :message="t('inventory.deleteImageMessage', { name: imageToDelete?.name || `#${imageToDelete?.id}` })"
    :confirm-label="t('actions.delete')"
    :loading="deletingImage"
    @close="imageToDelete = null"
    @confirm="confirmDeleteImage"
  />
</template>
