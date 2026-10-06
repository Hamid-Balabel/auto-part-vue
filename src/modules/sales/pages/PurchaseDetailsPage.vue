<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ApiError } from '@/api/http'
import BaseButton from '@/components/ui/BaseButton.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable.vue'
import DetailsField from '@/components/ui/DetailsField.vue'
import DetailsSection from '@/components/ui/DetailsSection.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ProductItemIdentity from '../components/ProductItemIdentity.vue'
import InstallmentPlanDialog from '../components/InstallmentPlanDialog.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useToastStore } from '@/stores/toast'
import { getPurchase, payInstallment } from '../api'
import type { Installment, PaymentMethod, Purchase } from '../types'
import type { ProductItemBatch } from '@/modules/inventory/types'

const props = defineProps<{ id: string }>()
const route = useRoute()
const { t, locale } = useI18n()
const { can } = usePermissions()
const toast = useToastStore()
const purchase = ref<Purchase | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const planOpen = ref(false)
const payOpen = ref(false)
const paying = ref(false)
const payErrors = ref<Record<string, string[]>>({})
const payErrorMessage = ref('')
const payMethod = ref<PaymentMethod>('cash')
const batchColumns = computed<DataTableColumn<ProductItemBatch>[]>(() => [
  { key: 'product_item', label: t('table.productItem') },
  { key: 'purchase_price', label: t('inventory.purchasePrice') },
  { key: 'total_original_quantity', label: t('inventory.originalQty') },
  { key: 'total_remaining_quantity', label: t('inventory.remainingQty') },
  { key: 'warehouse_stocks', label: t('inventory.warehouseQuantities') },
  { key: 'purchased_at', label: t('inventory.purchaseDate') },
])
const installmentColumns = computed<DataTableColumn<Installment>[]>(() => [
  { key: 'id', label: t('table.id') }, { key: 'amount', label: t('sales.installmentAmount') }, { key: 'settled_amount', label: t('installments.settledAmount') }, { key: 'remaining_amount', label: t('sales.remainingAmount') }, { key: 'due_date', label: t('sales.dueDate') }, { key: 'status', label: t('table.status') },
])
const canGeneratePlan = computed(() => Boolean(purchase.value) && can('create-installment') && !purchase.value!.installments?.length && Number(purchase.value!.total ?? 0) > 0)
const payableInstallment = computed(() => (purchase.value?.installments ?? []).find((item) => item.direction === 'payable' && (item.status === 'pending' || item.status === 'partial') && Number(item.remaining_amount ?? item.amount ?? 0) > 0) ?? null)
const canPayInstallment = computed(() => Boolean(payableInstallment.value) && can('update-installment'))
const paymentMethodOptions = computed(() => (['cash', 'card', 'transfer'] as PaymentMethod[]).map((value) => ({ value, label: t(`sales.paymentMethods.${value}`) })))
function formatDate(value?: string | null, withTime = false) { return value ? new Intl.DateTimeFormat(locale.value, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(value)) : '—' }
async function load() { loading.value = true; errorMessage.value = ''; try { purchase.value = await getPurchase(props.id) } catch (e) { errorMessage.value = e instanceof ApiError ? e.message : t('details.failedToLoad') } finally { loading.value = false } }
function warehouseStocks(batch: ProductItemBatch) { return (batch.warehouse_stocks ?? []).map((stock) => `#${stock.warehouse_id}: ${stock.remaining_quantity}/${stock.original_quantity}`).join(' · ') || '—' }
function openPayDialog() { if (!payableInstallment.value) return; payMethod.value = (payableInstallment.value.payment_method as PaymentMethod) || (purchase.value?.payment_method as PaymentMethod) || 'cash'; payErrors.value = {}; payErrorMessage.value = ''; payOpen.value = true }
async function submitPayment() { if (paying.value || !payableInstallment.value) return; paying.value = true; payErrors.value = {}; payErrorMessage.value = ''; try { await payInstallment(payableInstallment.value.id, { amount: payableInstallment.value.remaining_amount ?? payableInstallment.value.amount, payment_method: payMethod.value }); toast.success(t('sales.installmentPaid')); payOpen.value = false; await load() } catch (e) { if (e instanceof ApiError) { payErrors.value = e.errors ?? {}; payErrorMessage.value = e.message; if ([404, 409].includes(e.statusCode ?? 0)) await load() } else payErrorMessage.value = t('sales.paymentFailed') } finally { paying.value = false } }
onMounted(async () => { await load(); if (route.query.plan === '1' && canGeneratePlan.value) planOpen.value = true })
</script>

