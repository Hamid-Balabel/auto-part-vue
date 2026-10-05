<script setup lang="ts">
import { Printer, X } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import ProductItemIdentity from './ProductItemIdentity.vue'
import { useInvoiceBranding } from '../composables/useInvoiceBranding'
import type { Order } from '../types'

const props = defineProps<{
  open: boolean
  order: Order | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()
const { branding, ensureBrandingLoaded } = useInvoiceBranding(locale)

const customerPhone = computed(() => {
  if (props.order?.party?.phone) {
    return props.order.party.phone
  }
  const code = props.order?.customer?.phone_code ?? ''
  const phone = props.order?.customer?.phone ?? ''
  return code + phone
})

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—'
}

function lineTotal(item: NonNullable<Order['items']>[number]) {
  return item.line_total ?? item.total ?? item.subtotal
}

async function printInvoice() {
  await nextTick()
  window.print()
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    emit('close')
  }
}

watch(
  () => props.open,
  (open) => {
    document.body.classList.toggle('printing-invoice-preview', open)
    if (open) {
      document.addEventListener('keydown', onKeyDown)
      void ensureBrandingLoaded()
    } else {
      document.removeEventListener('keydown', onKeyDown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.classList.remove('printing-invoice-preview')
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <Teleport to="body">
  <div
    v-if="open && order"
    class="invoice-preview-modal fixed inset-0 z-50 flex items-center justify-center bg-text/60 p-3 backdrop-blur-sm sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="t('sales.invoicePreview')"
    @click.self="emit('close')"
  >
    <div class="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-elevated">
      <header class="invoice-modal-actions flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {{ t('sales.invoicePreview') }}
          </p>
          <h2 class="mt-1 truncate text-xl font-bold text-text">
            {{ t('sales.invoiceNo') }} {{ order.invoice_no }}
          </h2>
        </div>
        <BaseButton variant="ghost" size="sm" type="button" :aria-label="t('common.close')" @click="emit('close')">
          <X class="size-5" aria-hidden="true" />
        </BaseButton>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto bg-background p-3 sm:p-6">
        <article class="invoice-print-area mx-auto max-w-[210mm] rounded-[var(--radius-lg)] border border-border bg-white p-5 text-slate-950 shadow-card sm:p-8" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
          <header class="invoice-sheet-header flex flex-col gap-4 border-b-2 border-slate-900 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                {{ t('sales.invoice') }}
              </p>
              <h1 class="mt-2 text-3xl font-black text-slate-950">
                {{ branding.branchName || t('inventory.currentBranch') }}
              </h1>
              <div class="mt-2 space-y-1 text-sm text-slate-600">
                <p v-if="branding.companyName">{{ branding.companyName }}</p>
                <p v-if="branding.address">{{ branding.address }}</p>
                <p v-if="branding.phone">{{ t('admin.phone') }}: {{ branding.phone }}</p>
              </div>
            </div>
            <div class="rounded-2xl bg-slate-100 p-4 text-sm sm:min-w-56">
              <div class="flex justify-between gap-4">
                <span class="text-slate-500">{{ t('sales.invoiceNo') }}</span>
                <strong>{{ order.invoice_no }}</strong>
              </div>
              <div class="mt-2 flex justify-between gap-4">
                <span class="text-slate-500">{{ t('sales.orderDate') }}</span>
                <strong>{{ formatDate(order.created_at) }}</strong>
              </div>
            </div>
          </header>

          <section class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                {{ t('sales.customerInformation') }}
              </p>
              <p class="mt-2 font-bold">
  {{ order.party?.name ?? order.customer?.name ?? '—' }}
</p>
              <p v-if="customerPhone" class="mt-1 text-sm text-slate-600">
                {{ t('admin.phone') }}: {{ customerPhone }}
              </p>
            </div>
            <div class="rounded-2xl border border-slate-200 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                {{ t('sales.payment') }}
              </p>
              <dl class="mt-2 grid grid-cols-2 gap-2 text-sm">
                <dt class="text-slate-500">{{ t('sales.paymentMethod') }}</dt>
                <dd class="font-semibold">{{ order.display_payment_method ?? t(`sales.paymentMethods.${order.payment_method}`) }}</dd>
                <dt class="text-slate-500">{{ t('sales.paymentStatus') }}</dt>
                <dd class="font-semibold">{{ order.display_payment_status ?? t(`sales.statuses.${order.payment_status}`) }}</dd>
              </dl>
            </div>
          </section>

          <section class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table class="w-full border-collapse text-sm">
              <thead class="bg-slate-950 text-white">
                <tr>
                  <th class="px-3 py-3 text-start">{{ t('sales.productItem') }}</th>
                  <th class="px-3 py-3 text-center">{{ t('table.quantity') }}</th>
                  <th class="px-3 py-3 text-end">{{ t('sales.unitPrice') }}</th>
                  <th class="px-3 py-3 text-end">{{ t('sales.lineTotal') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="item in order.items ?? []" :key="item.id" class="align-top">
                  <td class="max-w-0 px-3 py-3">
                    <ProductItemIdentity :item="item.product_item" />
                  </td>
                  <td class="px-3 py-3 text-center font-bold tabular-nums">{{ item.quantity }}</td>
                  <td class="px-3 py-3 text-end tabular-nums">
                    <MoneyDisplay :value="item.price" currency="EGP" />
                  </td>
                  <td class="px-3 py-3 text-end font-bold tabular-nums">
                    <MoneyDisplay :value="lineTotal(item)" currency="EGP" />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="mt-5 flex justify-end">
            <dl class="w-full max-w-sm rounded-2xl bg-slate-100 p-4 text-sm">
              <div class="flex items-center justify-between gap-4 py-1">
                <dt class="text-slate-600">{{ t('sales.total') }}</dt>
                <dd class="font-bold"><MoneyDisplay :value="order.total" currency="EGP" /></dd>
              </div>
              <div class="flex items-center justify-between gap-4 py-1">
                <dt class="text-slate-600">{{ t('sales.paidAmount') }}</dt>
                <dd class="font-bold"><MoneyDisplay :value="order.paid_amount" currency="EGP" /></dd>
              </div>
              <div class="mt-2 flex items-center justify-between gap-4 border-t border-slate-300 pt-3 text-base">
                <dt class="font-black">{{ t('sales.remainingAmount') }}</dt>
                <dd class="font-black"><MoneyDisplay :value="order.remaining_amount" currency="EGP" /></dd>
              </div>
            </dl>
          </section>
        </article>
      </div>

      <footer class="invoice-modal-actions flex flex-wrap justify-end gap-3 border-t border-border px-4 py-4 sm:px-6">
        <BaseButton variant="outline" type="button" @click="emit('close')">{{ t('common.close') }}</BaseButton>
        <BaseButton type="button" @click="printInvoice"><Printer class="size-4" />{{ t('sales.printInvoice') }}</BaseButton>
      </footer>
    </div>
  </div>
  </Teleport>
</template>

<style>
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }

  body.printing-invoice-preview #app {
    display: none !important;
  }

  .invoice-preview-modal {
    position: static !important;
    inset: auto !important;
    display: block !important;
    padding: 0 !important;
    overflow: visible !important;
    background: white !important;
    backdrop-filter: none !important;
  }

  .invoice-preview-modal > div,
  .invoice-preview-modal .min-h-0 {
    display: block !important;
    max-height: none !important;
    overflow: visible !important;
    border: 0 !important;
    box-shadow: none !important;
    background: white !important;
    padding: 0 !important;
  }

  .invoice-modal-actions {
    display: none !important;
  }

  .invoice-print-area {
    position: absolute !important;
    inset: 0 auto auto 0 !important;
    width: 190mm !important;
    max-width: 190mm !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    color: #0f172a !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .invoice-print-area table {
    page-break-inside: auto;
  }

  .invoice-print-area tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
}
</style>
