<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FileUpload from '@/components/forms/FileUpload.vue'
import FormInput from '@/components/forms/FormInput.vue'
import SearchableSelectInput, { type SearchableSelectOption } from '@/components/forms/SearchableSelectInput.vue'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import BooleanField from '@/components/forms/BooleanField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { createProductItem, getProductItem, listOptionValues, listProductOptions, listProducts, listWarehouses, updateProductItem } from '../api'
import type { Product, ProductItemPayload, ProductOption, ProductOptionValue, Warehouse } from '../types'
import { normalizeBoolean } from '@/utils/boolean'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const { t } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('product-item')
const loading = ref(false)
const optionsLoading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const products = ref<Product[]>([])
const productOptionTypes = ref<ProductOption[]>([])
const optionValues = ref<ProductOptionValue[]>([])
const warehouses = ref<Warehouse[]>([])
const images = ref<File[]>([])
const isEdit = computed(() => Boolean(props.id))
const canSave = computed(() => props.id ? permissions.canUpdate.value : permissions.canCreate.value)
const form = reactive<ProductItemPayload>({
  sku: '',
  barcode: '',
  product_id: null,
  is_active: true,
  option_value_ids: [],
  price: 0,
  stocks: [],
  images: [],
})

const productOptions = computed<SearchableSelectOption<number>[]>(() => products.value.map((product) => ({
  label: product.name ?? `#${product.id}`,
  value: product.id,
  searchText: [product.name, product.translation_name?.ar, product.translation_name?.en].filter(Boolean).join(' '),
})))
const optionGroups = computed(() => {
  const groups = new Map<string, { label: string; values: ProductOptionValue[] }>()

  for (const value of optionValues.value) {
    const option = value.product_option ?? value.productOption ?? productOptionTypes.value.find((item) => item.id === value.product_option_id)
    const key = String(option?.id ?? value.product_option_id ?? 'other')
    const group = groups.get(key) ?? { label: displayName(option), values: [] }
    group.values.push(value)
    groups.set(key, group)
  }

  return [...groups.values()]
})

function displayName(record?: { name?: string | null; translation_name?: { ar?: string | null; en?: string | null } } | null) {
  return record?.name ?? record?.translation_name?.ar ?? record?.translation_name?.en ?? '—'
}

function normalizeList<T>(response: T[] | { data: T[] }): T[] {
  return Array.isArray(response) ? response : response.data
}

async function loadOptions() {
  optionsLoading.value = true
  try {
    const [productResponse, productOptionResponse, optionResponse, warehouseResponse] = await Promise.all([
      listProducts({ per_page: -1 }),
      listProductOptions({ per_page: -1 }),
      listOptionValues({ per_page: -1 }),
      listWarehouses({ per_page: -1 }),
    ])
    products.value = normalizeList(productResponse)
    productOptionTypes.value = normalizeList(productOptionResponse)
    optionValues.value = normalizeList(optionResponse)
    warehouses.value = normalizeList(warehouseResponse)
    if (!form.stocks?.length) form.stocks = warehouses.value.map((warehouse) => ({ warehouse_id: warehouse.id, quantity: 0 }))
  } finally {
    optionsLoading.value = false
  }
}

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const item = await getProductItem(props.id)
    form.sku = item.sku ?? ''
    form.barcode = item.barcode ?? ''
    form.product_id = item.product_id ?? item.product?.id ?? null
    form.is_active = normalizeBoolean(item.is_active, true)
    form.price = item.current_price ?? 0
    form.option_value_ids = item.option_values?.map((value) => value.id) ?? []
    const quantities = new Map(item.stocks?.map((stock) => [stock.warehouse_id, stock.quantity]) ?? [])
    form.stocks = warehouses.value.map((warehouse) => ({
      warehouse_id: warehouse.id,
      quantity: quantities.get(warehouse.id) ?? 0,
    }))
  } finally {
    loading.value = false
  }
}

