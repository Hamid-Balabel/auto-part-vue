<script setup lang="ts">
import { ArrowLeft, CheckCircle2, Plus, RotateCcw } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FormInput from '@/components/forms/FormInput.vue'
import SearchableSelectInput from '@/components/forms/SearchableSelectInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ApiError } from '@/api/http'
import { usePermissions } from '@/composables/usePermissions'
import { createCustomer } from '@/modules/inventory/api'
import type { CustomerPayload } from '@/modules/inventory/types'
import { useToastStore } from '@/stores/toast'
import { useAdminStore } from '@/stores/admin'
import OrderSummary from '../components/OrderSummary.vue'
import PartialPaymentForm from '../components/PartialPaymentForm.vue'
import PaymentMethodSelector from '../components/PaymentMethodSelector.vue'
import ProductSearch from '../components/ProductSearch.vue'
import QuickCustomerDialog from '../components/QuickCustomerDialog.vue'
import QuickSaleItems from '../components/QuickSaleItems.vue'
import SalesStatusBadge from '../components/SalesStatusBadge.vue'
import { useQuickSale } from '../composables/useQuickSale'

const { t } = useI18n()
const toast = useToastStore()
const adminStore = useAdminStore()
const { can } = usePermissions()
const sale = useQuickSale()
const customerDialogOpen = ref(false)
const creatingCustomer = ref(false)
const customerErrors = ref<Record<string, string[]>>({})
const canCreateCustomer = computed(() => can('create-customer'))
const canRecordPayment = computed(() => can('create-installment'))
const customerOptions = computed(() => sale.customers.value.map((customer) => ({ value: customer.id, label: `${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}` })))

function firstError(field: string) {
  const value = sale.errors.value[field]?.[0]
  if (value === 'required') return t('sales.validation.required')
  if (value === 'positive') return t('sales.validation.positivePayment')
  if (value === 'exceeds') return t('sales.validation.paymentExceedsTotal')
  return value
}

async function submitSale() {
  if (!canRecordPayment.value) return
  try {
    const order = await sale.submit()
    if (order) toast.success(t('sales.quickSaleSuccess', { invoice: order.invoice_no }))
  } catch (error) {
    const message = error instanceof ApiError ? error.message : t('sales.quickSaleFailed')
    toast.error(sale.createdOrder.value ? t('sales.orderCreatedPaymentFailed', { invoice: sale.createdOrder.value.invoice_no }) : message)
  }
}

async function createQuickCustomer(payload: CustomerPayload) {
  creatingCustomer.value = true
  customerErrors.value = {}
  try {
    const customer = await createCustomer(payload)
    sale.selectCustomer(customer)
    customerDialogOpen.value = false
    toast.success(t('sales.customerCreated'))
  } catch (error) {
    if (error instanceof ApiError) customerErrors.value = error.errors ?? {}
    toast.error(error instanceof ApiError ? error.message : t('sales.customerCreateFailed'))
  } finally {
    creatingCustomer.value = false
  }
}

onMounted(async () => {
  await Promise.all([sale.loadDependencies(), adminStore.loadCountries()])
})
</script>

