<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
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
  listOptionValues,
  listProductOptions,
  listProducts,
  updateProductItem,
} from "../api";
import type {
  Product,
  ProductItem,
  ProductItemPayload,
  ProductItemImage,
  ProductOption,
  ProductOptionValue,
} from "../types";
import { normalizeBoolean } from "@/utils/boolean";
import AddStockDialog from "../components/AddStockDialog.vue";
import ProductItemOptionsField from "../components/ProductItemOptionsField.vue";

const props = defineProps<{ id?: string }>();
const router = useRouter();
const route = useRoute();
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
const currentItem = ref<ProductItem | null>(null);
const addStockOpen = ref(false);
const isAutoOpenFlow = ref(false);
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
  movement_code: '',
  is_active: true,
  option_value_ids: [],
  price: 0,
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
    const [
      productResponse,
      productOptionResponse,
      optionResponse,
    ] = await Promise.all([
      listProducts({ per_page: -1 }),
      listProductOptions({ per_page: -1 }),
      listOptionValues({ per_page: -1 }),
    ]);
    products.value = normalizeList(productResponse);
    productOptionTypes.value = normalizeList(productOptionResponse);
    optionValues.value = normalizeList(optionResponse);
  } finally {
    optionsLoading.value = false;
  }
}

async function loadRecord() {
  if (!props.id) return;
  loading.value = true;
  try {
    const item = await getProductItem(props.id);
    currentItem.value = item;
    generatedSku.value = item.sku ?? "";
    existingImages.value = item.images ?? [];
    form.product_id = item.product_id ?? item.product?.id ?? null;
    form.movement_code = item.movement_code ?? "";
    form.is_active = normalizeBoolean(item.is_active, true);
    form.price = item.current_price ?? 0;
    form.max_discount = item.max_discount ?? '';
    form.option_value_ids =
      (item.option_values ?? item.optionValues)?.map((value) => value.id) ?? [];
  } finally {
    loading.value = false;
  }
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

function onAddStockClose() {
  if (isAutoOpenFlow.value) {
    isAutoOpenFlow.value = false;
    void router.push({ name: "product-items.index" });
  } else {
    addStockOpen.value = false;
  }
}

function onAddStockSuccess() {
  if (isAutoOpenFlow.value) {
    isAutoOpenFlow.value = false;
    void router.push({ name: "product-items.index" });
  } else {
    addStockOpen.value = false;
    void loadRecord();
  }
}

async function submit() {
  saving.value = true;
  errors.value = {};
  errorMessage.value = "";
  try {
    const payload: ProductItemPayload = { ...form, images: images.value };
    let saved: ProductItem | undefined;
    if (props.id) saved = await updateProductItem(props.id, payload);
    else saved = await createProductItem(payload);
    toast.success(t("crud.saved"));
    if (props.id) currentItem.value = saved ?? currentItem.value;
    if (props.id) await router.push({ name: "product-items.index" });
    else await router.push({ name: "product-items.edit", params: { id: saved?.id }, query: { add_stock: "1" } });
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
  if (props.id && route.query.add_stock === "1" && can("create-stock")) {
    isAutoOpenFlow.value = true;
    addStockOpen.value = true;
  }
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
      <FormInput
        id="item_movement_code"
        v-model="form.movement_code"
        :label="t('table.movementCode')"
        required
        :error="errors.movement_code?.[0]"
      />
      <FormInput
        id="item_price"
        v-model="form.price"
        :label="t('table.price')"
        type="number"
        min="0.01"
        step="0.01"
        required
        :error="errors.price?.[0]"
      />
      <FormInput
        id="item_max_discount"
        v-model="form.max_discount"
        :label="t('inventory.maxDiscountEgp')"
        type="number"
        min="0"
        step="0.01"
        :help="
          currentItem
            ? t('inventory.maxDiscountHelpWithEffective', {
                effective: currentItem.effective_max_discount ?? '0.00',
              })
            : t('inventory.maxDiscountHelp')
        "
        :error="errors.max_discount?.[0]"
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
      <div v-if="isEdit && can('create-stock')" class="md:col-span-2 rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-text-muted">{{ t('inventory.addStockAfterItemSaved') }}</p>
          <BaseButton type="button" variant="secondary" @click="addStockOpen = true">{{ t('inventory.addStock') }}</BaseButton>
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
  <AddStockDialog :open="addStockOpen" :product-item="currentItem" :product-item-id="props.id ? Number(props.id) : null" @close="onAddStockClose" @success="onAddStockSuccess" />
</template>