function groupSelectedValues(group: { values: ProductOptionValue[] }): number[] {
  const groupIds = new Set(group.values.map((value) => value.id))
  return (form.option_value_ids ?? []).filter((id) => groupIds.has(id))
}

function setGroupValues(group: { values: ProductOptionValue[] }, selected: number[]) {
  const groupIds = new Set(group.values.map((value) => value.id))
  form.option_value_ids = [...(form.option_value_ids ?? []).filter((id) => !groupIds.has(id)), ...selected]
}

function setImages(files: File[]) {
  images.value = files
  form.images = images.value
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''
  try {
    const payload = { ...form, images: images.value }
    if (props.id) await updateProductItem(props.id, payload)
    else await createProductItem(payload)
    toast.success(t('crud.saved'))
    await router.push({ name: 'product-items.index' })
  } catch (error) {
    if (error instanceof ApiError) {
      errors.value = error.errors ?? {}
      errorMessage.value = error.message
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadOptions()
  await loadRecord()
})
</script>

<template>
  <FormPageLayout :title="t(isEdit ? 'inventory.editProductItem' : 'inventory.createProductItem')" :description="t('inventory.productItemFormDescription')" :error-message="errorMessage" :loading-text="loading ? t('inventory.loadingProductItem') : ''" @submit="submit">
    <div class="grid gap-4 md:grid-cols-2">
      <FormInput id="item_sku" v-model="form.sku" :label="t('table.sku')" required :error="errors.sku?.[0]" />
      <FormInput id="item_barcode" v-model="form.barcode" :label="t('table.barcode')" required :error="errors.barcode?.[0]" />
      <SearchableSelectInput id="item_product" v-model="form.product_id" :label="t('table.product')" :options="productOptions" :placeholder="t('common.select')" :search-placeholder="t('crud.searchPlaceholder')" :empty-text="t('states.emptyTitle')" :loading="optionsLoading" :error="errors.product_id?.[0]" required />
      <FormInput id="item_price" v-model="form.price" :label="t('table.price')" type="number" required :error="errors.price?.[0]" />
      <BooleanField id="item_status" v-model="form.is_active" class="md:col-span-2" :label="t('dataEntry.status')" :on-label="t('dataEntry.active')" :off-label="t('dataEntry.inactive')" :error="errors.is_active?.[0]" data-testid="product-item-active-field" />
      <div v-if="optionGroups.length" class="grid gap-3 md:col-span-2">
        <span class="form-label">{{ t('inventory.optionValues') }}</span>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <BaseSelect
            v-for="group in optionGroups"
            :id="`item_options_${group.label}`"
            :key="group.label"
            :model-value="groupSelectedValues(group)"
            :label="group.label"
            :options="group.values.map((value) => ({ value: value.id, label: displayName(value) }))"
            multiple
            searchable
            clearable
            @update:model-value="setGroupValues(group, $event as number[])"
          />
        </div>
        <span v-if="errors.option_value_ids?.[0]" class="form-error">{{ errors.option_value_ids[0] }}</span>
      </div>
      <div class="md:col-span-2">
        <span class="form-label">{{ t('inventory.warehouseQuantities') }}</span>
        <div class="mt-2 grid gap-3 md:grid-cols-2">
          <FormInput v-for="(stock, index) in form.stocks" :id="`stock_${stock.warehouse_id}`" :key="stock.warehouse_id" v-model="stock.quantity" :label="warehouses.find((warehouse) => warehouse.id === Number(stock.warehouse_id))?.name ?? `#${stock.warehouse_id}`" type="number" :error="errors[`stocks.${index}.quantity`]?.[0]" />
        </div>
      </div>
      <FileUpload id="item_images" class="md:col-span-2" :label="t('inventory.images')" accept="image/jpeg,image/png,image/webp" multiple :error="errors['images.0']?.[0]" @change="setImages" />
    </div>
    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'product-items.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
