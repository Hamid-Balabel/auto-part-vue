<script setup lang="ts">
import {
  CheckCircle2,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  XCircle,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DetailsField from '@/components/ui/DetailsField.vue'
import DetailsSection from '@/components/ui/DetailsSection.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ApiError } from '@/api/http'
import { usePermissions } from '@/composables/usePermissions'
import { useLocalizedName } from '@/composables/useLocalizedName'
import { useToastStore } from '@/stores/toast'
import { changeOrderStatus, createPaidInstallment, getOrder } from '../api'
import type { OrderActionStatus } from '../orderWorkflow'
import type { Order } from '../types'
import OrderStatusDialog from '../components/OrderStatusDialog.vue'
import OrderSummary from '../components/OrderSummary.vue'
import ProductItemIdentity from '../components/ProductItemIdentity.vue'
import SalesStatusBadge from '../components/SalesStatusBadge.vue'
import AddPaymentDialog from '../components/AddPaymentDialog.vue'
import PaymentSummary from '../components/PaymentSummary.vue'
import PaymentsHistory from '../components/PaymentsHistory.vue'

const props = defineProps<{ id: string }>()
const { t, locale } = useI18n()
const localizedName = useLocalizedName()
const router = useRouter()
const toast = useToastStore()
const { can } = usePermissions()
const loading = ref(true)
const mutating = ref(false)
const order = ref<Order | null>(null)
const errorMessage = ref('')
const pendingAction = ref<NonNullable<Order['buttons']>[number] | null>(null)
const paymentDialogOpen = ref(false)
const paymentError = ref('')
const canAddPayment = computed(
  () =>
    Boolean(order.value) &&
    can('create-installment') &&
    !['cancelled', 'refunded'].includes(order.value!.status) &&
    order.value!.payment_status !== 'paid' &&
    Number(order.value!.remaining_amount) > 0,
)
const statusButtons = computed(() => order.value?.buttons ?? [])
const canEditOrder = computed(
  () => order.value?.status === 'pending' && can('update-order'),
)

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—'
}

function actionIcon(status: OrderActionStatus) {
  if (status === 'cancelled') return XCircle
  if (status === 'refunded') return RotateCcw
  return CheckCircle2
}

function isCustomPrice(item: NonNullable<Order['items']>[number]) {
  const systemPrice = item.product_item?.current_price
  return (
    systemPrice !== null &&
    systemPrice !== undefined &&
    Math.round(Number(systemPrice) * 100) !==
      Math.round(Number(item.price) * 100)
  )
}

function printInvoice() {
  window.print()
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    order.value = await getOrder(props.id)
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : t('details.failedToLoad')
  } finally {
    loading.value = false
  }
}

async function changeStatus(notes: string) {
  if (!order.value || !pendingAction.value) return
  mutating.value = true
  try {
    order.value = await changeOrderStatus(order.value.id, {
      status: pendingAction.value.key,
      notes: notes || null,
    })
    pendingAction.value = null
    toast.success(t('sales.statusChanged'))
  } catch (error) {
    toast.error(
      error instanceof ApiError ? error.message : t('sales.statusChangeFailed'),
    )
  } finally {
    mutating.value = false
  }
}

async function addPayment(payload: {
  amount: number
  payment_method: 'cash' | 'card'
}) {
  if (!order.value) return
  mutating.value = true
  paymentError.value = ''
  try {
    await createPaidInstallment({
      order_id: order.value.id,
      amount: payload.amount,
      status: 'paid',
      payment_method: payload.payment_method,
    })
    await load()
    paymentDialogOpen.value = false
    toast.success(t('sales.paymentRecorded'))
  } catch (error) {
    paymentError.value =
      error instanceof ApiError
        ? (error.errors?.amount?.[0] ?? error.message)
        : t('sales.paymentFailed')
    toast.error(paymentError.value)
  } finally {
    mutating.value = false
  }
}

onMounted(load)
watch(locale, () => { void load() })
</script>

