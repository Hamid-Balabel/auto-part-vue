<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FormInput from '@/components/forms/FormInput.vue'
import DateInput from '@/components/forms/DateInput.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import SearchableSelectInput, { type SearchableSelectOption } from '@/components/forms/SearchableSelectInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormPageLayout from '@/components/ui/FormPageLayout.vue'
import { ApiError } from '@/api/http'
import { useResourcePermissions } from '@/composables/useResourcePermissions'
import { useLocalizedName } from '@/composables/useLocalizedName'
import { usePermissions } from '@/composables/usePermissions'
import { useToastStore } from '@/stores/toast'
import { listParties, listProductItems, listWarehouses, purchaseStock } from '../api'
import type { Party, ProductItem, PurchaseStockPayload, Warehouse } from '../types'
import type { PaymentMethod } from '@/modules/sales/types'
import PartySelectField from '../components/PartySelectField.vue'

const props = defineProps<{ id?: string }>()

const router = useRouter()
const { t } = useI18n()
const localizedName = useLocalizedName()
const toast = useToastStore()
const permissions = useResourcePermissions('stock')
const { can } = usePermissions()
const canSave = computed(() => !props.id && permissions.canCreate.value)
const loading = ref(false)
const saving = ref(false)
const optionsLoading = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const warehouses = ref<Warehouse[]>([])
const suppliers = ref<Party[]>([])
const productItems = ref<ProductItem[]>([])
const form = reactive({ warehouse_id: null as number | null, product_item_id: null as number | null, supplier_party_id: null as number | null, quantity: 1 as number | string, purchase_price: 0 as number | string, purchased_at: '', payment_method: 'cash' as PaymentMethod })
const createInstallmentPlan = ref(false)
const isEdit = computed(() => Boolean(props.id))
const canLoadSuppliers = computed(() => can('read-party') && can(['view-all-party', 'view-own-party', 'read-party']))
const canCreatePurchasePlan = computed(() => can('create-installment') && can('read-purchase') && can(['view-all-purchase', 'view-own-purchase']))
const paymentMethodOptions = computed(() => (['cash', 'card', 'transfer'] as PaymentMethod[]).map((value) => ({ value, label: t(`sales.paymentMethods.${value}`) })))

