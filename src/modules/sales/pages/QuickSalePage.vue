<script setup lang="ts">
defineOptions({ name: 'QuickSalePage' })

import { ArrowLeft, CheckCircle2, Plus, RotateCcw } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
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
import ProductBrowser from '../components/ProductBrowser.vue'
import QuickCustomerDialog from '../components/QuickCustomerDialog.vue'
import QuickSaleItems from '../components/QuickSaleItems.vue'
import SalesStatusBadge from '../components/SalesStatusBadge.vue'
import { useQuickSale } from '../composables/useQuickSale'

const props = defineProps<{ id?: string }>()
const { t } = useI18n()
const router = useRouter()
const toast = useToastStore()
const adminStore = useAdminStore()
const { can } = usePermissions()
const orderId = props.id ? Number(props.id) : null
const editing = computed(() => orderId !== null)
const canOverridePrice = computed(() => can('override-price-order'))
const sale = useQuickSale(orderId, canOverridePrice.value)
const customerDialogOpen = ref(false)
const creatingCustomer = ref(false)
const customerErrors = ref<Record<string, string[]>>({})
const canCreateCustomer = computed(() => can('create-customer'))
const canRecordPayment = computed(() => can('create-installment'))
const customerOptions = computed(() =>
  sale.customers.value.map((customer) => ({
    value: customer.id,
    label: `${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}`,
  })),
)
const canSubmit = computed(
  () =>
    sale.lines.value.length > 0 &&
    Boolean(sale.form.customer_id) &&
    (editing.value || canRecordPayment.value),
)

function firstError(field: string) {
  const value = sale.errors.value[field]?.[0]
  if (value === 'required') return t('sales.validation.required')
  if (value === 'positive') return t('sales.validation.positivePayment')
  if (value === 'exceeds') return t('sales.validation.paymentExceedsTotal')
  if (value === 'invalidPrice') return t('sales.validation.invalidPrice')
  return value
}

async function submitSale() {
  if (!editing.value && !canRecordPayment.value) return
  try {
    const order = await sale.submit()
    if (!order) return
    toast.success(
      editing.value
        ? t('sales.orderUpdated')
        : t('sales.quickSaleSuccess', { invoice: order.invoice_no }),
    )
    if (editing.value)
      await router.push({ name: 'orders.show', params: { id: order.id } })
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : t(editing.value ? 'sales.orderUpdateFailed' : 'sales.quickSaleFailed')
    toast.error(
      sale.createdOrder.value
        ? t('sales.orderCreatedPaymentFailed', {
            invoice: sale.createdOrder.value.invoice_no,
          })
        : message,
    )
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
    toast.error(
      error instanceof ApiError
        ? error.message
        : t('sales.customerCreateFailed'),
    )
  } finally {
    creatingCustomer.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([sale.loadDependencies(), adminStore.loadCountries()])
  } catch (error) {
    toast.error(
      error instanceof ApiError ? error.message : t('details.failedToLoad'),
    )
  }
})
</script>