<template>
  <PageHeader :title="purchase?.invoice_no ?? `${t('purchases.details')} #${id}`" :description="t('purchases.detailsDescription')"><template #actions><BaseButton variant="secondary" :to="{ name: 'purchases.index' }">{{ t('actions.back') }}</BaseButton><BaseButton v-if="canPayInstallment" type="button" :disabled="paying" @click="openPayDialog">{{ t('sales.payInstallment') }}</BaseButton><BaseButton v-if="canGeneratePlan" type="button" @click="planOpen = true">{{ t('sales.generateInstallmentPlan') }}</BaseButton></template></PageHeader>
  <p v-if="errorMessage" class="rounded-[var(--radius-md)] bg-danger/10 p-3 text-sm text-danger">{{ errorMessage }}</p>
  <div v-if="purchase" class="grid gap-5">
    <DetailsSection :title="t('details.mainInformation')"><dl class="grid gap-3 md:grid-cols-3"><DetailsField :label="t('parties.supplier')" :value="purchase.party?.name ?? purchase.supplier_party?.name" /><DetailsField :label="t('sales.invoiceNo')" :value="purchase.invoice_no" /><DetailsField :label="t('sales.total')"><MoneyDisplay :value="purchase.total ?? 0" currency="EGP" /></DetailsField><DetailsField :label="t('sales.paidAmount')"><MoneyDisplay :value="purchase.paid_amount ?? 0" currency="EGP" /></DetailsField><DetailsField :label="t('sales.remainingAmount')"><MoneyDisplay :value="purchase.remaining_amount ?? 0" currency="EGP" /></DetailsField><DetailsField :label="t('sales.paymentStatus')" :value="purchase.payment_status ? t(`sales.paymentStatuses.${purchase.payment_status}`) : '—'" /><DetailsField :label="t('table.createdAt')" :value="formatDate(purchase.created_at, true)" /></dl></DetailsSection>
    <DetailsSection :title="t('purchases.batches')"><DataTable :columns="batchColumns" :rows="purchase.batches ?? []"><template #cell-product_item="{ row }"><ProductItemIdentity :item="row.product_item ?? null" /><span v-if="!row.product_item">#{{ row.product_item_id }}</span></template><template #cell-purchase_price="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template><template #cell-total_original_quantity="{ value }">{{ value ?? '—' }}</template><template #cell-total_remaining_quantity="{ value }">{{ value ?? '—' }}</template><template #cell-warehouse_stocks="{ row }">{{ warehouseStocks(row) }}</template><template #cell-purchased_at="{ value }">{{ formatDate(value as string) }}</template></DataTable></DetailsSection>
    <DetailsSection :title="t('sales.installmentsTitle')"><DataTable :columns="installmentColumns" :rows="purchase.installments ?? []"><template #cell-amount="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template><template #cell-settled_amount="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template><template #cell-remaining_amount="{ value }"><MoneyDisplay :value="value as string" currency="EGP" /></template><template #cell-due_date="{ value }">{{ formatDate(value as string) }}</template><template #cell-status="{ value }">{{ t(`sales.statuses.${value}`) }}</template></DataTable></DetailsSection>
  </div>
  <InstallmentPlanDialog :open="planOpen" source-type="purchase" :source-id="purchase?.id ?? null" :total="purchase?.total ?? 0" @close="planOpen = false" @success="async () => { toast.success(t('sales.installmentPlanCreated')); planOpen = false; await load() }" />
  <Teleport to="body">
    <div v-if="payOpen && payableInstallment" class="fixed inset-0 z-50 flex items-center justify-center bg-text/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form class="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-elevated" @submit.prevent="submitPayment">
        <h2 class="text-xl font-bold">{{ t('sales.payInstallment') }}</h2>
        <p class="mt-2 text-sm text-text-muted">{{ t('sales.exactInstallmentPaymentHint') }}</p>
        <p v-if="payErrorMessage" class="mt-3 rounded-[var(--radius-md)] bg-danger/10 p-3 text-sm text-danger">{{ payErrorMessage }}</p>
        <div class="mt-5 grid gap-4">
          <DetailsField :label="t('sales.remainingAmount')"><MoneyDisplay :value="payableInstallment.remaining_amount ?? payableInstallment.amount" currency="EGP" /></DetailsField>
          <SelectInput id="purchase-pay-method" v-model="payMethod" :label="t('sales.paymentMethod')" :options="paymentMethodOptions" :error="payErrors.payment_method?.[0]" required />
          <p v-if="payErrors.amount?.[0] || payErrors._validation?.[0]" class="form-error">{{ payErrors.amount?.[0] || payErrors._validation?.[0] }}</p>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <BaseButton variant="secondary" type="button" :disabled="paying" @click="payOpen = false">{{ t('actions.cancel') }}</BaseButton>
          <BaseButton type="submit" :loading="paying">{{ t('sales.recordPayment') }}</BaseButton>
        </div>
      </form>
    </div>
  </Teleport>
</template>