const warehouseOptions = computed<SearchableSelectOption<number>[]>(() => warehouses.value.map((warehouse) => ({
  label: localizedName(warehouse, `#${warehouse.id}`),
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
    const [warehouseResponse, itemResponse, merchantResponse] = await Promise.all([
      listWarehouses({ per_page: -1, is_active: true }),
      listProductItems({ per_page: -1 }),
      canLoadSuppliers.value ? listParties({ per_page: -1, classification: 'supplier', is_active: true }) : Promise.resolve([]),
    ])
    warehouses.value = normalizeList(warehouseResponse)
    productItems.value = normalizeList(itemResponse)
    suppliers.value = normalizeList(merchantResponse)
    if (!form.warehouse_id) form.warehouse_id = warehouses.value[0]?.id ?? null
  } finally {
    optionsLoading.value = false
  }
}

async function loadRecord() {
  if (!props.id) return
  errorMessage.value = t('inventory.stockEditDisabled')
}

function validateForm(): Record<string, string[]> {
  const next: Record<string, string[]> = {}
  if (!form.warehouse_id) next.warehouse_id = [t('inventory.warehouseRequired')]
  if (!form.product_item_id) next.product_item_id = [t('inventory.productItemRequired')]
  if (!form.supplier_party_id) next.supplier_party_id = [t('inventory.supplierRequired')]
  const qty = Number(form.quantity)
  if (!Number.isInteger(qty) || qty < 1) next.quantity = [t('inventory.quantityIntegerMin')]
  const price = Number(form.purchase_price)
  if (Number.isNaN(price) || price < 0) next.purchase_price = [t('inventory.purchasePriceMin')]
  else if (!Number.isFinite(price) || price.toString().split('.')[1]?.length > 2) next.purchase_price = [t('inventory.purchasePriceDecimals')]
  return next
}

function selectPlan(checked: boolean) {
  createInstallmentPlan.value = checked && canCreatePurchasePlan.value
}

function settlementMode(): PurchaseStockPayload['settlement_mode'] {
  if (createInstallmentPlan.value && canCreatePurchasePlan.value) return 'plan';
  return 'paid'
}

async function submit() {
  if (saving.value) return
  saving.value = true
  errors.value = {}
  errorMessage.value = ''
  const validationErrors = validateForm()
  if (Object.keys(validationErrors).length) {
    errors.value = validationErrors
    saving.value = false
    return
  }
  try {
    const mode = settlementMode()
    const payload: PurchaseStockPayload = {
      warehouse_id: form.warehouse_id!,
      product_item_id: form.product_item_id!,
      supplier_party_id: form.supplier_party_id!,
      quantity: Number(form.quantity),
      purchase_price: Number(form.purchase_price),
      payment_method: form.payment_method,
      settlement_mode: mode,
      ...(form.purchased_at ? { purchased_at: form.purchased_at } : {}),
    }
    const batch = await purchaseStock(payload)
    toast.success(t('crud.saved'))
    if (mode === 'plan' && batch.purchase_id) await router.push({ name: 'purchases.show', params: { id: batch.purchase_id }, query: { plan: '1' } })
    else await router.push({ name: 'stocks.index' })
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
    :title="t(isEdit ? 'inventory.editStock' : 'inventory.addStock')"
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
        :empty-text="t('states.emptyTitle')"
        :loading="optionsLoading"
        :disabled="isEdit"
        :error="errors.warehouse_id?.[0]"
        required
      />
      <SearchableSelectInput
        id="stock_item"
        v-model="form.product_item_id"
        :label="t('table.productItem')"
        :options="itemOptions"
        :placeholder="t('common.select')"
        :empty-text="t('states.emptyTitle')"
        :loading="optionsLoading"
        :disabled="isEdit"
        :error="errors.product_item_id?.[0]"
        required
      />
      <PartySelectField id="stock_supplier" v-model="form.supplier_party_id" :label="t('parties.supplier')" :placeholder="t('parties.selectSupplier')" :parties="suppliers" :loading="optionsLoading" :disabled="!canLoadSuppliers || isEdit" :error="errors.supplier_party_id?.[0] || errors.merchant_id?.[0] || (!canLoadSuppliers ? t('parties.readRequired') : '')" required />
      <FormInput id="stock_quantity" v-model="form.quantity" :label="t('table.quantity')" type="number" required :error="errors.quantity?.[0]" />
      <FormInput id="stock_purchase_price" v-model="form.purchase_price" :label="t('inventory.purchasePrice')" type="number" min="0" step="0.01" required :error="errors.purchase_price?.[0]" />
      <DateInput id="stock_purchase_date" v-model="form.purchased_at" :label="t('inventory.purchaseDate')" :error="errors.purchased_at?.[0]" />
      <SelectInput id="stock_payment_method" v-model="form.payment_method" :label="t('sales.paymentMethod')" :options="paymentMethodOptions" :error="errors.payment_method?.[0]" required />
<div class="flex flex-wrap gap-4 md:col-span-2">
        <label class="inline-flex items-center gap-2 text-sm font-medium text-text"><input :checked="createInstallmentPlan" type="checkbox" class="rounded border-border text-primary" :disabled="!canCreatePurchasePlan" @change="selectPlan(($event.target as HTMLInputElement).checked)" />{{ t('installments.createPlanAfterPurchase') }}<span v-if="!canCreatePurchasePlan" class="text-xs font-normal text-text-muted">({{ t('installments.planPermissionRequired') }})</span></label>
      </div>
      <p class="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4 text-sm leading-6 text-text-muted md:col-span-2">{{ t('inventory.stockPurchaseNotice') }}</p>
    </div>

    <template #actions>
      <BaseButton variant="secondary" :to="{ name: 'stocks.index' }">{{ t('actions.cancel') }}</BaseButton>
      <BaseButton v-if="canSave" type="submit" :loading="saving" :disabled="!canLoadSuppliers">{{ saving ? t('actions.saving') : t('inventory.addStock') }}</BaseButton>
    </template>
  </FormPageLayout>
</template>
