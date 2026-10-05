<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import SearchableSelectInput, { type SearchableSelectOption } from '@/components/forms/SearchableSelectInput.vue'
import BooleanField from '@/components/forms/BooleanField.vue'
import TranslatableFields from '@/components/forms/TranslatableFields.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { listCategoryTree, listResource } from '@/modules/data-entry/api'
import CategoryTreeSelect from '@/modules/data-entry/components/CategoryTreeSelect.vue'
import { useToastStore } from '@/stores/toast'
import { createProduct, getProduct, updateProduct } from '../api'
import type { Brand, ProductPayload } from '../types'
import type { CategoryTreeNode } from '@/modules/data-entry/types'
import { normalizeBoolean } from '@/utils/boolean'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const { t } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('product')
const loading = ref(false)
const optionsLoading = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const categories = ref<CategoryTreeNode[]>([])
const brands = ref<Brand[]>([])
const isEdit = computed(() => Boolean(props.id))
const canSave = computed(() => props.id ? permissions.canUpdate.value : permissions.canCreate.value)
const form = reactive<ProductPayload>({
  name: { ar: '', en: '' },
  description: { ar: '', en: '' },
  category_id: null,
  brand_id: null,
  is_active: true,
})

const brandOptions = computed<SearchableSelectOption<number>[]>(() => brands.value.map((brand) => ({
  label: brand.name ?? `#${brand.id}`,
  value: brand.id,
  searchText: [brand.name, brand.translation_name?.ar, brand.translation_name?.en].filter(Boolean).join(' '),
})))

function normalizeList<T>(response: T[] | { data: T[] }): T[] {
  return Array.isArray(response) ? response : response.data
}

async function loadOptions() {
  optionsLoading.value = true
  try {
    const [categoryResponse, brandResponse] = await Promise.all([
      listCategoryTree(),
      listResource('brands', { per_page: -1 }),
    ])
    categories.value = categoryResponse
    brands.value = normalizeList(brandResponse)
  } finally {
    optionsLoading.value = false
  }
}

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const product = await getProduct(props.id)
    form.name = { ar: product.translation_name?.ar ?? '', en: product.translation_name?.en ?? '' }
    form.description = { ar: product.translation_description?.ar ?? '', en: product.translation_description?.en ?? '' }
    form.category_id = product.category_id ?? null
    form.brand_id = product.brand_id ?? null
    form.is_active = normalizeBoolean(product.is_active, true)
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''
  try {
    if (props.id) await updateProduct(props.id, form)
    else await createProduct(form)
    toast.success(t('crud.saved'))
    await router.push({ name: 'products.index' })
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
  await Promise.all([loadOptions(), loadRecord()])
})
</script>

<template>
  <FormPageLayout :title="t(isEdit ? 'inventory.editProduct' : 'inventory.createProduct')" :description="t('inventory.productFormDescription')" :error-message="errorMessage" :loading-text="loading ? t('inventory.loadingProduct') : ''" @submit="submit">
    <div class="grid gap-4 md:grid-cols-2">
      <TranslatableFields id="product_name" v-model="form.name" :label-ar="t('dataEntry.nameAr')" :label-en="t('dataEntry.nameEn')" :error-ar="errors['name.ar']?.[0]" :error-en="errors['name.en']?.[0]" required-ar />
      <TranslatableFields id="product_description" v-model="form.description" :label-ar="t('dataEntry.descriptionAr')" :label-en="t('dataEntry.descriptionEn')" :error-ar="errors['description.ar']?.[0]" :error-en="errors['description.en']?.[0]" />
      <CategoryTreeSelect id="product_category" v-model="form.category_id" :label="t('table.category')" :nodes="categories" :loading="optionsLoading" :error="errors.category_id?.[0]" required />
      <SearchableSelectInput id="product_brand" v-model="form.brand_id" :label="t('table.brand')" :options="brandOptions" :placeholder="t('common.select')" :search-placeholder="t('crud.searchPlaceholder')" :empty-text="t('states.emptyTitle')" :loading="optionsLoading" :error="errors.brand_id?.[0]" required />
      <BooleanField id="product_status" v-model="form.is_active" class="md:col-span-2" :label="t('dataEntry.status')" :on-label="t('dataEntry.active')" :off-label="t('dataEntry.inactive')" :error="errors.is_active?.[0]" data-testid="product-active-field" />
    </div>
    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'products.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