<template>
  <PageHeader :title="t('sales.quickSaleTitle')" :description="t('sales.quickSaleDescription')">
    <template #actions><BaseButton variant="outline" :to="{ name: 'orders.index' }"><ArrowLeft class="size-4 rtl:rotate-180" />{{ t('sales.backToOrders') }}</BaseButton></template>
  </PageHeader>

  <section v-if="sale.completedOrder.value" class="panel mx-auto max-w-2xl overflow-hidden">
    <div class="bg-success-soft p-6 text-center"><CheckCircle2 class="mx-auto size-12 text-success" /><h2 class="mt-3 text-xl font-bold text-text">{{ t('sales.saleCompleted') }}</h2><p class="mt-1 text-text-muted">{{ t('sales.saleCompletedMessage', { invoice: sale.completedOrder.value.invoice_no }) }}</p></div>
    <div class="grid gap-4 p-6 sm:grid-cols-3"><div><p class="text-xs text-text-muted">{{ t('sales.total') }}</p><MoneyDisplay :value="sale.completedOrder.value.total" currency="EGP" /></div><div><p class="text-xs text-text-muted">{{ t('sales.paidAmount') }}</p><MoneyDisplay :value="sale.completedOrder.value.paid_amount" currency="EGP" /></div><div><p class="text-xs text-text-muted">{{ t('sales.paymentStatus') }}</p><SalesStatusBadge :value="sale.completedOrder.value.payment_status" /></div></div>
    <div class="flex flex-wrap justify-center gap-3 border-t border-border p-5"><BaseButton :to="{ name: 'orders.show', params: { id: sale.completedOrder.value.id } }">{{ t('actions.view') }}</BaseButton><BaseButton variant="secondary" type="button" @click="sale.reset"><RotateCcw class="size-4" />{{ t('sales.newSale') }}</BaseButton></div>
  </section>

  <div v-else class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
    <div class="min-w-0 space-y-5">
      <section class="panel p-4"><ProductSearch :products="sale.products.value" :loading="sale.loading.value" @select="sale.addProduct" /><p class="mt-3 text-xs text-text-muted">{{ t('sales.productSearchNotice') }}</p></section>
      <QuickSaleItems :lines="sale.lines.value" @quantity="sale.updateQuantity" @remove="sale.removeProduct" />
      <p v-if="firstError('items')" class="form-error">{{ firstError('items') }}</p>
    </div>

    <aside class="min-w-0 space-y-5 xl:sticky xl:top-24 xl:self-start">
      <form class="panel p-5" @submit.prevent="submitSale">
        <h2 class="text-base font-bold text-text">{{ t('sales.saleInformation') }}</h2>
        <div class="mt-4 grid gap-4">
          <FormInput id="quick-sale-invoice" v-model="sale.form.invoice_no" :label="t('sales.invoiceNo')" :error="firstError('invoice_no')" required />
          <div>
            <SearchableSelectInput id="quick-sale-customer" v-model="sale.form.customer_id" :label="t('sales.customer')" :options="customerOptions" :error="firstError('customer_id')" required />
            <BaseButton v-if="canCreateCustomer" class="mt-2" variant="link" type="button" @click="customerDialogOpen = true"><Plus class="size-4" />{{ t('sales.quickCustomer') }}</BaseButton>
          </div>
          <PaymentMethodSelector v-model="sale.form.payment_mode" :disabled="sale.submitting.value" />
          <PartialPaymentForm v-if="sale.form.payment_mode === 'partial'" :amount="sale.form.initial_paid_amount" :method="sale.form.partial_payment_method" :total="sale.previewTotal.value" :remaining="sale.previewRemaining.value" :error="firstError('amount')" @update:amount="sale.form.initial_paid_amount = $event" @update:method="sale.form.partial_payment_method = $event" />
          <div v-if="!canRecordPayment" class="rounded-[var(--radius-lg)] border border-danger/25 bg-danger-soft p-3 text-sm text-danger">{{ t('sales.paymentPermissionRequired') }}</div>
          <div v-if="sale.createdOrder.value && !sale.completedOrder.value" class="rounded-[var(--radius-lg)] border border-warning/30 bg-warning-soft p-3 text-sm text-warning"><p>{{ t('sales.orderCreatedPaymentFailed', { invoice: sale.createdOrder.value.invoice_no }) }}</p><BaseButton class="mt-2" variant="link" :to="{ name: 'orders.show', params: { id: sale.createdOrder.value.id } }">{{ t('actions.view') }}</BaseButton></div>
        </div>
      </form>
      <OrderSummary :subtotal="sale.previewTotal.value" :total="sale.previewTotal.value" :paid="sale.previewPaid.value" :remaining="sale.previewRemaining.value" />
      <BaseButton full-width size="lg" type="button" :loading="sale.submitting.value" :disabled="!canRecordPayment || !sale.lines.value.length || !sale.form.customer_id" @click="submitSale">{{ t('sales.completeSale') }} · <MoneyDisplay :value="sale.previewTotal.value" currency="EGP" /></BaseButton>
    </aside>
  </div>

  <QuickCustomerDialog :open="customerDialogOpen" :loading="creatingCustomer" :countries-loading="adminStore.countriesLoading" :countries="adminStore.countries" :errors="customerErrors" @close="customerDialogOpen = false" @submit="createQuickCustomer" />
</template>
