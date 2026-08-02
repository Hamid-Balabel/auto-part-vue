<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FormInput from '@/components/forms/FormInput.vue'
import SearchableSelectInput, { type SearchableSelectOption } from '@/components/forms/SearchableSelectInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useToastStore } from '@/stores/toast'
import { createStock, getStock, listProductItems, listWarehouses, updateStock } from '../api'
import type { ProductItem, StockPayload, Warehouse } from '../types'

const props = defineProps<{ id?: string }>()

const router = useRouter()
const { t } = useI18n()
const toast = useToastStore()
const permissions = useResourcePermissions('stock')
const canSave = computed(() => props.id ? permissions.canUpdate.value : permissions.canCreate.value)
const loading = ref(false)
const saving = ref(false)
const optionsLoading = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const warehouses = ref<Warehouse[]>([])
const productItems = ref<ProductItem[]>([])
const form = reactive<StockPayload>({ warehouse_id: '', item_id: '', quantity: 0 })
const isEdit = computed(() => Boolean(props.id))

const warehouseOptions = computed<SearchableSelectOption<number>[]>(() => warehouses.value.map((warehouse) => ({
  label: warehouse.name ?? `#${warehouse.id}`,
  value: warehouse.id,
  description: warehouse.address ?? undefined,
  searchText: [warehouse.name, warehouse.translation_name?.ar, warehouse.translation_name?.en, warehouse.address].filter(Boolean).join(' '),
})))
const itemOptions = computed<SearchableSelectOption<number>[]>(() => productItems.value.map((item) => ({
  label: item.sku,
  value: item.id,
  meta: item.current_price ? `${t('table.price')}: ${item.current_price}` : undefined,
  searchText: [item.sku, item.id].filter(Boolean).join(' '),
})))

function normalizeList<T>(response: T[] | { data: T[] }): T[] {
  return Array.isArray(response) ? response : response.data
}

async function loadOptions() {
  optionsLoading.value = true
  try {
    const [warehouseResponse, itemResponse] = await Promise.all([
      listWarehouses({ per_page: -1 }),
      listProductItems({ per_page: -1 }),
    ])
    warehouses.value = normalizeList(warehouseResponse)
    productItems.value = normalizeList(itemResponse)
  } finally {
    optionsLoading.value = false
  }
}

async function loadRecord() {
  if (!props.id) return
  loading.value = true
  try {
    const stock = await getStock(props.id)
    form.warehouse_id = stock.warehouse_id
    form.item_id = stock.item_id
    form.quantity = stock.quantity
  } finally {
    loading.value = false
  }
}

async function submit() {
  saving.value = true
  errors.value = {}
  errorMessage.value = ''
  try {
    const payload = { warehouse_id: form.warehouse_id, item_id: form.item_id, quantity: form.quantity }
    if (props.id) await updateStock(props.id, payload)
    else await createStock(payload)
    toast.success(t('crud.saved'))
    await router.push({ name: 'stocks.index' })
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
  <FormPageLayout
    :title="t(isEdit ? 'inventory.editStock' : 'inventory.createStock')"
    :description="t('inventory.stockFormDescription')"
    :error-message="errorMessage"
    :loading-text="loading ? t('inventory.loadingStock') : ''"
    @submit="submit"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <SearchableSelectInput
        id="stock_warehouse"
        v-model="form.warehouse_id"
        :label="t('table.warehouse')"
        :options="warehouseOptions"
        :placeholder="t('common.select')"
        :search-placeholder="t('crud.searchPlaceholder')"
        :empty-text="t('states.emptyTitle')"
        :loading="optionsLoading"
        :disabled="isEdit"
        :error="errors.warehouse_id?.[0]"
        required
      />
      <SearchableSelectInput
        id="stock_item"
        v-model="form.item_id"
        :label="t('table.productItem')"
        :options="itemOptions"
        :placeholder="t('common.select')"
        :search-placeholder="t('crud.searchPlaceholder')"
        :empty-text="t('states.emptyTitle')"
        :loading="optionsLoading"
        :disabled="isEdit"
        :error="errors.item_id?.[0]"
        required
      />
      <FormInput id="stock_quantity" v-model="form.quantity" :label="t('table.quantity')" type="number" required :error="errors.quantity?.[0]" />
      <p class="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4 text-sm leading-6 text-text-muted md:col-span-2">
        {{ t('inventory.stockOverwriteNotice') }}
      </p>
    </div>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'stocks.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving">{{ saving ? t('actions.saving') : t('actions.save') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
