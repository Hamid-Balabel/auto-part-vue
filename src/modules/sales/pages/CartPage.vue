<script setup lang="ts">
import { ArrowLeft, ShoppingCart, Trash2 } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import FormInput from '@/components/forms/FormInput.vue'
import SearchableSelectInput from '@/components/forms/SearchableSelectInput.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ApiError } from '@/api/http'
import { usePermissions } from '@/composables/usePermissions'
import { useLocalizedName } from '@/composables/useLocalizedName'
import { listCustomers, listProductItems } from '@/modules/inventory/api'
import type { Customer, ProductItem } from '@/modules/inventory/types'
import { useToastStore } from '@/stores/toast'
import { addCartLine, checkout, clearCart, deleteCartLine, getCartSummary, listMyCart, updateCartLine } from '../api'
import type { CartLine, CartSummary, CheckoutPayload, PaymentMethod } from '../types'
import OrderSummary from '../components/OrderSummary.vue'
import ProductItemIdentity from '../components/ProductItemIdentity.vue'
import QuantityControl from '../components/QuantityControl.vue'

const { t, locale } = useI18n()
const localizedName = useLocalizedName()
const router = useRouter()
const toast = useToastStore()
const { can } = usePermissions()
const loading = ref(true)
const adding = ref(false)
const checkingOut = ref(false)
const lines = ref<CartLine[]>([])
const summary = ref<CartSummary>({ count: 0, total: 0 })
const productItems = ref<ProductItem[]>([])
const customers = ref<Customer[]>([])
const selectedItemId = ref<number | string>('')
const addQuantity = ref<number | string>(1)
const confirmDeleteId = ref<number | null>(null)
const confirmClear = ref(false)
const deleting = ref(false)
const errors = ref<Record<string, string[]>>({})
const updatingIds = ref(new Set<number>())
const desiredQuantities = reactive<Record<number, number>>({})
const checkoutForm = reactive<CheckoutPayload>({ invoice_no: '', customer_id: 0, payment_method: 'cash' })

const canAdd = computed(() => can('create-cart'))
const canCheckout = computed(() => can('create-order'))
const itemOptions = computed(() => productItems.value.filter((item) => item.is_active && item.product?.is_active !== false && item.current_price !== null).map((item) => ({
  value: item.id,
  label: `${localizedName(item.product, item.sku)} · ${item.sku}`,
})))
const customerOptions = computed(() => customers.value.filter((customer) => customer.is_active !== false).map((customer) => ({ value: customer.id, label: `${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}` })))
const paymentOptions = computed(() => (['cash', 'card', 'transfer'] as PaymentMethod[]).map((value) => ({ value, label: t(`sales.paymentMethods.${value}`) })))

function firstError(field: string) {
  return errors.value[field]?.[0]
}

function recalculateSummary() {
  summary.value = {
    count: lines.value.length,
    total: lines.value.reduce((total, line) => total + Number(line.line_total), 0),
  }
}

async function loadCart() {
  loading.value = true
  try {
    const [cartLines, cartSummary] = await Promise.all([listMyCart(), getCartSummary()])
    lines.value = cartLines
    summary.value = cartSummary
    for (const line of cartLines) desiredQuantities[line.id] = Number(line.quantity)
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  const [itemsResult, customersResult] = await Promise.all([
    listProductItems({ per_page: -1 }),
    listCustomers({ per_page: -1 }),
  ])
  productItems.value = Array.isArray(itemsResult) ? itemsResult : itemsResult.data
  customers.value = Array.isArray(customersResult) ? customersResult : customersResult.data
}

async function addItem() {
  if (!selectedItemId.value) return
  adding.value = true
  errors.value = {}
  try {
    await addCartLine({ item_id: Number(selectedItemId.value), quantity: Math.max(1, Number(addQuantity.value)) })
    selectedItemId.value = ''
    addQuantity.value = 1
    toast.success(t('sales.itemAdded'))
    await loadCart()
  } catch (error) {
    if (error instanceof ApiError) errors.value = error.errors ?? {}
    toast.error(error instanceof ApiError ? error.message : t('sales.cartUpdateFailed'))
  } finally {
    adding.value = false
  }
}

function isUpdating(id: number) {
  return updatingIds.value.has(id)
}

async function queueQuantity(line: CartLine, quantity: number) {
  desiredQuantities[line.id] = quantity
  line.quantity = quantity
  line.line_total = Number(line.price) * quantity
  recalculateSummary()
  if (isUpdating(line.id)) return

  updatingIds.value = new Set(updatingIds.value).add(line.id)
  try {
    let savedQuantity = 0
    while (savedQuantity !== desiredQuantities[line.id]) {
      const nextQuantity = desiredQuantities[line.id]
      const updated = await updateCartLine(line.id, { item_id: line.item_id, quantity: nextQuantity })
      savedQuantity = nextQuantity
      if (desiredQuantities[line.id] === savedQuantity) Object.assign(line, updated)
    }
    recalculateSummary()
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : t('sales.cartUpdateFailed'))
    await loadCart()
  } finally {
    const next = new Set(updatingIds.value)
    next.delete(line.id)
    updatingIds.value = next
  }
}

async function removeLine() {
  if (!confirmDeleteId.value) return
  deleting.value = true
  try {
    await deleteCartLine(confirmDeleteId.value)
    lines.value = lines.value.filter((line) => line.id !== confirmDeleteId.value)
    recalculateSummary()
    confirmDeleteId.value = null
    toast.success(t('sales.itemRemoved'))
  } finally {
    deleting.value = false
  }
}