<template>
  <div class="order-details-print">
    <PageHeader
      :title="
        order
          ? `${t('sales.order')} ${order.invoice_no}`
          : t('sales.orderDetails')
      "
      :description="t('sales.orderDetailsDescription')"
    >
      <template #actions>
        <BaseButton
          variant="outline"
          type="button"
          @click="router.push({ name: 'orders.index' })"
          >{{ t('sales.backToOrders') }}</BaseButton
        >
        <BaseButton
          v-if="order"
          variant="outline"
          type="button"
          @click="printInvoice"
          ><Printer class="size-4" />{{ t('sales.printInvoice') }}</BaseButton
        >
        <BaseButton
          v-if="canEditOrder && order"
          variant="secondary"
          :to="{ name: 'orders.edit', params: { id: order.id } }"
          ><Pencil class="size-4" />{{ t('actions.edit') }}</BaseButton
        >
        <BaseButton
          v-for="button in statusButtons"
          :key="button.key"
          :variant="
            button.key === 'cancelled' || button.key === 'refunded'
              ? 'danger'
              : 'primary'
          "
          type="button"
          @click="pendingAction = button"
        >
          <component :is="actionIcon(button.key)" class="size-4" />{{
            button.label
          }}
        </BaseButton>
        <BaseButton
          v-if="canAddPayment"
          variant="secondary"
          type="button"
          @click="paymentDialogOpen = true"
          ><Plus class="size-4" />{{ t('sales.addPayment') }}</BaseButton
        >
      </template>
    </PageHeader>

    <LoadingState v-if="loading" />
    <div
      v-else-if="errorMessage"
      class="panel border-danger/30 p-6 text-danger"
    >
      {{ errorMessage }}
    </div>
    <div v-else-if="order" class="grid min-w-0 gap-5">
      <div class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div class="grid min-w-0 gap-5">
          <DetailsSection class="min-w-0" :title="t('sales.orderInformation')">
            <dl class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <DetailsField
                :label="t('sales.invoiceNo')"
                :value="order.invoice_no"
              />
              <DetailsField :label="t('sales.orderStatus')"
                ><SalesStatusBadge :value="order.status"
              /></DetailsField>
              <DetailsField :label="t('sales.paymentStatus')"
                ><SalesStatusBadge :value="order.payment_status"
              /></DetailsField>
              <DetailsField
                :label="t('sales.paymentMethod')"
                :value="t(`sales.paymentMethods.${order.payment_method}`)"
              />
              <DetailsField
                :label="t('sales.createdBy')"
                :value="order.creator?.name"
              />
              <DetailsField
                :label="t('sales.createdAt')"
                :value="formatDate(order.created_at)"
              />
              <DetailsField
                :label="t('sales.updatedAt')"
                :value="formatDate(order.updated_at)"
              />
            </dl>
          </DetailsSection>

          <DetailsSection
            class="min-w-0"
            :title="t('sales.customerInformation')"
          >
            <dl class="grid gap-3 md:grid-cols-3">
              <DetailsField
                :label="t('sales.customer')"
                :value="order.customer?.name"
              />
              <DetailsField
                :label="t('admin.phone')"
                :value="
                  [order.customer?.phone_code, order.customer?.phone]
                    .filter(Boolean)
                    .join(' ')
                "
              />
              <DetailsField
                :label="t('admin.email')"
                :value="order.customer?.email"
              />
            </dl>
          </DetailsSection>
        </div>
        <OrderSummary
          :subtotal="order.total"
          :total="order.total"
          :paid="order.paid_amount"
          :remaining="order.remaining_amount"
        />
      </div>

      <DetailsSection class="min-w-0" :title="t('sales.orderItems')">
        <div class="w-full max-w-full overflow-x-auto">
          <table class="min-w-[680px] divide-y divide-border text-sm">
            <thead>
              <tr class="text-text-muted">
                <th class="px-3 py-3 text-start">
                  {{ t('sales.productItem') }}
                </th>
                <th class="px-3 py-3 text-start">{{ t('table.warehouse') }}</th>
                <th class="px-3 py-3 text-start">
                  {{ t('sales.systemPrice') }}
                </th>
                <th class="px-3 py-3 text-start">
                  {{ t('sales.orderSellingPrice') }}
                </th>
                <th class="px-3 py-3 text-start">{{ t('table.quantity') }}</th>
                <th class="px-3 py-3 text-start">{{ t('sales.lineTotal') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="item in order.items ?? []" :key="item.id">
                <td class="px-3 py-3">
                  <ProductItemIdentity :item="item.product_item" />
                </td>
                <td class="px-3 py-3">
                  {{
                    localizedName(item.warehouse)
                  }}
                </td>
                <td class="px-3 py-3">
                  <MoneyDisplay
                    v-if="
                      item.product_item?.current_price !== null &&
                      item.product_item?.current_price !== undefined
                    "
                    :value="item.product_item.current_price"
                    currency="EGP"
                  /><span v-else>—</span>
                </td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <MoneyDisplay
                      :value="item.price"
                      currency="EGP"
                    /><BaseBadge
                      v-if="isCustomPrice(item)"
                      variant="secondary"
                      >{{ t('sales.customPrice') }}</BaseBadge
                    >
                  </div>
                </td>
                <td class="px-3 py-3 font-bold tabular-nums">
                  {{ item.quantity }}
                </td>
                <td class="px-3 py-3">
                  <MoneyDisplay :value="item.subtotal" currency="EGP" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DetailsSection>

      <DetailsSection class="min-w-0" :title="t('sales.payments')">
        <PaymentSummary :order="order" />
        <div class="mt-5">
          <PaymentsHistory :payments="order.installments ?? []" />
        </div>
      </DetailsSection>

      <div class="grid min-w-0 gap-5">
        <DetailsSection class="min-w-0" :title="t('sales.statusHistory')">
          <ol v-if="order.logs?.length" class="space-y-4">
            <li
              v-for="log in order.logs"
              :key="log.id"
              class="border-s-2 border-primary/25 ps-4"
            >
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-semibold text-text">
                  {{
                    log.message ??
                    t(`sales.logActions.${log.action}`, log.action)
                  }}
                </p>
                <SalesStatusBadge
                  v-if="log.new_status"
                  :value="log.new_status"
                />
              </div>
              <p v-if="log.notes" class="mt-1 text-sm text-text-muted">
                {{ log.notes }}
              </p>
              <p class="mt-1 text-xs text-text-muted">
                {{ log.creator?.name ?? '—' }} ·
                {{ formatDate(log.created_at) }}
              </p>
            </li>
          </ol>
          <p v-else class="text-sm text-text-muted">
            {{ t('sales.noStatusHistory') }}
          </p>
        </DetailsSection>
      </div>
    </div>

    <OrderStatusDialog
      :open="pendingAction !== null"
      :status="pendingAction?.key ?? null"
      :action-label="pendingAction?.label"
      :loading="mutating"
      @close="pendingAction = null"
      @confirm="changeStatus"
    />
    <AddPaymentDialog
      v-if="order"
      :open="paymentDialogOpen"
      :total="order.total"
      :paid="order.paid_amount"
      :remaining="order.remaining_amount"
      :loading="mutating"
      :backend-error="paymentError"
      @close="paymentDialogOpen = false"
      @confirm="addPayment"
    />
  </div>
</template>

<style>
@media print {
  .nav-shell,
  .order-details-print > header button,
  .order-details-print > header a,
  .order-details-print [role='dialog'] {
    display: none !important;
  }

  .order-details-print {
    color: #000;
  }
}
</style>