<template>
  <PageHeader
    :title="editing ? t('sales.editOrder') : t('sales.quickSaleTitle')"
    :description="
      editing
        ? t('sales.editOrderDescription')
        : t('sales.quickSaleDescription')
    "
  >
    <template #actions
      ><BaseButton
        variant="outline"
        :to="
          editing
            ? { name: 'orders.show', params: { id: props.id } }
            : { name: 'orders.index' }
        "
        ><ArrowLeft class="size-4 rtl:rotate-180" />{{
          editing ? t('actions.cancel') : t('sales.backToOrders')
        }}</BaseButton
      ></template
    >
  </PageHeader>

  <section
    v-if="sale.completedOrder.value && !editing"
    class="panel mx-auto max-w-2xl overflow-hidden"
  >
    <div class="bg-success-soft p-6 text-center">
      <CheckCircle2 class="mx-auto size-12 text-success" />
      <h2 class="mt-3 text-xl font-bold text-text">
        {{ t('sales.saleCompleted') }}
      </h2>
      <p class="mt-1 text-text-muted">
        {{
          t('sales.saleCompletedMessage', {
            invoice: sale.completedOrder.value.invoice_no,
          })
        }}
      </p>
    </div>
    <div class="grid gap-4 p-6 sm:grid-cols-3">
      <div>
        <p class="text-xs text-text-muted">{{ t('sales.total') }}</p>
        <MoneyDisplay :value="sale.completedOrder.value.total" currency="EGP" />
      </div>
      <div>
        <p class="text-xs text-text-muted">{{ t('sales.paidAmount') }}</p>
        <MoneyDisplay
          :value="sale.completedOrder.value.paid_amount"
          currency="EGP"
        />
      </div>
      <div>
        <p class="text-xs text-text-muted">{{ t('sales.paymentStatus') }}</p>
        <SalesStatusBadge :value="sale.completedOrder.value.payment_status" />
      </div>
    </div>
    <div class="flex flex-wrap justify-center gap-3 border-t border-border p-5">
      <BaseButton
        :to="{
          name: 'orders.show',
          params: { id: sale.completedOrder.value.id },
        }"
        >{{ t('actions.view') }}</BaseButton
      ><BaseButton variant="secondary" type="button" @click="sale.reset"
        ><RotateCcw class="size-4" />{{ t('sales.newSale') }}</BaseButton
      >
    </div>
  </section>

  <div v-else class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
    <main class="min-w-0 space-y-5">
      <ProductBrowser
        :products="sale.products.value"
        :selected-product="sale.selectedProduct.value"
        :selected-items="sale.selectedItems.value"
        :loading="sale.productsLoading.value"
        :items-loading="sale.itemsLoading.value"
        :has-more="sale.hasMoreProducts.value"
        :search="sale.productSearch.value"
        @update:search="sale.productSearch.value = $event"
        @select-product="sale.selectProduct"
        @close-product="sale.closeProduct"
        @add-item="sale.addProduct"
        @load-more="sale.loadMoreProducts"
      />
    </main>

    <aside
      class="min-w-0 space-y-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start xl:overflow-y-auto xl:pe-1 xl:[overflow-anchor:none]"
    >
      <QuickSaleItems
        :lines="sale.lines.value"
        :can-edit-price="canOverridePrice"
        :price-locked="sale.priceLocked.value"
        :errors="sale.errors.value"
        @quantity="sale.updateQuantity"
        @warehouse="sale.updateWarehouse"
        @price="sale.updatePrice"
        @reset-price="sale.resetPrice"
        @remove="sale.removeProduct"
      />
      <p v-if="firstError('items')" class="form-error">
        {{ firstError('items') }}
      </p>

      <form class="panel p-5" @submit.prevent="submitSale">
        <h2 class="text-base font-bold text-text">
          {{ t('sales.saleInformation') }}
        </h2>
        <div class="mt-4 grid gap-4">
          <FormInput
            id="quick-sale-invoice"
            v-model="sale.form.invoice_no"
            :label="t('sales.invoiceNo')"
            :error="firstError('invoice_no')"
            required
          />
          <div>
            <SearchableSelectInput
              id="quick-sale-customer"
              v-model="sale.form.customer_id"
              :label="t('sales.customer')"
              :options="customerOptions"
              :error="firstError('customer_id')"
              required
            />
            <BaseButton
              v-if="canCreateCustomer"
              class="mt-2"
              variant="link"
              type="button"
              @click="customerDialogOpen = true"
              ><Plus class="size-4" />{{ t('sales.quickCustomer') }}</BaseButton
            >
          </div>
          <template v-if="!editing">
            <PaymentMethodSelector
              v-model="sale.form.payment_mode"
              :disabled="sale.submitting.value"
            />
            <PartialPaymentForm
              v-if="sale.form.payment_mode === 'partial'"
              :amount="sale.form.initial_paid_amount"
              :method="sale.form.partial_payment_method"
              :total="sale.previewTotal.value"
              :remaining="sale.previewRemaining.value"
              :error="firstError('amount')"
              @update:amount="sale.form.initial_paid_amount = $event"
              @update:method="sale.form.partial_payment_method = $event"
            />
            <div
              v-if="!canRecordPayment"
              class="rounded-[var(--radius-lg)] border border-danger/25 bg-danger-soft p-3 text-sm text-danger"
            >
              {{ t('sales.paymentPermissionRequired') }}
            </div>
            <div
              v-if="sale.createdOrder.value && !sale.completedOrder.value"
              class="rounded-[var(--radius-lg)] border border-warning/30 bg-warning-soft p-3 text-sm text-warning"
            >
              <p>
                {{
                  t('sales.orderCreatedPaymentFailed', {
                    invoice: sale.createdOrder.value.invoice_no,
                  })
                }}
              </p>
              <BaseButton
                class="mt-2"
                variant="link"
                :to="{
                  name: 'orders.show',
                  params: { id: sale.createdOrder.value.id },
                }"
                >{{ t('actions.view') }}</BaseButton
              >
            </div>
          </template>
          <div
            v-if="!canOverridePrice"
            class="rounded-[var(--radius-lg)] border border-info/25 bg-info-soft p-3 text-sm text-info"
          >
            {{ t('sales.pricePermissionRequired') }}
          </div>
        </div>
      </form>
      <OrderSummary
        :subtotal="sale.previewTotal.value"
        :total="sale.previewTotal.value"
        :paid="
          editing
            ? (sale.originalOrder.value?.paid_amount ?? 0)
            : sale.previewPaid.value
        "
        :remaining="
          editing
            ? Math.max(
                0,
                sale.previewTotal.value -
                  Number(sale.originalOrder.value?.paid_amount ?? 0),
              )
            : sale.previewRemaining.value
        "
      />
      <BaseButton
        full-width
        size="lg"
        type="button"
        :loading="sale.submitting.value"
        :disabled="!canSubmit"
        @click="submitSale"
        >{{ editing ? t('actions.save') : t('sales.completeSale') }} ·
        <MoneyDisplay :value="sale.previewTotal.value" currency="EGP"
      /></BaseButton>
    </aside>
  </div>

  <QuickCustomerDialog
    :open="customerDialogOpen"
    :loading="creatingCustomer"
    :countries-loading="adminStore.countriesLoading"
    :countries="adminStore.countries"
    :errors="customerErrors"
    @close="customerDialogOpen = false"
    @submit="createQuickCustomer"
  />
</template>