async function clearAll() {
  deleting.value = true
  try {
    await clearCart()
    lines.value = []
    summary.value = { count: 0, total: 0 }
    confirmClear.value = false
    toast.success(t('sales.cartCleared'))
  } finally {
    deleting.value = false
  }
}

async function submitCheckout() {
  if (!lines.value.length || updatingIds.value.size) return
  checkingOut.value = true
  errors.value = {}
  try {
    const order = await checkout({ ...checkoutForm, customer_id: Number(checkoutForm.customer_id) })
    toast.success(t('sales.checkoutSuccess'))
    await router.push({ name: 'orders.show', params: { id: order.id } })
  } catch (error) {
    if (error instanceof ApiError) errors.value = error.errors ?? {}
    toast.error(error instanceof ApiError ? error.message : t('sales.checkoutFailed'))
  } finally {
    checkingOut.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadCart(), loadOptions()])
})
watch(locale, () => {
  void Promise.allSettled([loadCart(), loadOptions()])
})
</script>

<template>
  <PageHeader :title="t('sales.cartTitle')" :description="t('sales.cartDescription')">
    <template #actions>
      <BaseButton v-if="lines.length" variant="outline" type="button" @click="confirmClear = true"><Trash2 class="size-4" />{{ t('sales.clearCart') }}</BaseButton>
    </template>
  </PageHeader>

  <section v-if="canAdd" class="panel mb-5 p-4">
    <form class="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]" @submit.prevent="addItem">
      <SearchableSelectInput id="cart-item" v-model="selectedItemId" :label="t('sales.productItem')" :options="itemOptions" :error="firstError('item_id')" required />
      <FormInput id="cart-add-quantity" v-model="addQuantity" :label="t('table.quantity')" type="number" :error="firstError('quantity')" required />
      <BaseButton type="submit" :loading="adding" :disabled="!selectedItemId"><ShoppingCart class="size-4" />{{ t('sales.addToCart') }}</BaseButton>
    </form>
  </section>

  <LoadingState v-if="loading" />
  <EmptyState v-else-if="!lines.length" :title="t('sales.emptyCartTitle')" :message="t('sales.emptyCartMessage')" />
  <div v-else class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    <section class="panel overflow-hidden">
      <div v-for="line in lines" :key="line.id" class="grid gap-4 border-b border-border p-4 last:border-b-0 md:grid-cols-[minmax(220px,1fr)_auto_auto_auto] md:items-center">
        <ProductItemIdentity :item="line.item" />
        <div><p class="text-xs text-text-muted">{{ t('sales.unitPrice') }}</p><MoneyDisplay :value="line.price" currency="EGP" /></div>
        <QuantityControl :model-value="Number(line.quantity)" :loading="isUpdating(line.id)" :label="t('sales.quantityFor', { sku: line.item?.sku ?? line.item_id })" @update:model-value="queueQuantity(line, $event)" />
        <div class="flex items-center justify-between gap-3 md:justify-end">
          <div><p class="text-xs text-text-muted">{{ t('sales.lineTotal') }}</p><MoneyDisplay :value="line.line_total" currency="EGP" /></div>
          <BaseButton variant="danger" size="sm" type="button" :aria-label="t('actions.delete')" :title="t('actions.delete')" @click="confirmDeleteId = line.id"><Trash2 class="size-4" /></BaseButton>
        </div>
      </div>
    </section>

    <aside class="space-y-5">
      <OrderSummary :subtotal="summary.total" :total="summary.total" />
      <form v-if="canCheckout" class="panel p-5" @submit.prevent="submitCheckout">
        <h2 class="text-base font-bold text-text">{{ t('sales.checkout') }}</h2>
        <p class="mt-1 text-sm text-text-muted">{{ t('sales.checkoutDescription') }}</p>
        <div class="mt-4 grid gap-4">
          <FormInput id="invoice-no" v-model="checkoutForm.invoice_no" :label="t('sales.invoiceNo')" :error="firstError('invoice_no')" required />
          <SearchableSelectInput id="checkout-customer" v-model="checkoutForm.customer_id" :label="t('sales.customer')" :options="customerOptions" :error="firstError('customer_id')" required />
          <SelectInput id="payment-method" v-model="checkoutForm.payment_method" :label="t('sales.paymentMethod')" :options="paymentOptions" :error="firstError('payment_method')" />
          <p v-if="firstError('cart') || firstError('items')" class="form-error">{{ firstError('cart') ?? firstError('items') }}</p>
          <BaseButton type="submit" full-width :loading="checkingOut" :disabled="!checkoutForm.invoice_no || !checkoutForm.customer_id || updatingIds.size > 0">
            {{ t('sales.completeCheckout') }}<ArrowLeft class="size-4 rtl:rotate-0 ltr:rotate-180" />
          </BaseButton>
        </div>
      </form>
    </aside>
  </div>

  <ConfirmDialog :open="confirmDeleteId !== null" :title="t('sales.removeItem')" :message="t('sales.removeItemMessage')" :confirm-label="t('actions.delete')" :loading="deleting" @close="confirmDeleteId = null" @confirm="removeLine" />
  <ConfirmDialog :open="confirmClear" :title="t('sales.clearCart')" :message="t('sales.clearCartMessage')" :confirm-label="t('sales.clearCart')" :loading="deleting" @close="confirmClear = false" @confirm="clearAll" />
</template>
