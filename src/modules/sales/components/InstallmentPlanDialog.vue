<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/http'
import BaseSelect from '@/components/forms/BaseSelect.vue'
import DateInput from '@/components/forms/DateInput.vue'
import FormInput from '@/components/forms/FormInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import MoneyDisplay from '@/components/ui/MoneyDisplay.vue'
import { generateInstallmentPlan, generatePurchaseInstallmentPlan } from '../api'
import type { InstallmentPlanPayload, Order, PaymentMethod, Purchase } from '../types'

const props = defineProps<{ open: boolean; sourceType: 'order' | 'purchase'; sourceId: number | null; total: number | string; loading?: boolean }>()
const emit = defineEmits<{ close: []; success: [source: Order | Purchase] }>()
const { t } = useI18n()
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const errorMessage = ref('')
const today = new Date().toISOString().slice(0, 10)
const form = reactive({ installment_count: '1', initial_paid_amount: '0', first_due_date: today, interval_months: '1', payment_method: 'cash' as PaymentMethod })
const methodOptions = computed(() => (['cash', 'card', 'transfer'] as PaymentMethod[]).map((value) => ({ value, label: t(`sales.paymentMethods.${value}`) })))
function toCents(value: number | string) { const m = String(value ?? '0').trim().match(/^(\d+)(?:\.(\d{1,2}))?$/); return m ? Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0')) : null }
const totalCents = computed(() => toCents(props.total) ?? 0)
const initialCents = computed(() => toCents(form.initial_paid_amount || '0'))
const preview = computed(() => { const count = Number(form.installment_count); const remaining = Math.max(0, totalCents.value - (initialCents.value ?? 0)); return Number.isInteger(count) && count > 0 ? Math.floor(remaining / count) / 100 : 0 })
function firstError(field: string) { return errors.value[field]?.[0] }
function reset() { Object.assign(form, { installment_count: '1', initial_paid_amount: '0', first_due_date: today, interval_months: '1', payment_method: 'cash' }); errors.value = {}; errorMessage.value = '' }
function validate() { const e: Record<string, string[]> = {}; const count = Number(form.installment_count); const interval = Number(form.interval_months); if (!Number.isInteger(count) || count < 1 || count > 120) e.installment_count = [t('installments.countRange')]; if (!Number.isInteger(interval) || interval < 1 || interval > 12) e.interval_months = [t('installments.intervalRange')]; if (!form.first_due_date || form.first_due_date < today) e.first_due_date = [t('installments.dateToday')]; if (initialCents.value === null || initialCents.value < 0 || initialCents.value >= totalCents.value) e.initial_paid_amount = [t('installments.initialLessThanTotal')]; errors.value = e; return !Object.keys(e).length }
async function submit() { if (saving.value || !props.sourceId || !validate()) return; saving.value = true; errors.value = {}; errorMessage.value = ''; const payload: InstallmentPlanPayload = { installment_count: Number(form.installment_count), initial_paid_amount: form.initial_paid_amount || 0, first_due_date: form.first_due_date, interval_months: Number(form.interval_months), payment_method: form.payment_method }; try { const result = props.sourceType === 'purchase' ? await generatePurchaseInstallmentPlan(props.sourceId, payload) : await generateInstallmentPlan(props.sourceId, payload); emit('success', result); emit('close'); reset() } catch (error) { if (error instanceof ApiError) { errors.value = error.errors ?? {}; errorMessage.value = error.message } else errorMessage.value = t('sales.installmentSaveFailed') } finally { saving.value = false } }
watch(() => props.open, (open) => { if (open) reset() })
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[70] flex items-center justify-center bg-text/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form class="w-full max-w-xl rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-elevated" @submit.prevent="submit">
        <h2 class="text-xl font-bold">{{ t('sales.generateInstallmentPlan') }}</h2>
        <p v-if="errorMessage" class="mt-3 rounded-[var(--radius-md)] bg-danger/10 p-3 text-sm text-danger">{{ errorMessage }}</p>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <FormInput id="shared-plan-count" v-model="form.installment_count" type="number" min="1" max="120" :label="t('sales.installmentCount')" :error="firstError('installment_count')" required />
          <FormInput id="shared-plan-initial" v-model="form.initial_paid_amount" type="number" min="0" step="0.01" :label="t('sales.initialPaidAmount')" :error="firstError('initial_paid_amount')" />
          <DateInput id="shared-plan-date" v-model="form.first_due_date" :min="today" :label="t('sales.firstDueDate')" :error="firstError('first_due_date')" required />
          <FormInput id="shared-plan-interval" v-model="form.interval_months" type="number" min="1" max="12" :label="t('sales.intervalMonths')" :error="firstError('interval_months')" required />
          <BaseSelect id="shared-plan-method" v-model="form.payment_method" :label="t('sales.paymentMethod')" :options="methodOptions" :error="firstError('payment_method')" required />
          <p class="rounded-[var(--radius-lg)] border border-border bg-background/70 p-3 text-sm md:col-span-2">{{ t('installments.previewPerInstallment') }}: <MoneyDisplay :value="preview" currency="EGP" /></p>
        </div>
        <div class="mt-6 flex justify-end gap-2"><BaseButton variant="secondary" type="button" :disabled="saving" @click="emit('close')">{{ t('actions.cancel') }}</BaseButton><BaseButton type="submit" :loading="saving" :disabled="loading || !sourceId">{{ t('actions.save') }}</BaseButton></div>
      </form>
    </div>
  </Teleport>
</template>
